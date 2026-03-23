## PRD – Limitaciones por plan (Backend)

### 1. Contexto

- App móvil **Mi Libro App** (Expo/React Native) consumiendo backend **NestJS** con base de datos en **Supabase/Postgres** usando **Prisma**.
- El modelo `User` ya incluye un campo `planId` y existe una tabla de `Plan` (según `frontend_prd.md` y `schema.prisma`).
- La landing (`landing_page_prd.md`) define 3 planes:
  - **Free** (0 USD)
  - **Premium** (mensual/anual)
  - **De por vida / Lifetime** (pago único)
- El frontend ha implementado **soft limits** (bloqueos en UI) pero **la lógica real de límites debe vivir en el backend**.

Objetivo de este PRD: definir todo lo que debe hacer el backend para:

- Hacer cumplir los límites de cada plan (libros, IA, etc.).
- Exponer la información de planes y uso para que el frontend pueda mostrarla.
- Preparar la base para billing/upgrade/downgrade más adelante.

---

### 2. Modelado de datos (Prisma + Supabase/Postgres)

#### 2.1. Tabla `Plan`

Extender/crear el modelo `Plan` en `schema.prisma`:

- **Campos mínimos**:
  - `id` (PK, int autoincrement o UUID)
  - `slug` (string único): `"free"`, `"premium"`, `"lifetime"`
  - `name` (string): `"Free"`, `"Premium"`, `"De por vida"`
  - `description` (string, opcional)
  - `bookLimit` (int, nullable): nº máximo de libros permitidos. `null` = ilimitado
  - `monthlyAiLimit` (int, nullable): nº máximo de recomendaciones IA al mes. `null` = ilimitado
  - `isPaid` (boolean)
  - `createdAt`, `updatedAt`

- **Seed inicial** (script `prisma/seed` o migración):
  - Plan Free:
    - `slug = "free"`
    - `bookLimit = 100` (alineado con frontend)
    - `monthlyAiLimit = 5`
    - `isPaid = false`
  - Plan Premium:
    - `slug = "premium"`
    - `bookLimit = null`
    - `monthlyAiLimit = null` (o un límite alto razonable, ej. 1000)
    - `isPaid = true`
  - Plan Lifetime:
    - `slug = "lifetime"`
    - `bookLimit = null`
    - `monthlyAiLimit = null`
    - `isPaid = true`

#### 2.2. Relación `User` – `Plan`

Asegurar en `schema.prisma`:

- `User` tiene:
  - `planId` (FK → `Plan.id`, nullable)
  - `plan` relación Prisma
- Comportamiento por defecto:
  - En creación de usuario, si no se especifica `planId`, asignar automáticamente el plan `free`.

#### 2.3. Tracking de uso de IA

Crear una entidad para contabilizar las recomendaciones IA por mes:

- Tabla `MonthlyAiUsage` (nombre orientativo):
  - `id` (PK)
  - `userId` (FK → `User.id`)
  - `year` (int)
  - `month` (int, 1–12)
  - `count` (int)
  - `createdAt`, `updatedAt`
  - Índice único compuesto `(userId, year, month)` para upsert.

> Alternativa: usar un campo agregado en otra tabla, pero este modelo es simple y explícito.

---

### 3. Reglas de negocio por plan

#### 3.1. Límite de libros por plan

- **Free**:
  - Máximo `Plan.bookLimit` libros (ej. 100).
  - Si el usuario intenta crear el libro nº 101:
    - El endpoint `POST /books` debe devolver error:
      - Código: `403 Forbidden` o `409 Conflict`
      - Mensaje: `"Límite de libros alcanzado para tu plan. Actualiza a Premium para añadir más."`
- **Premium / Lifetime**:
  - Sin límite (o límite muy alto definido en `Plan.bookLimit = null`).

#### 3.2. Límite mensual de IA por plan

- **Free**:
  - Máximo `Plan.monthlyAiLimit` recomendaciones IA al mes (ej. 5).
  - Si el usuario intenta guardar una recomendación adicional:
    - El endpoint `POST /ai/recomendaciones` (o `/ai/recommendations`) debe:
      - Verificar el uso actual del mes.
      - Si está por encima del límite:
        - Devolver `403 Forbidden` con mensaje:
          - `"Has alcanzado el límite mensual de IA de tu plan. Actualiza a Premium para seguir usando esta función."`
- **Premium / Lifetime**:
  - `monthlyAiLimit = null` → sin límite práctico (puede añadirse un límite de seguridad alto en el futuro).

#### 3.3. Otros permisos (roadmap)

- **Estadísticas avanzadas, gamificación avanzada, listas inteligentes, sin anuncios, soporte prioritario**:
  - No requieren bloqueos fuertes en v1, pero sí:
    - Exponer en el API qué “entitlements” tiene el plan (para que el frontend pueda decidir qué mostrar).
  - Ejemplo de estructura de “entitlements” en respuesta de `/users/me`:
    - `plan: { id, slug, name, bookLimit, monthlyAiLimit, isPaid }`

---

### 4. Cambios en la API (NestJS)

#### 4.1. Endpoint `/users/me`

- **Objetivo**: que el frontend no tenga que adivinar límites.
- Cambios:
  - Incluir en la respuesta de `GET /users/me`:
    - Datos básicos del usuario (ya existen).
    - Objeto `plan`:
      - `id`
      - `slug`
      - `name`
      - `bookLimit`
      - `monthlyAiLimit`
      - `isPaid`
  - Opcional: normalizar nombres a camelCase (`bookLimit`, `monthlyAiLimit`) para que cliente y servidor sean coherentes.

#### 4.2. Endpoint `POST /books`

- **Dónde**: controlador de libros (`BooksController` / `BooksService`).
- **Lógica nueva**:
  1. Obtener el usuario autenticado (`request.user`).
  2. Cargar su `plan` desde Prisma (`include: { plan: true }`).
  3. Si `plan.bookLimit` no es `null`:
     - Contar libros actuales del usuario (`count` en `Book` por `userId`).
     - Si `count >= plan.bookLimit`:
       - Lanzar excepción HTTP:
         - `throw new ForbiddenException("Límite de libros alcanzado para tu plan. Actualiza a Premium para añadir más.");`
  4. Si no hay límite o no se ha alcanzado, continuar con la creación normal del libro.

#### 4.3. Endpoint `POST /ai/recomendaciones`

- **Dónde**: controlador de IA / recomendaciones IA.
- **Lógica nueva**:
  1. Obtener usuario autenticado y su `plan`.
  2. Si `plan.monthlyAiLimit` es `null` → sin límite → crear recomendación y guardar.
  3. Si `plan.monthlyAiLimit` tiene valor:
     - Calcular `year` y `month` actuales (en UTC).
     - Hacer `upsert` en tabla `MonthlyAiUsage`:
       - Leer registro existente `(userId, year, month)`.
       - Si no existe, `count = 0`.
     - Si `count >= plan.monthlyAiLimit`:
       - Lanzar `ForbiddenException` con mensaje de límite.
     - Si no, incrementar:
       - `count = count + 1` y guardar.
  4. Continuar con la lógica actual de guardado en `AIRecommendation`.

> Nota: si ya se guarda cada recomendación IA en una tabla `AIRecommendation`, también se puede calcular el uso del mes con un `count` agrupado; `MonthlyAiUsage` es una optimización para no recalcular en cada llamada.

#### 4.4. Manejo de errores y códigos

- Normalizar mensajes de error relacionados con límites:
  - `code`: `PLAN_LIMIT_REACHED` (en el cuerpo JSON).
  - Ejemplo de respuesta:
    - `statusCode: 403`
    - `message: "Límite de libros alcanzado para tu plan. Actualiza a Premium para añadir más."`
    - `error: "PLAN_LIMIT_REACHED"`
    - `limitType: "books" | "ai"`

Esto permite que el frontend muestre mensajes diferenciados y CTA de upgrade.

---

### 5. Gestión de planes y upgrades

> Esta sección es parcialmente de **roadmap**, pero conviene dejarla descrita.

#### 5.1. Cambio de plan manual (admin)

- Crear endpoints o comandos de administración (NestJS CLI / scripts) para:
  - Asignar plan a un usuario (`free`, `premium`, `lifetime`).
  - Ver usuarios por plan.

#### 5.2. Integración con sistema de pagos (futuro)

- Pendiente definir proveedor (Stripe, Paddle, Supabase Billing, etc.).
- Requisitos mínimos:
  - Webhook que, tras pago confirmado:
    - Asigne `planId` correspondiente al usuario.
  - Para plan `lifetime`: marcar plan permanente (sin expiración).

---

### 6. Seguridad y validaciones adicionales

- **Autorización**:
  - Asegurar que todos los endpoints de libros e IA usan siempre el `userId` del JWT para filtrar; nunca se debe permitir actuar sobre recursos de otro usuario.
- **Rate limiting**:
  - Añadir rate limiting general para endpoints “caros”:
    - `/books/search` (usa Google Books / Open Library).
    - `/ai/recomendaciones` (si en el futuro llama a un modelo de IA directamente).
- **Consistencia con frontend**:
  - Documentar en README/`frontend_prd.md` los valores reales de `bookLimit` y `monthlyAiLimit` por plan, para evitar divergencias.

---

### 7. Checklist de implementación (backend)

- [ ] Actualizar `schema.prisma` con modelo `Plan` completo y relación con `User`.
- [ ] Crear migración Prisma y aplicarla en Supabase.
- [ ] Seed inicial de planes (`free`, `premium`, `lifetime`).
- [ ] Añadir tabla `MonthlyAiUsage` (o mecanismo equivalente).
- [ ] Actualizar `GET /users/me` para incluir objeto `plan` con límites.
- [ ] Implementar validación de `bookLimit` en `POST /books`.
- [ ] Implementar validación de `monthlyAiLimit` en `POST /ai/recomendaciones`.
- [ ] Normalizar mensajes y estructura de errores de límite (`PLAN_LIMIT_REACHED`).
- [ ] Añadir scripts/endpoints internos para cambiar `planId` de un usuario (admin).
- [ ] Documentar comportamiento en `CURL_ENDPOINTS.md` o docs de API.

