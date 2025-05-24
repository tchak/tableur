export PATH := "./node_modules/.bin:" + env_var('PATH')

default: dev

[group('dev')]
dev:
  bun -b vite

[group('prod')]
start:
  bun ./build/server/index.js

[group('dev')]
build:
  bun -b react-router build

[group('dev')]
install:
  bun install

[group('dev')]
setup: install lint test-ci db-push-dev

[group('dev')]
format: prettier prisma-format

[group('dev')]
prettier:
  bunx prettier . --write

[group('dev')]
prisma-format:
  bun -b prisma format

[group('lint')]
lint: typecheck eslint prisma-validate

[group('lint')]
eslint:
  bunx -b eslint .

[group('lint')]
typecheck:
  react-router typegen
  bunx -b tsc

[group('lint')]
prisma-validate:
  bun -b prisma validate

[group('test')]
test:
  bun test --watch

[group('test')]
test-ci: db-push-test
  bun test --coverage

[group('db'), group('dev')]
db-push-dev reset="":
  bunx -b prisma db push {{ if reset == "reset" { "--force-reset" } else { "" } }}

[group('db'), group('test')]
db-push-test:
  bun -b --env-file=.env.test prisma db push --force-reset

[group('db'), group('dev')]
db-push: db-push-dev db-push-test

[group('db'), group('dev')]
db-migrate-dev:
  bunx -b prisma db migrate dev

[group('db'), group('dev')]
db-migrate-reset:
  bunx -b prisma db migrate reset

[group('db'), group('prod')]
db-migrate:
  bunx -b prisma db migrate deploy

[group('storage'), group('dev')]
storage-reset:
  rm -r ./storage/*

[group('dev')]
loc:
  tokei -e app/generated app
