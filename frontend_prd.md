# PRD – Mi Libro App (Frontend)

## Documento de requisitos del producto – Aplicación móvil

**Versión:** 1.0  
**Stack:** React Native + Expo  
**Diseño de referencia:** [Figma – milibroapp](https://www.figma.com/design/ypbisX815l4XYHrYtDgA38/milibroapp?node-id=0-1&p=f&t=inAJCXZgRO2Fmncr-0)  
**Backend:** API NestJS (shelfie-bk) – Base URL: `http://localhost:3000/api` (configurable por entorno)

---

## 1. Resumen ejecutivo

Aplicación móvil para gestionar una biblioteca personal de libros: registro, búsqueda por ISBN o por nombre, seguimiento de lectura (páginas, estado), perfil de usuario con XP/nivel/rachas y recomendaciones IA. Inicio de sesión con email/contraseña, Google y **login biométrico** (Face ID / Touch ID). Escaneo de código de barras ISBN con la cámara y, cuando el ISBN no se encuentre, búsqueda por título/autor. Capacidad de **editar** y **eliminar** libros.

La UI debe basarse en las pantallas y componentes definidos en el archivo Figma indicado, adaptando estilos y flujos a React Native/Expo.

---

## 2. Objetivos y alcance

| Objetivo | Descripción |
|----------|-------------|
| **Autenticación** | Login con email/password, Google y biométrico; registro; sesión persistente con JWT. |
| **Biblioteca personal** | Añadir, listar, ver detalle, **editar** y **eliminar** libros. |
| **Búsqueda de libros** | Escaneo de ISBN con cámara; búsqueda por nombre (título/autor) cuando no hay ISBN o no hay resultados. |
| **Seguimiento de lectura** | Estados (pendiente, en lectura, leído), páginas leídas, XP y racha. |
| **Perfil y gamificación** | Perfil de usuario (nombre, etc.), XP, nivel, racha de lectura. |
| **Recomendaciones IA** | Guardar recomendaciones generadas por IA (consumiendo el endpoint existente). |

**Fuera de alcance en este PRD:** Implementación del backend (ya existe en shelfie-bk).

---

## 3. Usuarios y flujos principales

- **Usuario no autenticado:** Solo puede ver pantallas de login/registro y opción de login biométrico (si ya tiene sesión previa).
- **Usuario autenticado:** Acceso a biblioteca, escáner, búsqueda, detalle/edición/eliminación de libros, perfil y recomendaciones IA.

Flujos clave:

1. **Login** → Email/password, Google o biométrico → Guardar `accessToken` y opcionalmente habilitar biométrico para próximos inicios.
2. **Añadir libro** → Escanear ISBN **o** buscar por nombre → Seleccionar/completar resultado → Crear libro (POST /books).
3. **Gestionar libro** → Ver detalle → **Editar** (PATCH /books/:id) o **Eliminar** (DELETE /books/:id).
4. **Progreso** → Actualizar páginas leídas (PATCH /books/:id/pages) → Reflejar XP y racha en perfil.

---

## 4. Diseño y experiencia

- **Referencia de diseño:** Todas las pantallas y componentes deben basarse en el diseño Figma **milibroapp** (enlace anterior). Se deben respetar:
  - Paleta de colores, tipografía y espaciados.
  - Estructura de pantallas (login, registro, listado de libros, detalle de libro, perfil, etc.).
  - Componentes reutilizables (botones, campos, tarjetas de libro, navegación).
- **Adaptación:** Traducir diseños de Figma a componentes React Native (Views, Text, TouchableOpacity/Pressable, etc.) y estilos (StyleSheet o solución tipo NativeWind/Tamagui si se usa). Considerar safe areas y tamaños de pantalla (responsive).
- **Accesibilidad:** Etiquetas para lectores de pantalla, contraste suficiente y áreas táctiles mínimas (44pt recomendado).

---

## 5. Funcionalidades detalladas

### 5.1 Autenticación

| Funcionalidad | Descripción | API / Notas |
|---------------|-------------|-------------|
| **Registro** | Formulario: nombre, email, contraseña. Envío a backend. | `POST /api/auth/register` |
| **Login email/password** | Formulario: email, contraseña. Guardar `accessToken` (ej. almacenamiento seguro). | `POST /api/auth/login` |
| **Login con Google** | Usar Firebase Auth en el cliente; enviar `idToken` al backend. | `POST /api/auth/google` con `{ "idToken": "..." }` |
| **Login biométrico** | Face ID (iOS) / Touch ID (Android/iOS). No reemplaza la autenticación del servidor: tras verificar biometría, usar credenciales almacenadas de forma segura (ej. Keychain/Keystore) para obtener o refrescar JWT, o usar un token previamente guardado y solo desbloquear acceso con biometría. | Mismo `accessToken` que login; almacenamiento seguro con `expo-local-authentication` + `expo-secure-store`. |
| **Cerrar sesión** | Limpiar token y, si se desea, desactivar opción de login biométrico hasta próximo login. | Cliente solamente |
| **Persistencia de sesión** | Guardar JWT en SecureStore; al abrir la app, si hay token válido (y opcionalmente biometría), ir a home. | Cliente |

Requisitos de login biométrico:

- Usar `expo-local-authentication` para detectar disponibilidad (Face ID / Touch ID) y mostrar opción solo si está disponible.
- Usar `expo-secure-store` para guardar el token de forma segura cuando el usuario active “Iniciar con biometría”.
- Al abrir la app: si hay token guardado y el usuario eligió biometría, pedir autenticación biométrica antes de considerar la sesión “activa” y navegar al contenido.

### 5.2 Biblioteca de libros

| Funcionalidad | Descripción | API / Notas |
|---------------|-------------|-------------|
| **Listar mis libros** | Lista de libros del usuario, ordenada por fecha de alta (desc). Diseño según Figma. | `GET /api/books` (Header: `Authorization: Bearer <token>`) |
| **Ver detalle de libro** | Pantalla con todos los datos del libro y acciones Editar / Eliminar. | `GET /api/books/:id` |
| **Añadir libro** | Flujo: escanear ISBN **o** buscar por nombre → seleccionar resultado unificado → formulario para completar/editar campos → crear. | Búsqueda: `GET /api/books/search?isbn=...` o `?q=...`; Crear: `POST /api/books` |
| **Editar libro** | Desde el detalle, formulario con campos editables (título, autor, ISBN, género, totalPages, pagesRead, readingStatus, isOwned, isBorrowed, borrowedToName, etc.). Guardar cambios. | `PATCH /api/books/:id` con body parcial (UpdateBookDto). |
| **Eliminar libro** | Desde el detalle (o lista con menú contextual), confirmación y luego borrado. | `DELETE /api/books/:id` |
| **Actualizar páginas leídas** | En detalle o en celda de lista: actualizar “páginas leídas”; puede otorgar XP y actualizar racha. | `PATCH /api/books/:id/pages` con `{ "pagesRead": number }` |

Campos de libro (alineados con backend):

- **Crear:** title (requerido), author, isbn, description, imageUrl, genre, totalPages, isOwned (default true), readingStatus (pending | in_progress | read).
- **Actualizar:** además de los anteriores: pagesRead, isBorrowed, borrowedToName, borrowedAt.
- **Estados de lectura:** `pending`, `in_progress`, `read` (mapear a etiquetas en español en UI si se desea).

### 5.3 Búsqueda de libros (fuentes externas)

| Funcionalidad | Descripción | API / Notas |
|---------------|-------------|-------------|
| **Escaneo de ISBN** | Abrir cámara, escanear código de barras ISBN (10 o 13 dígitos). Enviar ISBN al backend para búsqueda. | `GET /api/books/search?isbn=<isbn>` |
| **Búsqueda por nombre** | Cuando no se use cámara, no se encuentre ISBN o no haya resultados por ISBN: campo de búsqueda por título/autor. | `GET /api/books/search?q=<texto>&limit=10` (limit 1–20) |
| **Resultados unificados** | Mostrar lista de resultados con: title, isbn, author, description, imageUrl, genre, totalPages, source. Permitir seleccionar uno y pasar a formulario de “Añadir libro” con campos pre-rellenados. | Respuesta del search; formato compatible con POST /books (mapear a title, author, isbn, etc.). |
| **Sin resultados** | Mensaje claro y opción de “Añadir manualmente” con formulario sin prellenar (solo título obligatorio). | Cliente |

Requisitos de escaneo:

- Usar una lib de escaneo de códigos de barras en Expo (ej. `expo-camera` con `expo-barcode-scanner` o la API de código de barras disponible en el SDK de Expo en uso).
- Solicitar permisos de cámara y manejar rechazo/error.
- Tras leer el código, validar que sea un ISBN válido (10 o 13 dígitos) y llamar a `GET /api/books/search?isbn=...`. Si no hay resultados, ofrecer búsqueda por nombre o añadir manualmente.

### 5.4 Perfil de usuario

| Funcionalidad | Descripción | API / Notas |
|---------------|-------------|-------------|
| **Ver perfil** | Mostrar nombre, email, XP, nivel, racha de lectura, etc. (según Figma y modelo User). | `GET /api/users/me` |
| **Editar perfil** | Actualizar nombre (y otros campos si el backend lo permite en el futuro). | `PATCH /api/users/me` |

Campos de usuario (del backend): name, email, xpPoints, level, readingStreakDays, lastReadAt, planId (plan puede incluir bookLimit, monthlyAiLimit).

### 5.5 Recomendaciones IA

| Funcionalidad | Descripción | API / Notas |
|---------------|-------------|-------------|
| **Guardar recomendación** | Cuando la app genere o muestre recomendaciones de IA, enviar al backend para historial. | `POST /api/ai/recommendations` con `promptSent`, `aiResponseJson`, `aiModel` (CreateRecommendationDto). |

Integración: si en una pantalla “Recomendaciones” o “IA” el usuario envía un prompt y recibe una respuesta (ya sea desde un servicio externo en el cliente o desde un endpoint futuro), la app debe llamar a este endpoint para persistir la recomendación.

---

## 6. Integración con la API (resumen)

Todas las peticiones a la API deben incluir el header:

- `Authorization: Bearer <accessToken>`
- `Content-Type: application/json` en POST/PATCH.

Excepción: registro, login y login con Google son públicos (no envían Bearer).

| Área | Endpoints utilizados |
|------|----------------------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/google` |
| Usuarios | `GET /api/users/me`, `PATCH /api/users/me` |
| Libros | `GET /api/books`, `GET /api/books/search?q=...|isbn=...`, `POST /api/books`, `GET /api/books/:id`, `PATCH /api/books/:id`, `PATCH /api/books/:id/pages`, `DELETE /api/books/:id` |
| IA | `POST /api/ai/recommendations` |

Manejo de errores: interpretar códigos 4xx/5xx y mensajes del backend; mostrar mensajes amigables (ej. “Límite de libros alcanzado”, “Credenciales incorrectas”, “Libro no encontrado”).

---

## 7. Requisitos no funcionales

- **Rendimiento:** Listas largas de libros con virtualización (FlatList) y, si aplica, paginación si el backend la soporta en el futuro.
- **Seguridad:** JWT y datos sensibles en SecureStore; no loguear tokens; HTTPS en producción.
- **Offline:** Opcional para una fase posterior (caché de lista de libros, cola de escrituras). En este PRD se asume conexión para operaciones con la API.
- **Sistema:** Soporte iOS y Android; mínimo versiones soportadas según recomendaciones de Expo.
- **Internacionalización:** Preparar textos en español como idioma principal; estructura que permita añadir más idiomas después si se desea.

---

## 8. Stack técnico recomendado

| Capa | Tecnología |
|------|------------|
| Framework | React Native con **Expo** (SDK estable recomendado) |
| Lenguaje | TypeScript |
| Navegación | React Navigation (Stack + Tab o Drawer según Figma) |
| Estado global | React Context + hooks o Zustand/Redux según complejidad |
| HTTP | fetch o axios; base URL y header Authorization inyectados |
| Almacenamiento seguro | expo-secure-store (token, preferencia de biométrico) |
| Biometría | expo-local-authentication |
| Cámara / códigos de barras | expo-camera + API de barcode del SDK Expo |
| Estilos | StyleSheet o NativeWind/Tamagui alineado con Figma |

---

## 9. Entregables y criterios de aceptación

- [ ] Pantallas de login (email/password, Google, biométrico) y registro alineadas con Figma.
- [ ] Login biométrico: opción para activar y usar Face ID / Touch ID para desbloquear sesión guardada.
- [ ] Escaneo de ISBN con cámara y uso de `GET /api/books/search?isbn=...`.
- [ ] Búsqueda por nombre (título/autor) cuando no hay ISBN o no hay resultados por ISBN; uso de `GET /api/books/search?q=...`.
- [ ] Flujo completo: añadir libro desde resultado de búsqueda o manual; listar, ver detalle, **editar** y **eliminar** libros.
- [ ] Actualización de páginas leídas y reflejo de XP/nivel/racha en perfil.
- [ ] Perfil de usuario (ver y editar) y guardado de recomendaciones IA cuando aplique.
- [ ] Diseño basado en el archivo Figma milibroapp y uso de todos los servicios listados en la sección 6.

---

## 10. Referencias

- **Diseño:** [Figma – milibroapp](https://www.figma.com/design/ypbisX815l4XYHrYtDgA38/milibroapp?node-id=0-1&p=f&t=inAJCXZgRO2Fmncr-0)
- **API backend:** `docs/CURL_ENDPOINTS.md` en este repositorio (shelfie-bk)
- **Modelo de datos:** `prisma/schema.prisma` (User, Book, BookNote, Plan, AIRecommendation, Achievement, UserAchievement)
