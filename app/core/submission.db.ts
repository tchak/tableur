import { withSubmission } from '~/services/auth';
import { prisma } from '~/services/db';
import { authenticated } from '~/services/rpc';

import { StartParams, SubmissionParams } from './submission.types';

const submissionList = authenticated.handler(async ({ context }) => {
  context.check('submission', 'list');
  const submissions = await prisma.submission.findMany({
    where: {
      deletedAt: null,
      users: { some: { userId: context.user.id, deletedAt: null } },
    },
    select: {
      id: true,
      state: true,
      number: true,
      submittedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return submissions.map(({ submittedAt, state, ...submission }) => {
    if (state == 'submitted' && submittedAt) {
      return { ...submission, state, submittedAt };
    }
    return { ...submission, state: 'draft', submittedAt: null };
  });
});

const submissionGet = authenticated
  .input(SubmissionParams)
  .use(withSubmission)
  .handler(async ({ context, input }) => {
    context.check('submission', 'read', context.submission);
    const { submittedAt, state, ...submission } =
      await prisma.submission.findUniqueOrThrow({
        where: {
          id: input.submissionId,
          deletedAt: null,
          form: { deletedAt: null, table: { deletedAt: null } },
        },
        select: {
          id: true,
          state: true,
          number: true,
          submittedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    if (state == 'submitted' && submittedAt) {
      return { ...submission, state, submittedAt };
    }
    return { ...submission, state: 'draft', submittedAt: null };
  });

const submissionStart = authenticated
  .input(StartParams)
  .handler(async ({ context, input }) => {
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

const submissionSubmit = authenticated
  .input(SubmissionParams)
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
    const sub = await prisma.submission.update({
      where: {
        id: input.submissionId,
        deletedAt: null,
        form: {
          deletedAt: null,
          table: { deletedAt: null, organization: { deletedAt: null } },
        },
      },
      data: {
        state: 'submitted',
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
      ...sub,
      state: 'submitted',
      submittedAt: submittedAt.toISOString(),
    };
  });

const submissionDelete = authenticated
  .input(SubmissionParams)
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
  get: submissionGet,
  list: submissionList,
  start: submissionStart,
  delete: submissionDelete,
  submit: submissionSubmit,
};
