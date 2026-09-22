#!/bin/sh
set -e

echo "==> Running Prisma Database Migrations..."
npx prisma migrate deploy --schema=prisma/schema || {
  echo "==> Warning: Prisma migrate deploy failed, fallback to prisma db push..."
  npx prisma db push --schema=prisma/schema --accept-data-loss
}

echo "==> Starting Application..."
exec "$@"
