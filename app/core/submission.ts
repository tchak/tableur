import { implement } from '@orpc/server';

import { withSubmission } from '~/services/auth';
import { prisma } from '~/services/db';
import { authenticatedMiddleware } from '~/services/rpc';
import { contract } from './submission.contract';

const os = implement(contract).use(authenticatedMiddleware);

const list = os.list.handler(async ({ context }) => {
  context.check('submission', 'list');
  const submissions = await prisma.submission.findMany({
    where: {
      deletedAt: null,
      users: { some: { userId: context.user.id, deletedAt: null } },
    },
    select: {
      id: true,
      number: true,
      submittedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return submissions.map((submission) => {
    if (submission.submittedAt) {
      return {
        ...submission,
        submittedAt: submission.submittedAt,
        state: 'submitted',
      };
    }
    return { ...submission, submittedAt: null, state: 'draft' };
  });
});

const find = os.find.use(withSubmission).handler(async ({ context, input }) => {
  context.check('submission', 'read', context.submission);
  const submission = await prisma.submission.findUniqueOrThrow({
    where: {
      id: input.submissionId,
      deletedAt: null,
      form: { deletedAt: null, table: { deletedAt: null } },
    },
    select: {
      id: true,
      number: true,
      submittedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (submission.submittedAt) {
    return {
      ...submission,
      submittedAt: submission.submittedAt,
      state: 'submitted',
    };
  }
  return { ...submission, submittedAt: null, state: 'draft' };
});

const start = os.start.handler(async ({ context, input }) => {
  context.check('submission', 'start');
  const form = await prisma.form.findFirstOrThrow({
    where: {
      paths: { some: { path: input.path } },
      deletedAt: null,
      table: { deletedAt: null, organization: { deletedAt: null } },
    },
    select: { id: true, tableId: true },
  });
  const submission = await prisma.$transaction(async (tx) => {
    const { lastRowNumber } = await tx.table.update({
      where: { id: form.tableId },
      data: { lastRowNumber: { increment: 1 } },
      select: { lastRowNumber: true },
    });
    return prisma.submission.create({
      data: {
        number: lastRowNumber,
        formId: form.id,
        users: { create: { userId: context.user.id } },
      },
      select: {
        id: true,
        number: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });
  return { ...submission, state: 'draft', submittedAt: null };
});

const submit = os.submit
  .use(withSubmission)
  .handler(async ({ context, input }) => {
    context.check('submission', 'submit', context.submission);

    const { number, form } = await prisma.submission.findUniqueOrThrow({
      where: {
        id: input.submissionId,
        deletedAt: null,
        form: {
          deletedAt: null,
          table: { deletedAt: null, organization: { deletedAt: null } },
        },
      },
      select: { number: true, form: { select: { tableId: true } } },
    });
    const submittedAt = new Date();
    const submission = await prisma.submission.update({
      where: {
        id: input.submissionId,
        deletedAt: null,
        form: {
          deletedAt: null,
          table: { deletedAt: null, organization: { deletedAt: null } },
        },
      },
      data: {
        submittedAt,
        row: { create: { number, tableId: form.tableId } },
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        number: true,
      },
    });
    return {
      ...submission,
      state: 'submitted',
      submittedAt: submittedAt.toISOString(),
    };
  });

const destroy = os.destroy
  .use(withSubmission)
  .handler(async ({ context, input }) => {
    context.check('submission', 'write', context.submission);
    await prisma.submission.update({
      where: {
        id: input.submissionId,
        deletedAt: null,
        form: { deletedAt: null },
      },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  });

export const router = {
  find,
  list,
  start,
  destroy,
  submit,
};
