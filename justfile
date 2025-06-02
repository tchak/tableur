export PATH := "./node_modules/.bin:" + env_var('PATH')

default: dev

[group('dev')]
dev:
  bun -b vite

[group('prod')]
start:
  bun ./build/server/index.js

[group('dev')]
build: i18n
  bun -b react-router build

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
  bun -b prisma format

[group('lint')]
lint: eslint prisma-validate prettier-check typecheck

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
  bunx playwright install --with-deps

[group('test')]
playwright-test:
  bun --env-file=.env.test playwright test

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

[group('dev')]
secret:
  bun -p "import { randomBytes } from 'node:crypto'; randomBytes(64).toString('hex')"

[group('dev')]
act:
  act push

[group('dev'), group('i18n')]
i18n-extract:
  bunx -b lingui extract --clean

[group('dev'), group('i18n')]
i18n-compile:
  bunx -b lingui compile

[group('dev'), group('i18n')]
i18n: i18n-extract i18n-compile
