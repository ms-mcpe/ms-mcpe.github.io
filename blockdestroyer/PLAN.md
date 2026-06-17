# Plan de Implementación — BlockDestroyer Votaciones

## Estado: ✅ Fase 2 Completada (25/03/2026)

---

### Fase 1: Sistema de Autenticación (Login/Registro)
- [x] Backend Apps Script con registro e inicio de sesión
- [x] Frontend login/registro con diseño azul neón
- [x] Validaciones de seguridad (XSS, caracteres prohibidos, SQL-like injection)
- [x] Cuentas admin reservadas: **Myst Start**, **Blockdestroyer** (case-insensitive)
- [x] localStorage para sesión persistente
- [x] Auto-login instantáneo al cargar la página (sin llamada API)
- [x] Diseño responsive en login (móvil, tablet, landscape, desktop)

### Fase 2: Dashboard y Sistema de Votación (Completada)
- [x] Hoja **Encuestas** en Google Sheets
- [x] Hoja **Votos** en Google Sheets
- [x] Endpoints API: `listarEncuestas`, `crearEncuesta`, `editarEncuesta`, `eliminarEncuesta`, `finalizarEncuesta`, `votar`, `resultados`
- [x] Dashboard con sidebar + hamburger menu responsive
- [x] Vista de votación con selección de opción y confirmación
- [x] Vista de resultados con barras de progreso y porcentajes
- [x] Ruleta interactiva (canvas) para encuestas tipo "ruleta"
- [x] Voto único: verificado en servidor + localStorage, imposible cambiar o duplicar
- [x] Panel admin CRUD (crear, editar, finalizar, eliminar) con modal
- [x] Diseño responsive completo (360px → 4K)
- [x] Persistencia de sesión y voto en localStorage

### Fase 3: Próximas Mejoras (Futuro)
- [ ] Editar perfil de usuario
- [ ] Estadísticas avanzadas con gráficas
- [ ] Sistema de notificaciones
- [ ] Exportar resultados a PDF/CSV

---

## Configuración

### App Script URL (producción)
```
https://script.google.com/macros/s/AKfycbwrHRpTuR-d_KcxSMzNm1Euq6TiTBLNToHmpYcjirCPy1Syw9auoKFu61C4R1fkG4cl/exec
```
Esta URL está configurada en `frontend/config.js`. Si se cambia el deployment, solo hay que actualizar ese archivo.

### Google Sheets - Estructura

Se crean automáticamente 3 hojas al primer uso:

| Sheet      | Columnas                                                                 |
|------------|--------------------------------------------------------------------------|
| Usuarios   | ID, Usuario, Contraseña (SHA-256), Rol (user/admin), FechaRegistro       |
| Encuestas  | ID, Titulo, Opciones (JSON), Estado (activa/finalizada), Tipo (normal/ruleta), TotalVotos, FechaCreacion, CreadoPor |
| Votos      | ID, EncuestaID, Usuario, OpcionElegida, FechaVoto                        |

---

## Estructura del Proyecto

```
C:\Users\denji\Desktop\blockdestroyer\
├── PLAN.md                          ← Este archivo (plan + config)
├── plan.txt                         ← Prompt original del usuario
│
├── frontend/                        ← Web app (abrir en navegador)
│   ├── index.html                   ← Login / Registro
│   ├── dashboard.html               ← App principal (sidebar + secciones)
│   ├── config.js                    ← URL de Google Apps Script
│   │
│   ├── css/
│   │   ├── style.css                ← Estilos login (neón azul + responsive)
│   │   └── dashboard.css            ← Estilos dashboard, admin, ruleta (responsive)
│   │
│   └── js/
│       ├── app.js                   ← Lógica login/registro (validación + fetch)
│       └── dashboard.js             ← Lógica encuestas, votos, admin, ruleta
│
└── backend/
    └── Code.gs                      ← Google Apps Script (API completa 725+ líneas)
```

---

## Cómo desplegar

### 1. Backend (Apps Script)
1. Ir a https://script.google.com/
2. Crear nuevo proyecto → pegar `backend/Code.gs` en `Code.gs`
3. (Opcional) Para servir desde Apps Script: descomentar las líneas `HtmlService` en `doGet()`
4. Desplegar → Nueva implementación → Aplicación web
   - Ejecutar como: **Yo**
   - Acceso: **Cualquier usuario**
5. Copiar URL → pegarla en `frontend/config.js`

### 2. Frontend (hosting)
- Abrir `frontend/index.html` directamente en el navegador, o
- Hostear en GitHub Pages, Netlify, Vercel, etc. apuntando a la carpeta `frontend/`

---

## Endpoints de la API (doPost)

| Action             | Parámetros                              | Admin | Descripción                     |
|--------------------|-----------------------------------------|-------|---------------------------------|
| `registrar`        | usuario, password                       | No    | Registrar nuevo usuario         |
| `iniciarSesion`    | usuario, password                       | No    | Iniciar sesión                  |
| `listarEncuestas`  | _ninguno_                               | No    | Listar todas las encuestas      |
| `crearEncuesta`    | titulo, opciones (JSON), tipo, usuario  | Sí    | Crear encuesta                  |
| `editarEncuesta`   | id, titulo, opciones (JSON), usuario    | Sí    | Editar encuesta existente       |
| `eliminarEncuesta` | id, usuario                             | Sí    | Eliminar encuesta + sus votos   |
| `finalizarEncuesta`| id, usuario                             | Sí    | Cerrar encuesta (no más votos)  |
| `votar`            | encuestaId, usuario, opcion             | No    | Votar (validación doble check)  |
| `resultados`       | encuestaId                              | No    | Obtener resultados de encuesta  |

---

## Reglas de validación

| Campo      | Regla                                                                 |
|------------|-----------------------------------------------------------------------|
| Usuario    | Máx 15 caracteres, sin @, sin caracteres especiales peligrosos        |
| Contraseña | Mín 8 caracteres, debe empezar con letra (ej: `juan1234`)             |
| Admin      | Solo `Myst Start` y `Blockdestroyer` (case-insensitive)                |
| Encuestas  | Título máx 100, opciones 2-10, cada opción máx 50 caracteres         |
| Voto       | Un voto único por usuario por encuesta (verificado en servidor)       |
