import { beforeEach, describe, expect, it } from 'bun:test';
import * as v from 'valibot';

import { app } from '../server/app';
import { prisma } from '../services/db';
import { commentCreate } from './comment.db';
import { CommentListJSON } from './comment.types';
import { organizationCreate } from './organization.db';
import { tableCreate } from './table.db';

describe('api/v1/tables/:id/rows/:id/comments', () => {
  let tableId: string;
  let rowId: string;
  let commentId: string;
  beforeEach(async () => {
    await prisma.organization.deleteMany();
    const organization = await organizationCreate({ name: 'Test Organization' });
    const table = await tableCreate(
      { organizationId: organization.id },
      { name: 'Test Table', columns: [{ name: 'Test Column', type: 'text' }], rows: [{}] },
    );
    tableId = table.id;
    rowId = (await prisma.row.findFirstOrThrow()).id;
    const comment = await commentCreate({ tableId, rowId }, { body: 'Test Comment' });
    commentId = comment.id;
  });

  it('should return a list of comments', async () => {
    const response = await app.request(`/api/v1/tables/${tableId}/rows/${rowId}/comments`);
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: comments } = v.parse(CommentListJSON, data);
    expect(comments.length).toEqual(1);
  });

  it('should delete a comment', async () => {
    const response = await app.request(
      `/api/v1/tables/${tableId}/rows/${rowId}/comments/${commentId}`,
      { method: 'DELETE' },
    );
    expect(response.status).toBe(200);

    {
      const response = await app.request(`/api/v1/tables/${tableId}/rows/${rowId}/comments`);
      expect(response.status).toBe(200);
      const data = await response.json();
      const { data: comments } = v.parse(CommentListJSON, data);
      expect(comments.length).toEqual(0);
    }
  });
});
