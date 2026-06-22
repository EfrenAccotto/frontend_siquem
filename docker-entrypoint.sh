#!/bin/sh
set -eu

API_BASE_URL="${VITE_API_BASE_URL:-/api/v1}"

cat > /app/dist/env.js <<EOF
window.__APP_ENV__ = {
  VITE_API_BASE_URL: "${API_BASE_URL}"
};
EOF

exec node ./scripts/start-static.mjs
