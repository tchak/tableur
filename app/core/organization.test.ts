import { beforeEach, describe, expect, it } from 'bun:test';
import * as v from 'valibot';

import { app } from '~/server/app';
import { createAuthToken } from '~/services/auth';
import { prisma } from '~/services/db';
import { organizationCreate } from './organization.db';
import {
  OrganizationGetJSON,
  OrganizationListJSON,
} from './organization.types';
import { userCreate } from './user.db';

describe.only('api/v1/organizations', () => {
  let organizationId: string;
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
    organizationId = organization.id;
    const token = await createAuthToken(user.id);
    headers = { Authorization: `Bearer ${token}` };
  });

  it('should return a list of organizations', async () => {
    const response = await app.request('/api/v1/organizations', { headers });
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: organizations } = v.parse(OrganizationListJSON, data);
    expect(organizations.length).toBe(1);
  });

  it('should return an organization', async () => {
    const response = await app.request(
      `/api/v1/organizations/${organizationId}`,
      { headers },
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: organization } = v.parse(OrganizationGetJSON, data);
    expect(organization.id).toEqual(organizationId);
  });

  it('should create an organization', async () => {
    const response = await app.request(`/api/v1/organizations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({
        name: 'Hello World',
      }),
    });
    expect(response.status).toBe(201);
    const data = await response.json();
    const { data: organization } = v.parse(OrganizationGetJSON, data);
    expect(organization.name).toEqual('Hello World');

    {
      const response = await app.request('/api/v1/organizations', { headers });
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
    const response = await app.request(
      `/api/v1/organizations/${organizationId}`,
      {
        method: 'DELETE',
        headers,
      },
    );
    expect(response.status).toBe(200);

    {
      const response = await app.request(
        `/api/v1/organizations/${organizationId}`,
        { headers },
      );
      expect(response.status).toBe(403);
    }
  });

  it('should update an organization', async () => {
    const response = await app.request(
      `/api/v1/organizations/${organizationId}`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify({
          name: 'Hello World!',
        }),
      },
    );
    expect(response.status).toBe(204);
  });

  it('should list organization paths', async () => {
    const response = await app.request(
      `/api/v1/organizations/${organizationId}/paths`,
      { headers },
    );
    expect(response.status).toBe(200);
  });
});
