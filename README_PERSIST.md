
# Persistencia con Supabase — Paquete de Integración

Este paquete añade **persistencia de datos** (pros/contras, alertas y ajustes de puntuación)
para tu app **SCADA Comparación Dashboard** sin romper el build de Netlify.

Incluye:
- `src/lib/supabaseClient.js`: cliente Supabase listo para Vite.
- `src/api/persistence.js`: helpers de lectura/escritura (findings, features, weights).
- `src/pages/Admin.jsx`: mini panel (login + formularios) **solo para ti**.
- `src/pages/Login.jsx`: login por email/contraseña.
- `.env.example`: variables Vite para Netlify/GitHub.
- `supabase/schema.sql`: tablas sugeridas.
- `INTEGRATION_STEPS.md`: pasos para integrar en Ranking/Radar/Home.
- `ROUTES.md`: cómo agregar las rutas en tu router.

> **Nota:** Este paquete no toca archivos existentes; solo agrega. Tú decides
> dónde invocar las funciones para recalcular ranking y mostrar notas/alertas.
