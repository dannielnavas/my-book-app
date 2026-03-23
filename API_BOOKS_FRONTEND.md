# API de Libros — Guía para el Frontend

**Base URL:** `https://tu-dominio.com/api`  
**Autenticación:** Todos los endpoints requieren el header `Authorization: Bearer <token>`

---

## Tipos y Enumeraciones

### `ReadingStatus`
```typescript
type ReadingStatus = 'pending' | 'in_progress' | 'read';
```

### `Book` (respuesta del servidor)
```typescript
interface Book {
  bookId:          number;
  userId:          number;
  isbn:            string | null;
  title:           string;
  author:          string | null;
  description:     string | null;
  imageUrl:        string | null;
  genre:           string | null;
  totalPages:      number | null;
  pagesRead:       number;          // Por defecto 0
  isOwned:         boolean;         // true = mi biblioteca, false = wishlist
  readingStatus:   ReadingStatus;   // Por defecto 'pending'
  isBorrowed:      boolean;         // ¿Está prestado a alguien?
  borrowedToName:  string | null;   // Nombre de la persona a quien se prestó
  borrowedAt:      string | null;   // Fecha de préstamo (ISO 8601 date, ej: "2026-03-22")
  addedAt:         string;          // Fecha de creación (ISO 8601 datetime)
}
```

---

## Endpoints

### 1. Crear libro
**`POST /api/books`**

Crea un nuevo libro en la biblioteca personal del usuario autenticado.

#### Request body
```typescript
interface CreateBookBody {
  title:         string;           // REQUERIDO — máx. 255 caracteres
  isbn?:         string;           // Opcional — máx. 13 caracteres
  author?:       string;           // Opcional — máx. 255 caracteres
  description?:  string;           // Opcional
  imageUrl?:     string;           // Opcional — URL de la portada
  genre?:        string;           // Opcional — máx. 50 caracteres
  totalPages?:   number;           // Opcional — entero >= 0
  isOwned?:      boolean;          // Opcional — true por defecto (false = wishlist)
  readingStatus?: ReadingStatus;   // Opcional — 'pending' por defecto
}
```

#### Ejemplo de request
```json
{
  "title": "El nombre del viento",
  "isbn": "9780756404741",
  "author": "Patrick Rothfuss",
  "description": "La historia de Kvothe...",
  "imageUrl": "https://example.com/portada.jpg",
  "genre": "Fantasía",
  "totalPages": 662,
  "isOwned": true,
  "readingStatus": "pending"
}
```

#### Respuesta exitosa — `201 Created`
```json
{
  "bookId": 42,
  "userId": 7,
  "isbn": "9780756404741",
  "title": "El nombre del viento",
  "author": "Patrick Rothfuss",
  "description": "La historia de Kvothe...",
  "imageUrl": "https://example.com/portada.jpg",
  "genre": "Fantasía",
  "totalPages": 662,
  "pagesRead": 0,
  "isOwned": true,
  "readingStatus": "pending",
  "isBorrowed": false,
  "borrowedToName": null,
  "borrowedAt": null,
  "addedAt": "2026-03-22T15:30:00.000Z"
}
```

#### Errores posibles
| Código | Motivo |
|--------|--------|
| `400` | `title` faltante o campos con formato inválido |
| `401` | Token JWT inválido o ausente |
| `403` | Límite de libros del plan alcanzado (`error: "PLAN_LIMIT_REACHED"`) |

```json
// Error 403 — límite de plan
{
  "statusCode": 403,
  "message": "Límite de libros alcanzado para tu plan. Actualiza a Premium para añadir más.",
  "error": "PLAN_LIMIT_REACHED",
  "limitType": "books"
}
```

> ⚠️ **Nota:** Múltiples usuarios **pueden** tener el mismo libro (mismo ISBN). No hay restricción de unicidad por ISBN.

---

### 2. Editar libro
**`PATCH /api/books/:id`**

Actualiza uno o más campos del libro. Solo se modifican los campos enviados.

#### Parámetro de ruta
- `:id` — `bookId` del libro (número entero)

#### Request body (todos los campos son opcionales)
```typescript
interface UpdateBookBody {
  isbn?:           string;          // máx. 13 caracteres
  title?:          string;          // máx. 255 caracteres
  author?:         string;          // máx. 255 caracteres
  description?:    string;
  imageUrl?:       string;          // URL de portada
  genre?:          string;          // máx. 50 caracteres
  totalPages?:     number;          // entero >= 0
  pagesRead?:      number;          // entero >= 0
  isOwned?:        boolean;
  readingStatus?:  ReadingStatus;   // 'pending' | 'in_progress' | 'read'
  isBorrowed?:     boolean;
  borrowedToName?: string;          // máx. 100 caracteres
  borrowedAt?:     string | null;   // Fecha ISO 8601 ("2026-03-22") o null para limpiar
}
```

#### Ejemplo — marcar como en lectura
```json
{
  "readingStatus": "in_progress"
}
```

#### Ejemplo — registrar préstamo
```json
{
  "isBorrowed": true,
  "borrowedToName": "Carlos Gómez",
  "borrowedAt": "2026-03-22"
}
```

#### Ejemplo — cancelar préstamo
```json
{
  "isBorrowed": false,
  "borrowedToName": null,
  "borrowedAt": null
}
```

#### Respuesta exitosa — `200 OK`
Retorna el objeto `Book` actualizado completo.

#### Errores posibles
| Código | Motivo |
|--------|--------|
| `400` | Valor de campo inválido |
| `401` | Token JWT inválido o ausente |
| `404` | Libro no encontrado o no pertenece al usuario |

---

### 3. Actualizar páginas leídas
**`PATCH /api/books/:id/pages`**

Endpoint especializado para registrar el avance de lectura. Además de actualizar `pagesRead`, **otorga XP** al usuario y actualiza automáticamente el `readingStatus`:

- `pagesRead == 0` → `pending`
- `0 < pagesRead < totalPages` → `in_progress`
- `pagesRead >= totalPages` → `read`

#### Request body
```typescript
interface UpdatePagesBody {
  pagesRead: number;   // REQUERIDO — entero >= 0
}
```

#### Ejemplo
```json
{
  "pagesRead": 150
}
```

#### Respuesta exitosa — `200 OK`
```json
{
  "book": {
    "bookId": 42,
    "pagesRead": 150,
    "readingStatus": "in_progress",
    "...": "resto de campos del libro"
  },
  "xpEarned": 50,
  "levelUp": false,
  "newLevel": 3
}
```

| Campo | Descripción |
|-------|-------------|
| `xpEarned` | XP ganados en esta actualización (páginas nuevas × 1 XP) |
| `levelUp` | `true` si el usuario subió de nivel |
| `newLevel` | Nivel actual del usuario después de ganar XP |

#### Errores posibles
| Código | Motivo |
|--------|--------|
| `400` | `pagesRead` excede `totalPages` del libro |
| `401` | Token JWT inválido o ausente |
| `404` | Libro no encontrado |

---

### 4. Obtener todos los libros
**`GET /api/books`**

Retorna todos los libros del usuario ordenados del más reciente al más antiguo.

#### Respuesta exitosa — `200 OK`
```json
[
  {
    "bookId": 42,
    "title": "El nombre del viento",
    "readingStatus": "in_progress",
    "...": "..."
  }
]
```

---

### 5. Obtener un libro
**`GET /api/books/:id`**

#### Respuesta exitosa — `200 OK`
Retorna el objeto `Book` completo.

---

### 6. Eliminar libro
**`DELETE /api/books/:id`**

#### Respuesta exitosa — `200 OK`
```json
{
  "message": "Book deleted"
}
```

---

### 7. Buscar libros externos (Google Books / Open Library)
**`GET /api/books/search`**

Busca en fuentes externas para autocompletar el formulario de nuevo libro.

#### Query params
| Param | Tipo | Descripción |
|-------|------|-------------|
| `q` | string | Búsqueda por título o autor |
| `isbn` | string | Búsqueda por ISBN-10 o ISBN-13 |
| `limit` | number | Máx. resultados (por defecto 10) |

> Al menos uno de `q` o `isbn` es requerido.

#### Ejemplo
```
GET /api/books/search?q=El+nombre+del+viento&limit=5
GET /api/books/search?isbn=9780756404741
```

#### Respuesta exitosa — `200 OK`
```json
[
  {
    "title": "El nombre del viento",
    "author": "Patrick Rothfuss",
    "isbn": "9780756404741",
    "description": "...",
    "imageUrl": "https://...",
    "genre": "Fantasy",
    "totalPages": 662
  }
]
```

> Los campos del resultado son compatibles directamente con el body de `POST /api/books`. Úsalos para autocompletar el formulario antes de confirmar la creación.

---

## Flujo recomendado — Crear libro con búsqueda

```
1. Usuario escribe el título o ISBN
2. GET /api/books/search?q=... (autocompletar)
3. Usuario selecciona un resultado → prellenar formulario
4. Usuario confirma → POST /api/books (con los datos del formulario)
```

---

## Flujo recomendado — Editar libro

```
1. GET /api/books/:id  →  obtener datos actuales
2. Usuario edita campos en el formulario
3. PATCH /api/books/:id  →  solo enviar campos modificados
```

---

## Ejemplos de código (fetch)

### Crear libro
```typescript
const response = await fetch('/api/books', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    title: 'El nombre del viento',
    author: 'Patrick Rothfuss',
    isbn: '9780756404741',
    totalPages: 662,
    readingStatus: 'pending',
  }),
});

if (!response.ok) {
  const error = await response.json();
  if (error.error === 'PLAN_LIMIT_REACHED') {
    // Mostrar modal de upgrade a Premium
  }
  throw error;
}

const book = await response.json(); // Book
```

### Editar libro
```typescript
const response = await fetch(`/api/books/${bookId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    readingStatus: 'in_progress',
    pagesRead: 150,
  }),
});

const updatedBook = await response.json(); // Book
```

### Actualizar páginas leídas
```typescript
const response = await fetch(`/api/books/${bookId}/pages`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ pagesRead: 200 }),
});

const result = await response.json();
// result.book       → libro actualizado
// result.xpEarned   → XP ganados
// result.levelUp    → ¿subió de nivel?
// result.newLevel   → nuevo nivel
```
