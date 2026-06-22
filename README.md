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
docker build --build-arg VITE_API_BASE_URL=https://tu-backend-publico/api/v1 -t frontend-siquem .
docker run -p 3000:3000 -e PORT=3000 -e VITE_API_BASE_URL=https://tu-backend-publico/api/v1 frontend-siquem
```

`VITE_API_BASE_URL` se resuelve en runtime desde `dist/env.js`, y si no se define cae a `/api/v1`.
