import * as v from 'valibot';
import { prisma } from '../services/db';

import { type StartParams, type SubmissionParams, SubmissionOutput } from './submission.types';
import { DeletedOutput } from './types';

export async function submissionList() {
  const submissions: v.InferInput<typeof SubmissionOutput>[] = await prisma.submission.findMany({
    select: { id: true, state: true, submittedAt: true, createdAt: true, updatedAt: true },
  });
  return v.parse(v.array(SubmissionOutput), submissions);
}

export async function submissionGet({ submissionId }: SubmissionParams) {
  const submission: v.InferInput<typeof SubmissionOutput> =
    await prisma.submission.findUniqueOrThrow({
      where: {
        id: submissionId,
        deletedAt: null,
        form: { deletedAt: null },
        table: { deletedAt: null, organization: { deletedAt: null } },
      },
      select: { id: true, state: true, submittedAt: true, createdAt: true, updatedAt: true },
    });
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

  const submission: v.InferInput<typeof SubmissionOutput> = await prisma.submission.create({
    data: {
      number: 1,
      formId: form.id,
      tableId: form.tableId,
    },
    select: { id: true, state: true, submittedAt: true, createdAt: true, updatedAt: true },
  });
  return v.parse(SubmissionOutput, submission);
}

export async function submissionSubmit({ submissionId }: SubmissionParams) {
  const submission: v.InferInput<typeof SubmissionOutput> = await prisma.submission.update({
    where: {
      id: submissionId,
      deletedAt: null,
      form: { deletedAt: null },
      table: { deletedAt: null, organization: { deletedAt: null } },
    },
    data: { submittedAt: new Date() },
    select: { id: true, state: true, submittedAt: true, createdAt: true, updatedAt: true },
  });
  return v.parse(SubmissionOutput, submission);
}

export async function submissionDelete({ submissionId }: SubmissionParams) {
  const submission = await prisma.submission.update({
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
