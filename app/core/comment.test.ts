import { beforeEach, describe, expect, it } from 'bun:test';
import * as v from 'valibot';

import { app } from '~/server/app';
import { createAuthToken } from '~/services/auth';
import { prisma } from '~/services/db';
import { commentCreate } from './comment.db';
import { CommentListJSON } from './comment.types';
import { organizationCreate } from './organization.db';
import { tableCreate } from './table.db';
import { userCreate } from './user.db';

describe('api/v1/tables/:id/rows/:id/comments', () => {
  let tableId: string;
  let rowId: string;
  let commentId: string;
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
      {
        name: 'Test Table',
        columns: [{ name: 'Test Column', type: 'text' }],
        rows: [{}],
      },
    );
    tableId = table.id;
    rowId = (await prisma.row.findFirstOrThrow()).id;
    const comment = await commentCreate(
      { tableId, rowId },
      { body: 'Test Comment' },
    );
    commentId = comment.id;
    const token = await createAuthToken(user.id);
    headers = { Authorization: `Bearer ${token}` };
  });

  it('should return a list of comments', async () => {
    const response = await app.request(
      `/api/v1/tables/${tableId}/rows/${rowId}/comments`,
      { headers },
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: comments } = v.parse(CommentListJSON, data);
    expect(comments.length).toEqual(1);
  });

  it('should delete a comment', async () => {
    const response = await app.request(
      `/api/v1/tables/${tableId}/rows/${rowId}/comments/${commentId}`,
      { method: 'DELETE', headers },
    );
    expect(response.status).toBe(200);

    {
      const response = await app.request(
        `/api/v1/tables/${tableId}/rows/${rowId}/comments`,
        { headers },
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      const { data: comments } = v.parse(CommentListJSON, data);
      expect(comments.length).toEqual(0);
    }
  });
});
