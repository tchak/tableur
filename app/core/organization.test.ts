import { beforeEach, describe, expect, it } from 'bun:test';
import * as v from 'valibot';

import { app } from '../server/app';
import { prisma } from '../services/db';
import { organizationCreate } from './organization.db';
import { OrganizationGetJSON, OrganizationListJSON } from './organization.types';

describe('api/v1/organizations', () => {
  let organizationId: string;
  beforeEach(async () => {
    await prisma.organization.deleteMany();
    const organization = await organizationCreate({ name: 'Test Organization' });
    organizationId = organization.id;
  });

  it('should return a list of organizations', async () => {
    const response = await app.request('/api/v1/organizations');
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: organizations } = v.parse(OrganizationListJSON, data);
    expect(organizations.length).toBe(1);
  });

  it('should return an organization', async () => {
    const response = await app.request(`/api/v1/organizations/${organizationId}`);
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: organization } = v.parse(OrganizationGetJSON, data);
    expect(organization.id).toEqual(organizationId);
  });

  it('should create an organization', async () => {
    const response = await app.request(`/api/v1/organizations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Hello World',
      }),
    });
    expect(response.status).toBe(201);
    const data = await response.json();
    const { data: organization } = v.parse(OrganizationGetJSON, data);
    expect(organization.name).toEqual('Hello World');

    {
      const response = await app.request('/api/v1/organizations');
      expect(response.status).toBe(200);
      const data = await response.json();
      const { data: organizations } = v.parse(OrganizationListJSON, data);
      expect(organizations.length).toBe(2);
      expect(organizations.map(({ name }) => name)).toStrictEqual([
        'Test Organization',
        'Hello World',
      ]);
    }
  });

  it('should delete an organization', async () => {
    const response = await app.request(`/api/v1/organizations/${organizationId}`, {
      method: 'DELETE',
    });
    expect(response.status).toBe(200);

    {
      const response = await app.request(`/api/v1/organizations/${organizationId}`);
      expect(response.status).toBe(404);
    }
  });

  it('should update an organization', async () => {
    const response = await app.request(`/api/v1/organizations/${organizationId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Hello World!',
      }),
    });
    expect(response.status).toBe(204);
  });

  it('should list organization paths', async () => {
    const response = await app.request(`/api/v1/organizations/${organizationId}/paths`);
    expect(response.status).toBe(200);
  });
});
