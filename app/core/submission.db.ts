import * as v from 'valibot';
import { prisma } from '~/services/db';

import type {
  StartParams,
  SubmissionJSON,
  SubmissionParams,
} from './submission.types';
import { DeletedOutput, type DeletedInput } from './types';
import { UserParams } from './user.types';

export async function submissionList({
  userId,
}: UserParams): Promise<SubmissionJSON[]> {
  const submissions = await prisma.submission.findMany({
    where: { deletedAt: null, users: { some: { userId, deletedAt: null } } },
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
}

export async function submissionGet({
  submissionId,
}: SubmissionParams): Promise<SubmissionJSON> {
  const { submittedAt, state, ...submission } =
    await prisma.submission.findUniqueOrThrow({
      where: {
        id: submissionId,
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
}

export async function submissionStart(
  { userId }: UserParams,
  { path }: StartParams,
): Promise<SubmissionJSON> {
  const form = await prisma.form.findFirstOrThrow({
    where: {
      paths: { some: { path } },
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
        users: { create: { userId } },
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
}

export async function submissionSubmit({
  submissionId,
}: SubmissionParams): Promise<SubmissionJSON> {
  const { number, form } = await prisma.submission.findUniqueOrThrow({
    where: {
      id: submissionId,
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
      id: submissionId,
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
    ...submission,
    state: 'submitted',
    submittedAt: submittedAt.toISOString(),
  };
}

export async function submissionDelete({ submissionId }: SubmissionParams) {
  const submission: DeletedInput = await prisma.submission.update({
    where: {
      id: submissionId,
      deletedAt: null,
      form: {
        deletedAt: null,
        table: { deletedAt: null, organization: { deletedAt: null } },
      },
    },
    data: { deletedAt: new Date() },
    select: { id: true, deletedAt: true },
  });
  return v.parse(DeletedOutput, submission);
}
