import { beforeEach, describe, expect, it } from 'bun:test';
import * as v from 'valibot';

import { app } from '~/server/app';
import { prisma } from '~/services/db';
import { openapi } from './form.contract';
import { client } from './router';
import { createTestUser } from './user.test';

describe('api/v1/tables/:id/forms', () => {
  let tableId: string;
  let formId: string;
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
    tableId = table.id;
    const form = await client.form.create(
      {
        tableId,
        name: 'Test Form',
        title: 'Test Section',
        path: 'test-form',
      },
      { context: { user: user.user } },
    );
    formId = form.id;
  });

  it('should return a list of forms', async () => {
    const response = await app.request(`/api/v1/tables/${tableId}/forms`, {
      headers,
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: forms } = v.parse(openapi.list, data);
    expect(forms.length).toBe(1);
  });

  it('should return a form', async () => {
    const response = await app.request(`/api/v1/forms/${formId}`, { headers });
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: form } = v.parse(openapi.find, data);
    expect(form.id).toEqual(formId);
    expect(form.pages.length).toBe(1);
    const page = form.pages.at(0);
    expect(page?.sections.length).toBe(1);
    const section = page?.sections.at(0);
    expect(section?.fields.length).toBe(1);
    const field = section?.fields.at(0);
    expect(field?.label).toEqual('Test Column');
  });

  it('should create a form', async () => {
    const response = await app.request(`/api/v1/tables/${tableId}/forms`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({
        name: 'Hello World',
        title: 'First Section',
        path: 'test-form-new',
      }),
    });
    expect(response.status).toBe(201);
    const data = await response.json();
    const { data: table } = v.parse(openapi.create, data);
    expect(table.name).toEqual('Hello World');
    expect(table.paths).toEqual(['test-form-new']);

    {
      const response = await app.request(`/api/v1/tables/${tableId}/forms`, {
        headers,
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      const { data: forms } = v.parse(openapi.list, data);
      expect(forms.length).toBe(2);
      expect(forms.map(({ name }) => name)).toStrictEqual([
        'Test Form',
        'Hello World',
      ]);
      expect(forms.map(({ paths }) => paths[0])).toStrictEqual([
        'test-form',
        'test-form-new',
      ]);
    }
  });

  it('should delete a form', async () => {
    const response = await app.request(`/api/v1/forms/${formId}`, {
      method: 'DELETE',
      headers,
    });
    expect(response.status).toBe(204);

    {
      const response = await app.request(`/api/v1/forms/${formId}`, {
        headers,
      });
      expect(response.status).toBe(404);
    }
  });

  it('should update a form', async () => {
    const response = await app.request(`/api/v1/forms/${formId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({
        name: 'Hello World!',
      }),
    });
    expect(response.status).toBe(204);
  });
});
