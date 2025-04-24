import PgBoss, { type Job, type ScheduleOptions, type SendOptions } from 'pg-boss';

import { env } from './env';
const boss = new PgBoss(env.DATABASE_URL);

export async function start() {
  await boss.start();
  const queues = await boss.getQueues();
  console.log(
    'Queues:',
    queues.map((queue) => queue.name).filter((name) => !name.startsWith('__pgboss')),
  );
}

type Worker<T> = (job: Job<T>) => Promise<void>;
const workers = new Map<string, string>();

export async function job<T extends object>(name: string, worker: Worker<T>) {
  await boss.createQueue(name);
  await startWorker(name, worker);

  return (data: T, options?: SendOptions) => boss.send({ name, data, options });
}

export async function schedule(
  name: string,
  cron: string,
  worker: Worker<void>,
  options?: ScheduleOptions,
) {
  await boss.createQueue(name);
  await startWorker(name, worker, 30);
  await boss.schedule(name, cron, undefined, options);

  return () => boss.unschedule(name);
}

async function startWorker<T>(name: string, worker: Worker<T>, pollingIntervalSeconds = 2) {
  stopWorker(name);
  const id = await boss.work(name, { pollingIntervalSeconds }, async (jobs: Job<T>[]) => {
    for (const job of jobs) {
      await worker(job);
    }
  });
  workers.set(name, id);
  return id;
}

async function stopWorker(name: string) {
  const id = workers.get(name);
  if (id) {
    await boss.offWork({ id });
  }
}
