#!/bin/sh
set -e

# Helper: read Docker Secrets from *_FILE env variables and export them
# without the _FILE suffix. This follows the convention used by official
# Docker images (MySQL, WordPress, etc.).
#
# Example: JWT_SECRET_FILE=/run/secrets/jwt_secret -> JWT_SECRET=<content>

for var in $(env | grep '_FILE=' | cut -d= -f1); do
  secret_file=$(eval echo "\$$var")
  if [ -f "$secret_file" ]; then
    target_var=$(echo "$var" | sed 's/_FILE$//')
    read -r secret_value < "$secret_file"
    export "$target_var=$secret_value"
  fi
done

exec "$@"
