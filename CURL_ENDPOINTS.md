# CURLs para consumir la API (Mi Libro App)

Base URL por defecto: `http://localhost:3000/api`

Guarda el `accessToken` que devuelve login y úsalo en `TOKEN` en los endpoints protegidos.

---

## 1. Auth (públicos)

### Registro
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Tu Nombre",
    "email": "tu@email.com",
    "password": "tuPassword123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu@email.com",
    "password": "tuPassword123"
  }'
```
*Copia el `accessToken` de la respuesta y úsalo como `TOKEN` abajo.*

### Login con Google (Firebase)
Envía el **ID Token** que devuelve Firebase Auth en el cliente (tras `signInWithPopup` o `signInWithRedirect` con Google).

```bash
curl -X POST http://localhost:3000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "ID_TOKEN_DE_FIREBASE"}'
```
*Respuesta: `{ "usuario", "accessToken" }` — mismo formato que login. Si el usuario no existe, se crea; si ya existe (por email o firebase_uid), se enlaza y se devuelve el JWT.*

---

## 2. Usuarios (requieren JWT)

Sustituye `TOKEN` por el `accessToken` obtenido en login.

### Ver mi perfil
```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer TOKEN"
```

### Actualizar mi perfil
```bash
curl -X PATCH http://localhost:3000/api/users/me \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Nuevo Nombre"
  }'
```

---

## 3. Libros (requieren JWT)

### Buscar libros en fuentes externas (Google Books, Open Library)
Devuelve un formato unificado para que puedas completar/editar y luego registrar el libro con POST /books. Puedes buscar **por título/autor** (`q`) o **por ISBN** (`isbn`); hay que enviar al menos uno.

**Por título o autor:**
```bash
curl -X GET "http://localhost:3000/api/books/search?q=cien+años+soledad&limit=10" \
  -H "Authorization: Bearer TOKEN"
```

**Por ISBN (10 o 13 dígitos):**
```bash
curl -X GET "http://localhost:3000/api/books/search?isbn=9788437604947" \
  -H "Authorization: Bearer TOKEN"
```

*Parámetros: `q` (texto, título/autor), `isbn` (ISBN-10 o ISBN-13, solo dígitos). Al menos uno obligatorio. `limit` (1–20, opcional, por defecto 10).*

*Cada resultado incluye: `title`, `isbn`, `author`, `description`, `imageUrl`, `genre`, `totalPages`, `source` (google_books | open_library), `externalId`. Puedes enviar estos campos (completando los que falten) a POST /books para registrar el libro.*

### Crear libro
```bash
curl -X POST http://localhost:3000/api/books \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Cien años de soledad",
    "autor": "Gabriel García Márquez",
    "isbn": "9788437604947",
    "genero": "Ficción",
    "paginasTotales": 471,
    "esAdquirido": true,
    "estadoLectura": "pendiente"
  }'
```
*`estadoLectura` puede ser: `pendiente`, `en_lectura`, `leido`*

### Listar mis libros
```bash
curl -X GET http://localhost:3000/api/books \
  -H "Authorization: Bearer TOKEN"
```

### Ver un libro
```bash
curl -X GET http://localhost:3000/api/books/1 \
  -H "Authorization: Bearer TOKEN"
```
*Cambia `1` por el `libroId` que quieras.*

### Actualizar libro
```bash
curl -X PATCH http://localhost:3000/api/books/1 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Cien años de soledad (edición revisada)",
    "paginasLeidas": 100,
    "estadoLectura": "en_lectura",
    "estaPrestado": false
  }'
```

### Actualizar páginas leídas (otorga XP y actualiza nivel/racha)
```bash
curl -X PATCH http://localhost:3000/api/books/1/paginas \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paginasLeidas": 150
  }'
```

### Eliminar libro
```bash
curl -X DELETE http://localhost:3000/api/books/1 \
  -H "Authorization: Bearer TOKEN"
```

---

## 4. IA / Recomendaciones (requieren JWT)

### Guardar recomendación IA
```bash
curl -X POST http://localhost:3000/api/ai/recomendaciones \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "promptEnviado": "Recomiéndame libros de realismo mágico",
    "respuestaIaJson": {
      "libros": ["Cien años de soledad", "Pedro Páramo"],
      "total": 2
    },
    "modeloIa": "gpt-4"
  }'
```

---

## Uso rápido con variable TOKEN

```bash
# 1. Login y guardar token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tuPassword123"}' \
  | jq -r '.accessToken')

# 2. Llamar a un endpoint protegido
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN"
```

*Requiere `jq` instalado. Si no lo tienes, copia el token a mano de la respuesta de login.*
