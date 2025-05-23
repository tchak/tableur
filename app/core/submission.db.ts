import { submissionFind } from '~/services/auth';
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
  .handler(async ({ context, input }) => {
    const data = await submissionFind(input.submissionId);
    context.check('submission', 'read', data);
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
      const sequence = await tx.tableRowSequence.upsert({
        where: { tableId: form.tableId },
        update: { lastRowNumber: { increment: 1 } },
        create: { tableId: form.tableId },
        select: { lastRowNumber: true },
      });
      return prisma.submission.create({
        data: {
          number: sequence.lastRowNumber,
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
  .handler(async ({ context, input }) => {
    const submission = await submissionFind(input.submissionId);
    context.check('submission', 'submit', submission);

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
  .handler(async ({ context, input }) => {
    const submission = await submissionFind(input.submissionId);
    context.check('submission', 'write', submission);
    await prisma.submission.update({
      where: {
        id: input.submissionId,
        deletedAt: null,
        form: { deletedAt: null },
      },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  });

export const router = {
  get: submissionGet,
  list: submissionList,
  start: submissionStart,
  delete: submissionDelete,
  submit: submissionSubmit,
};
