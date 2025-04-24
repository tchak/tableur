import { beforeEach, describe, expect, it } from 'bun:test';
import * as v from 'valibot';

import { app } from '../server/app';
import { prisma } from '../services/db';
import { formCreate } from './form.db';
import { FormCreateJSON, FormGetJSON, FormListJSON } from './form.types';
import { organizationCreate } from './organization.db';
import { tableCreate } from './table.db';

describe('api/v1/tables/:id/forms', () => {
  let tableId: string;
  let formId: string;
  beforeEach(async () => {
    await prisma.organization.deleteMany();
    const organization = await organizationCreate({ name: 'Test Organization' });
    const table = await tableCreate(
      { organizationId: organization.id },
      { name: 'Test Table', columns: [{ name: 'Test Column', type: 'text' }] },
    );
    tableId = table.id;
    const form = await formCreate(
      { tableId },
      { name: 'Test Form', title: 'Test Section', path: 'test-form' },
    );
    formId = form.id;
  });

  it('should return a list of forms', async () => {
    const response = await app.request(`/api/v1/tables/${tableId}/forms`);
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: forms } = v.parse(FormListJSON, data);
    expect(forms.length).toBe(1);
  });

  it('should return a form', async () => {
    const response = await app.request(`/api/v1/tables/${tableId}/forms/${formId}`);
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: form } = v.parse(FormGetJSON, data);
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
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Hello World',
        title: 'First Section',
        path: 'test-form-new',
      }),
    });
    expect(response.status).toBe(201);
    const data = await response.json();
    const { data: table } = v.parse(FormCreateJSON, data);
    expect(table.name).toEqual('Hello World');
    expect(table.paths).toEqual(['test-form-new']);

    {
      const response = await app.request(`/api/v1/tables/${tableId}/forms`);
      expect(response.status).toBe(200);
      const data = await response.json();
      const { data: forms } = v.parse(FormListJSON, data);
      expect(forms.length).toBe(2);
      expect(forms.map(({ name }) => name)).toStrictEqual(['Test Form', 'Hello World']);
      expect(forms.map(({ paths }) => paths[0])).toStrictEqual(['test-form', 'test-form-new']);
    }
  });

  it('should delete a form', async () => {
    const response = await app.request(`/api/v1/tables/${tableId}/forms/${formId}`, {
      method: 'DELETE',
    });
    expect(response.status).toBe(200);

    {
      const response = await app.request(`/api/v1/tables/${tableId}/forms/${formId}`);
      expect(response.status).toBe(404);
    }
  });

  it('should update a form', async () => {
    const response = await app.request(`/api/v1/tables/${tableId}/forms/${formId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Hello World!',
      }),
    });
    expect(response.status).toBe(200);
  });
});
