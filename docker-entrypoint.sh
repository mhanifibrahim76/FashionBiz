#!/bin/bash
set -e

echo "Menunggu database siap..."
until npx prisma db execute --stdin <<< "SELECT 1" 2>/dev/null; do
  echo "Database belum siap, menunggu..."
  sleep 2
done

echo "Menjalankan prisma migrate..."
npx prisma migrate deploy || npx prisma db push

echo "Menjalankan seeder..."
npx prisma db seed || true

echo "Setup selesai!"
exec "$@"
