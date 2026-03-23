## PRD — Landing Page (Angular) para vender My Book App

### Resumen
Landing page de marketing para **vender y convertir** usuarios hacia descargas de la app y suscripciones. Incluye propuesta de valor, secciones de producto, prueba social, FAQs, tabla de precios con **Plan Gratuito**, **Plan Premium** (mensual/anual) y **Plan De por Vida**, además de tracking y requisitos SEO/performance.

---

## 1) Objetivo y métricas

### Objetivo principal
- **Convertir visitantes** en:
  - Descargas (App Store / Google Play)
  - Registros (plan gratis)
  - Compras/upgrade (Premium o De por vida)

### KPIs
- **CTR** de CTAs “Descargar en iOS/Android”
- **% de scroll** hasta sección “Precios”
- **Conversion rate** por plan (click → store/checkout/deep-link)
- **Bounce rate** del hero

---

## 2) Público objetivo (personas)

### Persona A — “Lector/a organizado/a”
- Tiene biblioteca (física y/o digital), compra seguido
- Quiere **orden**: saber qué tiene, qué leyó, qué sigue

### Persona B — “Lector/a en racha”
- Quiere metas, retos y motivación
- Responde bien a **gamificación** y “streaks”

### Persona C — “Indeciso/a”
- Lee intermitente
- Necesita **recomendaciones claras** para elegir qué leer

---

## 3) Propuesta de valor y posicionamiento

### Promesa (one-liner)
**“Organiza tu biblioteca, descubre tu próxima lectura y vuelve el hábito divertido.”**

### Beneficios clave (mensajes)
- **Escanea y añade libros** en segundos (barcode/ISBN)
- **Recomendaciones personalizadas** (incluyendo IA donde aplique)
- **Gamificación**: logros, retos y rachas para leer más
- **Perfil lector**: estadísticas y metas en un solo lugar

### Diferenciación
- Enfoque en “mi biblioteca personal” + motivación (gamificación) + recomendaciones inteligentes.

---

## 4) Alcance (Scope)

### Incluido
- Landing responsive (mobile-first)
- Secciones de marketing + pricing
- Integración de analytics (eventos de conversión)
- SEO + performance (Core Web Vitals)
- Privacidad, términos y contacto

### No incluido (por ahora)
- Blog completo (opcional futuro)
- CMS (opcional futuro)
- Auth web (la web solo redirige; la app gestiona auth)

---

## 4.1) Funcionalidades actuales de la app (validado en `app/` y `components/`)

> Revisión según código existente. La landing solo debe prometer o destacar lo que ya está disponible (o marcar explícitamente como “próximamente”).

**Disponible hoy:**

| Área | Funcionalidad |
|------|----------------|
| **Auth** | Login, registro, cierre de sesión, login con Google, desbloqueo biométrico (Face ID / Touch ID) |
| **Biblioteca** | Listado de libros, búsqueda en lista, ordenar (por defecto / título / autor), agrupar por autor, **listas personalizadas** (crear listas y asignar libros a listas; persistencia local), filtro por estado (pendiente / en lectura / leído) |
| **Añadir libros** | Escaneo de código de barras (ISBN), búsqueda externa de libros, formulario de alta con datos pre-rellenados desde búsqueda o escaneo |
| **Detalle de libro** | Ver ficha, actualizar páginas leídas (con celebración Giphy), editar libro, eliminar libro |
| **Perfil** | Nombre, email, avatar (inicial), **XP**, **nivel**, **racha de lectura**, acciones “Escanear libro” y “Recomendaciones IA”, editar perfil |
| **Gamificación** | Puntos XP, nivel (progreso por nivel), racha de días de lectura (vienen del backend en `Usuario`) |
| **Recomendaciones** | Pantalla que envía recomendaciones al backend (`createRecommendation`); guardado de prompt y respuesta. La generación con IA en la UI está en desarrollo / placeholder |

**No disponible en la app (no prometer en la landing como disponible hoy):**

- Exportación de datos (CSV/JSON) ni backup.
- Estadísticas avanzadas (gráficas por género/autor, desglose detallado).
- Listas “inteligentes” automatizadas (sí existen listas personalizadas manuales).
- Restricción de funciones por plan (free vs premium) en la UI; el backend expone `planId` en `Usuario` pero la app no limita por plan aún.

**Componentes UI:** `app/` (pantallas), `components/` (ThemedText, ThemedView, Collapsible, ExternalLink, ParallaxScrollView, HapticTab, IconSymbol, etc.). La landing en Angular no reutiliza estos; son referencia de qué hace la app.

---

## 5) Arquitectura de información (secciones)

### 5.1 Hero (Above the fold)
**Objetivo**: En 5 segundos explicar qué es y empujar a descarga/registro.

- H1: **“Tu biblioteca, siempre contigo.”**
- Subtítulo: “Escanea, organiza, sigue tu progreso y recibe recomendaciones personalizadas.”
- CTAs primarios:
  - **Descargar en iOS**
  - **Descargar en Android**
- CTA secundario:
  - “Ver planes” (scroll a pricing)
- Microcopy:
  - “Empieza gratis. Sin tarjeta de crédito.”
- Visual:
  - Mockups con pantallas: biblioteca, recomendaciones, perfil/logros

### 5.2 Problema / Dolor
Título sugerido: **“¿Te pasa esto?”**
- “No recuerdas qué libros tienes”
- “Compras repetidos”
- “No sabes qué leer después”
- “Te cuesta mantener el hábito”

### 5.3 Solución (Cómo funciona)
3–4 pasos con iconos:
- Escanea / busca → Añade a tu biblioteca
- Organiza por estado (por leer/leyendo/leído)
- Recibe recomendaciones
- Gana logros y cumple metas

### 5.4 Funcionalidades clave
Bloques (cards) con 1 frase + 1 beneficio:
- **Escaneo y alta rápida**
- **Búsqueda y descubrimiento**
- **Recomendaciones (IA / personalización)**
- **Gamificación**
- **Perfil y estadísticas**

### 5.5 Prueba social
Si no hay reviews reales aún:
- “+X lectores en beta” (cuando exista)
- 2–3 testimonios (placeholders) para reemplazar por reales

### 5.6 Pricing (planes)
- Tabla de 3 columnas: Gratis / Premium / De por vida
- “Premium” marcado como **Más popular**
- “De por vida” marcado como **Pago único**

### 5.7 FAQ
- ¿Qué incluye el plan gratis?
- ¿Puedo cancelar Premium cuando quiera?
- ¿Qué significa “De por vida”?
- ¿La app funciona sin internet?
- ¿Dónde guardan mis datos?

### 5.8 CTA final
- Título: “Tu próxima lectura empieza hoy.”
- Botones: iOS / Android
- Texto: “Empieza gratis y mejora cuando quieras.”

### 5.9 Footer
- Links: Privacidad, Términos, Contacto, Soporte
- Redes (opcional)

---

## 6) Planes y precios (propuesta)

> Nota: precios pensados para un producto early/indie. Ajusta por país/moneda y costos (IA, storage, soporte). Los planes están alineados con lo **disponible hoy** (sección 4.1); las mejoras Premium/Lifetime pueden incluir ítems de roadmap marcados como “próximamente”.

### 6.1 Plan Gratuito — “Free” (0 USD)
**Objetivo**: máxima adopción y activar el hábito, demostrando valor rápido.

**Incluye (según lo disponible en la app):**
- Cuenta de usuario (registro, login, login con Google, desbloqueo biométrico)
- Biblioteca personal: añadir libros por **escaneo de código de barras** o **búsqueda**
- Estados de lectura: pendiente / en lectura / leído
- Listas personalizadas (crear listas y asignar libros)
- Ordenar y filtrar la biblioteca (por título, autor, estado)
- Detalle de libro: ver, editar, actualizar páginas leídas, eliminar
- Perfil con **XP, nivel y racha de lectura** (gamificación básica)
- Acceso a pantalla de recomendaciones (guardado en backend; IA en desarrollo)

**Limitaciones (para comunicar en la landing):**
- Recomendaciones con IA limitadas (cuando se implementen límites por plan)
- Sin estadísticas avanzadas (gráficas, desglose por género/autor)
- Sin retos avanzados ni logros exclusivos Premium
- *(No hay exportación en la app; no mencionar como limitación del Free para no prometer algo inexistente.)*

### 6.2 Plan Premium — “Premium”
**Mensual**: **$4.99/mes**  
**Anual**: **$39.99/año** (≈ $3.33/mes, ~33% off)

**Incluye (todo lo Free +; ítems con * son roadmap / futuros):**
- Recomendaciones con IA completas (más uso o sin límite razonable)*
- Gamificación avanzada (retos personalizados, logros premium, rachas avanzadas)*
- Estadísticas avanzadas (gráficas, desglose por género/autor, rachas)*
- Listas inteligentes sugeridas (ej. “siguiente”, “olvidados”)*
- Sin anuncios (si en Free se implementan)*
- Soporte prioritario

*(Exportación de datos no está en la app; no incluir en Premium hasta que exista en producto.)*

Opcional (estrategia de lanzamiento):
- “Early adopter pricing” temporal: **$3.99/mes** y **$29.99/año** durante X semanas.

### 6.3 Plan De por vida — “Lifetime” (pago único)
**Precio recomendado (lanzamiento)**: **$99**  
**Precio objetivo (luego)**: **$129**

Justificación:
- Equivale a ~2.5–3.2 años del plan anual (launch), razonable para early adopters.
- Permite captar revenue upfront mientras el producto crece.

**Incluye:**
- Todo lo Premium, para siempre
- Acceso a mejoras futuras dentro del mismo producto (mismo alcance)

Copy recomendado para evitar ambigüedad:
- “Acceso de por vida a Premium en esta app. Incluye futuras mejoras dentro del mismo producto.”

---

## 7) Copy base (texto listo para usar)

### Hero
- H1: **Tu biblioteca, siempre contigo.**
- Sub: **Escanea tus libros, organiza tu colección y recibe recomendaciones personalizadas.**
- CTAs: **Descargar en iOS** / **Descargar en Android**
- Secundario: **Ver planes**
- Microcopy: **Empieza gratis. Sin tarjeta de crédito.**

### Beneficios (3 bullets)
- **Añade libros en segundos** con escaneo o búsqueda.
- **Sabe qué leer después** con recomendaciones inteligentes.
- **Mantén el hábito** con retos, logros y rachas.

### Pricing (microcopy)
- “Empieza gratis. Mejora cuando quieras.”
- “Cancela Premium en cualquier momento.”
- “Lifetime: pago único, acceso para siempre.”

---

## 8) Requisitos UX/UI

- Mobile-first: CTAs visibles sin scroll en móviles.
- “Ver planes” debe hacer scroll suave a pricing.
- Tabla de precios clara:
  - Resaltar Premium
  - Lifetime con badge de “Pago único”
- Repetir CTAs a mitad y al final.
- Animaciones suaves (sin afectar performance).
- Inspiración visual: diseño limpio, tipografía y jerarquía similares a `https://resend.com/` (secciones amplias, buen uso de blancos, enfoque en developers pero adaptado al público lector).

---

## 9) Requisitos técnicos (Angular)

### Enfoque recomendado
- Angular con **SSR o prerender** para SEO.
  - Si el contenido es mayormente estático: **prerender** suele ser suficiente y más simple.

### Rutas
- `/` (landing)
- `/pricing` (opcional: ruta para campañas; puede renderizar mismo contenido y scrollear)
- `/privacy`
- `/terms`
- `/contact` (o mailto)

### Componentes sugeridos
- `HeroSectionComponent`
- `FeaturesSectionComponent`
- `HowItWorksSectionComponent`
- `TestimonialsSectionComponent`
- `PricingSectionComponent`
- `FaqSectionComponent`
- `FooterComponent`

### SEO
- Metatags: title, description, OG (title/description/image), Twitter cards.
- `sitemap.xml` y `robots.txt`.
- JSON-LD:
  - `SoftwareApplication` (nombre, categoría, OS, offers)

### Performance
- Lighthouse >= 90 (mobile)
- Imágenes WebP/AVIF, lazy-load
- Evitar dependencias pesadas en landing

### Analytics / Tracking
Eventos mínimos:
- `cta_download_ios_click`
- `cta_download_android_click`
- `cta_view_pricing_click`
- `pricing_select_free_click`
- `pricing_select_premium_click`
- `pricing_select_lifetime_click`
- `faq_expand`

---

## 10) Integraciones y enlaces

- Enlaces reales a:
  - App Store
  - Google Play
- Si aún no están publicadas:
  - “Unirme a la beta” (formulario email o link a TestFlight/Closed testing)

---

## 11) Legal

- Política de privacidad:
  - Datos recolectados, uso, retención, seguridad, contacto para eliminación
- Términos y condiciones
- Aclaración “De por vida” (alcance y exclusiones razonables)

---

## 12) Criterios de aceptación

- Se ve perfecto en móvil y desktop.
- CTAs de descarga visibles sin scroll en móvil.
- Sección de precios con 3 planes y precios definidos (Free/Premium/Lifetime).
- SEO básico completo (metas + OG + sitemap).
- Tracking de eventos funcionando.
- Privacidad y términos accesibles desde footer.

