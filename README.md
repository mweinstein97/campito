# 🏡 Familia Política — App del viaje a Campito

PWA grupal para 24 personas · 9–12 julio · React + Vite + Tailwind + Supabase + GitHub Pages

## Stack

| Tecnología | Uso |
|---|---|
| React 18 + Vite | SPA |
| Tailwind CSS 3 | Estilos |
| Supabase | Base de datos + Realtime |
| vite-plugin-pwa | Service worker + manifest |
| GitHub Actions | CI/CD → GitHub Pages |

---

## Setup local (5 minutos)

### 1. Clonar e instalar

```bash
git clone https://github.com/TU_USER/campito.git
cd campito
npm install
```

### 2. Configurar Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com)
2. Andá a **SQL Editor** y ejecutá `supabase/schema.sql` completo
3. En **Project Settings → API** copiá la URL y la `anon key`

```bash
cp .env.example .env.local
# Editá .env.local con tus valores:
# VITE_SUPABASE_URL=https://xxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Correr en desarrollo

```bash
npm run dev
# → http://localhost:5173/campito/
```

> Sin `.env.local` la app funciona en modo offline con datos de ejemplo (no compartidos entre usuarios).

---

## Deploy en GitHub Pages

### 1. Crear el repositorio

```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/TU_USER/campito.git
git push -u origin main
```

### 2. Configurar GitHub Pages

- Repo → **Settings → Pages**
- Source: **GitHub Actions**

### 3. Agregar secrets

- Repo → **Settings → Secrets → Actions → New repository secret**

| Secret | Valor |
|---|---|
| `VITE_SUPABASE_URL` | Tu URL de Supabase |
| `VITE_SUPABASE_ANON_KEY` | Tu anon key |

### 4. Push → deploy automático

Cada push a `main` dispara el workflow y despliega en:
`https://TU_USER.github.io/campito/`

---

## Instalar en iPhone (PWA)

1. Abrir la URL en **Safari**
2. Compartir → **"Agregar a pantalla de inicio"**
3. La app queda instalada con ícono, sin barra de Safari

---

## Panel Admin

- Tocar el chip de usuario (arriba a la derecha)
- Contraseña: `campito2025`
- Desde ahí: cargar desafío del día, agregar preguntas al prode, cerrar prode y cargar correctas, eliminar participantes

---

## Estructura del proyecto

```
src/
├── context/
│   └── AppContext.jsx     # Estado global + acciones Supabase
├── lib/
│   ├── supabase.js        # Cliente Supabase
│   └── seed.js            # Datos demo offline
├── components/
│   ├── Card.jsx
│   ├── Header.jsx
│   ├── Modal.jsx
│   ├── Nav.jsx
│   └── Toast.jsx
├── screens/
│   ├── Login.jsx
│   ├── Inicio.jsx          # Countdown + desafío + ranking
│   ├── Agenda.jsx          # Actividades espontáneas
│   ├── Preparativos.jsx    # Gastronómico + checklist
│   ├── Gastos.jsx          # Splitwise simplificado
│   ├── Juegos.jsx          # Prode + ranking
│   └── Admin.jsx           # Panel administrador
├── App.jsx
└── main.jsx
public/
├── manifest.json
├── sw.js
└── icons/
    ├── icon-192.png        # ← tenés que generarlo (ver abajo)
    └── icon-512.png
supabase/
└── schema.sql
.github/
└── workflows/
    └── deploy.yml
```

---

## Generar íconos PWA

La carpeta `public/icons/` necesita dos PNGs. Opciones rápidas:

- **[pwa-asset-generator](https://github.com/elegantapp/pwa-asset-generator)**:
  ```bash
  npx pwa-asset-generator logo.png public/icons --manifest public/manifest.json
  ```
- **[Favicon.io](https://favicon.io)** → descargá y renombrá los archivos
- **[RealFaviconGenerator](https://realfavicongenerator.net)**

El ícono base puede ser cualquier imagen cuadrada (512×512+) con el logo 🏡 o el emoji de la app.

---

## Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `VITE_SUPABASE_URL` | En prod | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | En prod | Clave pública anon |

Sin estas variables, la app funciona en modo offline (datos locales, no compartidos).
