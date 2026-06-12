# Vendora

> **Controlá tu stock. Impulsá tus ventas.**

SaaS multi-tenant de gestión de inventario, ventas y rentabilidad para pequeños y medianos comercios.

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Hook Form + Zod | Firebase (Auth, Firestore, Storage) | Netlify

---

## Funcionalidades

- 🏪 **Multi-tenant**: cada comercio tiene sus datos 100% aislados (subcolecciones por tenant + reglas Firestore)
- 👥 **Roles**: Administrador, Supervisor, Operador con permisos diferenciados
- 📦 **Productos**: CRUD completo, imágenes, baja lógica, búsqueda, margen automático
- 📷 **Escáner de código de barras**: cámara (ZXing: EAN-13, EAN-8, UPC, CODE-128) y lector USB. Código inexistente → "Crear producto nuevo" con el código precargado
- 🛒 **Punto de Venta**: carrito, descuentos por ítem y globales, métodos de pago, ticket PDF
- 📊 **Stock**: ingresos, ajustes, correcciones, inventario, historial completo de movimientos, alertas de stock mínimo
- 💰 **Rentabilidad**: ganancia por producto/venta/día/mes con snapshot de precios (los cambios de precio no alteran el histórico)
- 📈 **Dashboard**: KPIs del día y del mes, gráficos, más vendidos, últimas ventas
- 📑 **Reportes**: 7/30/90 días, ranking de productos, export a Excel
- 🌙 **Modo oscuro/claro**, responsive, diseño tipo Stripe/Linear
- ⚡ Las ventas se registran en **transacciones atómicas** (descuento de stock seguro con múltiples cajas)

---

## Puesta en marcha

### 1. Firebase

1. Creá un proyecto en [console.firebase.google.com](https://console.firebase.google.com) (plan Spark gratis alcanza).
2. **Authentication** → habilitá *Email/Password*.
3. **Firestore Database** → crear base (modo producción).
4. **Storage** → habilitar.
5. En *Project settings → General → Your apps* creá una **Web app** y copiá la config.

### 2. Reglas e índices

Con [Firebase CLI](https://firebase.google.com/docs/cli) (`npm i -g firebase-tools`):

```bash
firebase login
firebase use TU_PROJECT_ID
firebase deploy --only firestore:rules,firestore:indexes,storage
```

(O pegá el contenido de `firestore.rules` y `storage.rules` a mano desde la consola.)

### 3. Variables de entorno

```bash
cp .env.example .env
```

Completá con los valores de tu Web app de Firebase:

```
VITE_FB_API_KEY=...
VITE_FB_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FB_PROJECT_ID=tu-proyecto
VITE_FB_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FB_MESSAGING_SENDER_ID=...
VITE_FB_APP_ID=...
```

### 4. Desarrollo local

```bash
npm install
npm run dev
```

### 5. GitHub + Netlify

```bash
git init
git add .
git commit -m "Vendora v0.1"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/vendora.git
git push -u origin main
```

En [Netlify](https://app.netlify.com):

1. **Add new site → Import an existing project → GitHub → vendora**
2. Build command: `npm run build` · Publish directory: `dist` (ya viene en `netlify.toml`)
3. **Site settings → Environment variables**: cargá las 6 variables `VITE_FB_*`
4. Deploy.
5. En Firebase → **Authentication → Settings → Authorized domains**: agregá tu dominio `*.netlify.app`.

> ⚠️ Importante: las variables `VITE_FB_*` deben cargarse en Netlify **antes** del primer deploy (Vite las inyecta en build time). Si las agregás después, hacé "Clear cache and deploy site".

---

## Arquitectura de datos

```
userDirectory/{uid}                 → { tenantId, role, email }  (lookup en login)
tenants/{t}                         → datos del comercio, plan y límites
tenants/{t}/users/{uid}             → perfil y rol
tenants/{t}/products/{id}           → producto (lowStock calculado, searchTokens)
tenants/{t}/sales/{id}              → venta con items embebidos (snapshot de precios)
tenants/{t}/stockMovements/{id}     → trazabilidad completa del stock
tenants/{t}/dailyStats/{YYYY-MM-DD} → agregados para dashboard y reportes
tenants/{t}/settings/general        → branding, moneda, IVA, ticket
tenants/{t}/settings/counters       → correlativo de ventas
```

El aislamiento multi-tenant está garantizado por las **reglas de Firestore**: cada operación verifica que el `tenantId` del documento `userDirectory` del usuario coincida con la ruta consultada.

## Planes

| | Inicial | Profesional | Empresa |
|---|---|---|---|
| Productos | 500 | Ilimitados | Ilimitados |
| Usuarios | 1 | 5 | Ilimitados |
| Reportes avanzados | — | ✔ | ✔ |
| Multi sucursal / API | — | — | ✔ |

## Roadmap

Mercado Pago · Facturación ARCA · WhatsApp Business · Multi sucursal · Invitación de usuarios por código · Cloud Functions (plan Blaze) para validación server-side de límites · IA para predicción de reposición · CRM y fidelización.

---

© Vendora
