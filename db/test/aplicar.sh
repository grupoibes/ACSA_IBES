#!/bin/sh
set -eu
dropdb --if-exists certificacao_ibes
createdb certificacao_ibes
for arquivo in db/migrations/*.sql; do
  psql -v ON_ERROR_STOP=1 -d certificacao_ibes -f "$arquivo"
done
psql -v ON_ERROR_STOP=1 -d certificacao_ibes -f db/test/decisoes.sql
echo "migrações e decisões de 26/10 ok"
