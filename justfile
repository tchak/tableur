export PATH := "./node_modules/.bin:" + env_var('PATH')

default: dev

[group('dev')]
dev:
  bun -b ./app/server/index.ts

[group('prod')]
start:
  bun -b ./app/server/index.ts

[group('dev')]
install:
  bun install

[group('dev')]
setup: install lint test-ci db-push-dev

[group('lint')]
lint: tsc eslint

[group('lint')]
eslint:
  bun -b eslint .

[group('lint')]
tsc:
  bun -b tsc

[group('test')]
test:
  bun test --watch

[group('test')]
test-ci: db-push-test
  bun test --coverage

[group('db'), group('dev')]
db-push-dev reset="":
  bun -b prisma db push {{ if reset == "reset" { "--force-reset" } else { "" } }}

[group('db'), group('test')]
db-push-test:
  bun -b --env-file=.env.test prisma db push --force-reset

[group('db'), group('dev')]
db-push: db-push-dev db-push-test

[group('db'), group('dev')]
db-migrate-dev:
  bun -b prisma db migrate dev

[group('db'), group('dev')]
db-migrate-reset:
  bun -b prisma db migrate reset

[group('db'), group('prod')]
db-migrate:
  bun -b prisma db migrate deploy

[group('storage'), group('dev')]
storage-reset:
  rm -r ./storage/*
