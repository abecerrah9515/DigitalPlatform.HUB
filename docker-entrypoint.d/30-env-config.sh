#!/bin/sh
set -eu

ENV_JS_PATH="/usr/share/nginx/html/env.js"

cat <<EOF > "$ENV_JS_PATH"
window.__env = {
  API_URL: "${API_URL:-}",
  API_KEY: "${API_KEY:-}"
};
EOF
