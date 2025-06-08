export PATH := "./node_modules/.bin:" + env_var('PATH')
export BUN_OPTIONS := "--bun"

default: dev

[group('dev')]
dev:
  bunx vite

[group('prod')]
start:
  bun ./build/server/index.js

[group('dev')]
build: i18n
  bunx react-router build

[group('dev')]
install:
  bun install

[group('dev')]
setup: install lint test-ci db-push-dev

[group('dev')]
format: prettier-format prisma-format

[group('dev')]
prettier-format:
  bunx prettier . --write

[group('dev')]
prisma-format:
  bunx prisma format

[group('lint')]
lint: eslint prisma-validate prettier-check typecheck

[group('lint')]
eslint:
  bunx eslint .

[group('lint')]
typecheck:
  bunx react-router typegen
  bunx tsc

[group('lint')]
prisma-validate:
  bunx prisma validate

[group('lint')]
prettier-check:
  bunx prettier . --check

[group('test')]
test:
  bun test --watch

[group('test')]
test-ci: db-push-test
  bun test --coverage

[group('test')]
playwright-install:
  playwright install --with-deps

[group('test')]
playwright-test:
  playwright test

[group('db'), group('dev')]
db-push-dev reset="":
  bunx prisma db push {{ if reset == "reset" { "--force-reset" } else { "" } }}

[group('db'), group('test')]
db-push-test:
  bun --env-file=.env.test prisma db push --force-reset

[group('db'), group('dev')]
db-push: db-push-dev db-push-test

[group('db'), group('dev')]
db-migrate-dev:
  bunx prisma db migrate dev

[group('db'), group('dev')]
db-migrate-reset:
  bunx prisma db migrate reset

[group('db'), group('prod')]
db-migrate:
  bunx prisma db migrate deploy

[group('storage'), group('dev')]
storage-reset:
  rm -r ./storage/*

[group('dev')]
loc:
  tokei -e app/generated app

[group('dev')]
secret:
  bun -p "import { randomBytes } from 'node:crypto'; randomBytes(64).toString('hex')"

[group('dev')]
act:
  act push

[group('dev'), group('i18n')]
i18n-extract:
  bunx lingui extract --clean

[group('dev'), group('i18n')]
i18n-compile:
  bunx lingui compile

[group('dev'), group('i18n')]
i18n: i18n-extract i18n-compile
