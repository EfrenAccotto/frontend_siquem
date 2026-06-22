#!/bin/sh
set -eu

API_BASE_URL="${VITE_API_BASE_URL:-/api/v1}"
PORT="${PORT:-3000}"

VITE_API_BASE_URL="${API_BASE_URL}" node -e '
  const fs = require("node:fs");
  const value = JSON.stringify(process.env.VITE_API_BASE_URL);
  fs.writeFileSync("/app/dist/env.js", `window.__APP_ENV__ = { VITE_API_BASE_URL: ${value} };\n`);
'

exec serve -s /app/dist -l "tcp://0.0.0.0:${PORT}"
