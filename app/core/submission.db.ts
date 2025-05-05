import * as v from 'valibot';
import { prisma } from '~/services/db';

import {
  SubmissionOutput,
  type StartParams,
  type SubmissionInput,
  type SubmissionParams,
} from './submission.types';
import { DeletedOutput, type DeletedInput } from './types';

export async function submissionList() {
  const submissions: SubmissionInput[] = await prisma.submission.findMany({
    select: {
      id: true,
      state: true,
      number: true,
      submittedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return v.parse(v.array(SubmissionOutput), submissions);
}

export async function submissionGet({ submissionId }: SubmissionParams) {
  const submission: SubmissionInput = await prisma.submission.findUniqueOrThrow(
    {
      where: {
        id: submissionId,
        deletedAt: null,
        form: { deletedAt: null },
        table: { deletedAt: null, organization: { deletedAt: null } },
      },
      select: {
        id: true,
        state: true,
        number: true,
        submittedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }
  );
  return v.parse(SubmissionOutput, submission);
}

export async function submissionStart({ path }: StartParams) {
  const form = await prisma.form.findFirstOrThrow({
    where: {
      paths: { some: { path } },
      deletedAt: null,
      table: { deletedAt: null, organization: { deletedAt: null } },
    },
    select: { id: true, tableId: true },
  });
  const submission: SubmissionInput = await prisma.$transaction(async (tx) => {
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
        tableId: form.tableId,
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
  });
  return v.parse(SubmissionOutput, submission);
}

export async function submissionSubmit({ submissionId }: SubmissionParams) {
  const row = await prisma.submission.findUniqueOrThrow({
    where: {
      id: submissionId,
      deletedAt: null,
      form: { deletedAt: null },
      table: { deletedAt: null, organization: { deletedAt: null } },
    },
    select: { number: true, tableId: true },
  });
  const submission: SubmissionInput = await prisma.submission.update({
    where: {
      id: submissionId,
      deletedAt: null,
      form: { deletedAt: null },
      table: { deletedAt: null, organization: { deletedAt: null } },
    },
    data: {
      state: 'submitted',
      submittedAt: new Date(),
      row: { create: row },
    },
    select: {
      id: true,
      state: true,
      submittedAt: true,
      createdAt: true,
      updatedAt: true,
      number: true,
    },
  });
  return v.parse(SubmissionOutput, submission);
}

export async function submissionDelete({ submissionId }: SubmissionParams) {
  const submission: DeletedInput = await prisma.submission.update({
    where: {
      id: submissionId,
      deletedAt: null,
      form: { deletedAt: null },
      table: { deletedAt: null, organization: { deletedAt: null } },
    },
    data: { deletedAt: new Date() },
    select: { id: true, deletedAt: true },
  });
  return v.parse(DeletedOutput, submission);
}
