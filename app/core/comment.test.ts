import { beforeEach, describe, expect, it } from 'bun:test';
import * as v from 'valibot';

import { app } from '~/server/app';
import { prisma } from '~/services/db';
import { openapi } from './comment.contract';
import { client } from './router';
import { createTestUser } from './user.test';

describe('api/v1/rows/:id/comments', () => {
  let rowId: string;
  let commentId: string;
  let headers: Record<string, string>;
  beforeEach(async () => {
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();

    const user = await createTestUser();
    headers = { authorization: user.authorization };

    await client.table.create(
      {
        organizationId: user.organizationId,
        name: 'Test Table',
        columns: [{ name: 'Test Column', type: 'text' }],
        rows: [{}],
      },
      { context: { user: user.user } },
    );
    rowId = (await prisma.row.findFirstOrThrow()).id;
    const comment = await client.comment.create(
      { rowId, body: 'Test Comment' },
      { context: { user: user.user } },
    );
    commentId = comment.id;
  });

  it('should return a list of comments', async () => {
    const response = await app.request(`/api/v1/rows/${rowId}/comments`, {
      headers,
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: comments } = v.parse(openapi.list, data);
    expect(comments.length).toEqual(1);
  });

  it('should delete a comment', async () => {
    const response = await app.request(
      `/api/v1/rows/${rowId}/comments/${commentId}`,
      { method: 'DELETE', headers },
    );
    expect(response.status).toBe(204);

    {
      const response = await app.request(`/api/v1/rows/${rowId}/comments`, {
        headers,
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      const { data: comments } = v.parse(openapi.list, data);
      expect(comments.length).toEqual(0);
    }
  });
});
