# Frontend Siquem

Build local:

```bash
npm install
npm run build
```

Run local in production mode:

```bash
npm start
```

Docker production:

```bash
docker build -t frontend-siquem .
docker run -p 3000:3000 -e PORT=3000 -e VITE_API_BASE_URL=https://tu-backend-publico/api/v1 frontend-siquem
```

En Railway configura estas variables en el servicio del frontend:

```env
VITE_API_BASE_URL=https://tu-backend-publico/api/v1
```

No es necesario definir `PORT`: Railway lo inyecta al iniciar el contenedor. El
entrypoint genera `dist/env.js` en runtime, por lo que un cambio en
`VITE_API_BASE_URL` no requiere recompilar el bundle de Vite. La URL debe ser la
URL publica del backend, accesible desde el navegador. Si no se define, el
frontend usa `/api/v1` en su propio dominio.
