import { beforeEach, describe, expect, it } from 'bun:test';
import * as v from 'valibot';

import { app } from '~/server/app';
import { prisma } from '~/services/db';
import { client } from './router';
import { SubmissionGetJSON, SubmissionListJSON } from './submission.types';
import { createTestUser } from './user.test';

describe('api/v1/submissions', () => {
  let submissionId: string;
  let headers: Record<string, string>;
  beforeEach(async () => {
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();

    const user = await createTestUser();
    headers = { authorization: user.authorization };

    const table = await client.table.create(
      {
        organizationId: user.organizationId,
        name: 'Test Table',
        columns: [{ name: 'Test Column', type: 'text' }],
      },
      { context: { user: user.user } },
    );
    await client.form.create(
      {
        tableId: table.id,
        name: 'Test Form',
        title: 'Test Section',
        path: 'test-form',
      },
      { context: { user: user.user } },
    );
    const submission = await client.submission.start(
      { path: 'test-form' },
      { context: { user: user.user } },
    );
    submissionId = submission.id;
  });

  it('should return a list of submissions', async () => {
    const response = await app.request(`/api/v1/submissions`, { headers });
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: submissions } = v.parse(SubmissionListJSON, data);
    expect(submissions.length).toBe(1);
  });

  it('should return a submission', async () => {
    const response = await app.request(`/api/v1/submissions/${submissionId}`, {
      headers,
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: submission } = v.parse(SubmissionGetJSON, data);
    expect(submission.id).toEqual(submissionId);
  });

  it('should start a submission', async () => {
    const response = await app.request(`/api/v1/start/test-form`, {
      method: 'POST',
      headers,
    });
    expect(response.status).toBe(201);
    const data = await response.json();
    const { data: submission } = v.parse(SubmissionGetJSON, data);
    expect(submission.number).toEqual(2);
    expect(submission.state).toEqual('draft');
    expect(submission.submittedAt).toBeNull();

    {
      const response = await app.request(`/api/v1/submissions`, { headers });
      expect(response.status).toBe(200);
      const data = await response.json();
      const { data: submission } = v.parse(SubmissionListJSON, data);
      expect(submission.length).toBe(2);
    }
  });

  it('should submit a submission', async () => {
    const response = await app.request(`/api/v1/submissions/${submissionId}`, {
      method: 'POST',
      headers,
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: submission } = v.parse(SubmissionGetJSON, data);
    expect(submission.number).toEqual(1);
    expect(submission.state).toEqual('submitted');
    expect(submission.submittedAt).not.toBeNull();
  });

  it('should delete a submission', async () => {
    const response = await app.request(`/api/v1/submissions/${submissionId}`, {
      method: 'DELETE',
      headers,
    });
    expect(response.status).toBe(204);

    {
      const response = await app.request(
        `/api/v1/submissions/${submissionId}`,
        { headers },
      );
      expect(response.status).toBe(404);
    }
  });
});
