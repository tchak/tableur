import { beforeEach, describe, expect, it } from 'bun:test';
import * as v from 'valibot';

import { prisma } from '~/lib/db';
import { app } from '~/server/app';
import { openapi } from './organization.contract';
import { createTestUser } from './user.test';

describe('api/v1/organizations', () => {
  let organizationId: string;
  let headers: Record<string, string>;
  beforeEach(async () => {
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();

    const user = await createTestUser();
    organizationId = user.organizationId;
    headers = { authorization: user.authorization };
  });

  it('should return a list of organizations', async () => {
    const response = await app.request('/api/v1/organizations', { headers });
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: organizations } = v.parse(openapi.list, data);
    expect(organizations.length).toBe(1);
  });

  it('should return an organization', async () => {
    const response = await app.request(
      `/api/v1/organizations/${organizationId}`,
      { headers },
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: organization } = v.parse(openapi.find, data);
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
    const { data: organization } = v.parse(openapi.create, data);
    expect(organization.name).toEqual('Hello World');

    {
      const response = await app.request('/api/v1/organizations', { headers });
      expect(response.status).toBe(200);
      const data = await response.json();
      const { data: organizations } = v.parse(openapi.list, data);
      expect(organizations.length).toBe(2);
      expect(organizations.map(({ name }) => name)).toStrictEqual([
        'Test Organization',
        'Hello World',
      ]);
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

  it('should delete an organization', async () => {
    const response = await app.request(
      `/api/v1/organizations/${organizationId}`,
      {
        method: 'DELETE',
        headers,
      },
    );
    expect(response.status).toBe(204);

    {
      const response = await app.request(
        `/api/v1/organizations/${organizationId}`,
        { headers },
      );
      expect(response.status).toBe(404);
    }
  });

  it('should list organization paths', async () => {
    const response = await app.request(
      `/api/v1/organizations/${organizationId}/paths`,
      { headers },
    );
    expect(response.status).toBe(200);
  });
});
