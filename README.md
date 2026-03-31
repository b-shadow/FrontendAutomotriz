# 🎨 SaaS Frontend - React + Stripe

Panel de registro y pago para empresas con integración completa de Stripe.

## 🚀 Comenzar

### 1. Instalación

```bash
npm install
```

### 2. Variables de Entorno

Actualiza `.env.local` con tus keys de Stripe:

```env
VITE_STRIPE_PUBLIC_KEY=pk_test_tu_clave_aqui
VITE_API_URL=http://localhost:8000
```

#### Obtener Keys de Stripe

1. Ve a https://stripe.com y crea una cuenta
2. Accede a https://dashboard.stripe.com/test/keys
3. Copia la **Publishable key** → `VITE_STRIPE_PUBLIC_KEY`
4. En el backend, usa la **Secret key** → `STRIPE_TEST_SECRET_KEY`

### 3. Ejecutar Desarrollo

```bash
npm run dev
```

La app estará en: **http://localhost:5173**

**Test Stripe**:
- Usa tarjeta de prueba: **4242 4242 4242 4242**
- Vencimiento: **12/25**
- CVC: **123**
- ZIP: **12345**

---
