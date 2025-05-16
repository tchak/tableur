import { beforeEach, describe, expect, it } from 'bun:test';
import * as v from 'valibot';

import { app } from '~/server/app';
import { createAuthToken } from '~/services/auth';
import { prisma } from '~/services/db';
import { formCreate } from './form.db';
import { organizationCreate } from './organization.db';
import { submissionStart } from './submission.db';
import { SubmissionGetJSON, SubmissionListJSON } from './submission.types';
import { tableCreate } from './table.db';
import { userCreate } from './user.db';

describe('api/v1/submissions', () => {
  let submissionId: string;
  let headers: Record<string, string>;
  beforeEach(async () => {
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();
    const user = await userCreate({ email: 'test@example.com' });
    const organization = await organizationCreate(
      { userId: user.id },
      {
        name: 'Test Organization',
      },
    );
    const table = await tableCreate(
      { organizationId: organization.id },
      { name: 'Test Table', columns: [{ name: 'Test Column', type: 'text' }] },
    );
    await formCreate(
      { tableId: table.id },
      { name: 'Test Form', title: 'Test Section', path: 'test-form' },
    );
    const submission = await submissionStart(
      { userId: user.id },
      { path: 'test-form' },
    );
    submissionId = submission.id;
    const token = await createAuthToken(user.id);
    headers = { Authorization: `Bearer ${token}` };
  });

  it('should return a list of submissions', async () => {
    const response = await app.request(`/api/v1/submissions`, { headers });
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: submissions } = v.parse(SubmissionListJSON, data);
    expect(submissions.length).toBe(1);
  });

  it('should return a submission', async () => {
    const response = await app.request(`/api/v1/submissions/${submissionId}`);
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
    });
    expect(response.status).toBe(200);

    {
      const response = await app.request(`/api/v1/submissions/${submissionId}`);
      expect(response.status).toBe(404);
    }
  });
});
