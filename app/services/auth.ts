import { createPermix, type PermixDefinition } from 'permix';

import { prisma } from './db';

export interface User {
  id: string;
  email: string;
  currentOrganizationId: string | null;
  organizationIds: Set<string>;
  teamIds: Set<string>;
}

interface Organization {
  organizationId: string;
}

interface Table {
  organizationId: string;
  teamIds: Set<string>;
}

interface Row {
  organizationId: string;
  teamIds: Set<string>;
}

interface Form {
  organizationId: string;
  tableId: string;
  teamIds: Set<string>;
}

interface Submission {
  organizationId: string | null;
  teamId: string | null;
  userIds: Set<string>;
}

interface Comment {
  userId: string;
  organizationId: string | null;
  teamId: string | null;
}

export async function userFind(
  userId: string,
  currentOrganizationId?: string,
): Promise<User> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId, deletedAt: null },
    select: {
      email: true,
      organizations: {
        where: { deletedAt: null },
        select: { organizationId: true },
      },
      teams: { where: { deletedAt: null }, select: { teamId: true } },
    },
  });
  const organizationIds = new Set(
    user.organizations.map(({ organizationId }) => organizationId),
  );
  return {
    id: userId,
    email: user.email,
    currentOrganizationId: currentOrganizationId
      ? organizationIds.has(currentOrganizationId)
        ? currentOrganizationId
        : null
      : null,
    organizationIds,
    teamIds: new Set(user.teams.map(({ teamId }) => teamId)),
  };
}

export async function tableFind(tableId: string): Promise<Table> {
  const table = await prisma.table.findUniqueOrThrow({
    where: {
      id: tableId,
      organization: { deletedAt: null },
    },
    select: {
      organizationId: true,
      teams: { where: { deletedAt: null }, select: { teamId: true } },
    },
  });
  return {
    organizationId: table.organizationId,
    teamIds: new Set(table.teams.map((team) => team.teamId)),
  };
}

export async function formFind(formId: string): Promise<Form> {
  const { table } = await prisma.form.findUniqueOrThrow({
    where: {
      id: formId,
      table: { deletedAt: null, organization: { deletedAt: null } },
    },
    select: {
      table: {
        select: {
          id: true,
          organizationId: true,
          teams: { where: { deletedAt: null }, select: { teamId: true } },
        },
      },
    },
  });
  return {
    organizationId: table.organizationId,
    tableId: table.id,
    teamIds: new Set(table.teams.map((team) => team.teamId)),
  };
}

export async function submissionFind(
  submissionId: string,
): Promise<Submission> {
  const { users, team } = await prisma.submission.findUniqueOrThrow({
    where: {
      id: submissionId,
      form: {
        deletedAt: null,
        table: { deletedAt: null, organization: { deletedAt: null } },
      },
    },
    select: {
      team: { select: { id: true, organizationId: true } },
      users: { where: { deletedAt: null }, select: { userId: true } },
    },
  });
  return {
    userIds: new Set(users.map((user) => user.userId)),
    teamId: team?.id ?? null,
    organizationId: team?.organizationId ?? null,
  };
}

export async function rowFind(rowId: string): Promise<Row> {
  const { table, teams } = await prisma.row.findUniqueOrThrow({
    where: {
      id: rowId,
      table: { deletedAt: null, organization: { deletedAt: null } },
      submission: null,
    },
    select: {
      table: { select: { id: true, organizationId: true } },
      teams: { where: { deletedAt: null }, select: { teamId: true } },
    },
  });
  return {
    organizationId: table.organizationId,
    teamIds: new Set(teams.map((team) => team.teamId)),
  };
}

export async function commentFind(commentId: string): Promise<Comment> {
  const {
    userId,
    row: { table },
  } = await prisma.comment.findUniqueOrThrow({
    where: {
      id: commentId,
      row: { table: { deletedAt: null, organization: { deletedAt: null } } },
    },
    select: {
      userId: true,
      row: { select: { table: { select: { organizationId: true } } } },
    },
  });
  return {
    userId,
    organizationId: table.organizationId,
    teamId: null,
  };
}

export type Definition = PermixDefinition<{
  import: {
    action: 'create';
  };
  organization: {
    dataType: Organization;
    action: 'read' | 'write' | 'create' | 'createTable' | 'list';
  };
  table: {
    dataType: Table;
    action: 'read' | 'write' | 'createRow' | 'createForm';
  };
  form: {
    dataType: Form;
    action: 'read' | 'write';
  };
  submission: {
    dataType: Submission;
    action: 'read' | 'write' | 'start' | 'submit' | 'comment' | 'list';
  };
  row: {
    dataType: Row;
    action: 'read' | 'write';
  };
  comment: {
    dataType: Comment;
    action: 'read' | 'write';
  };
}>;

const permix = createPermix<Definition>();

const anonymousPermissions = permix.template({
  import: { create: false },
  organization: {
    list: false,
    read: false,
    write: false,
    create: false,
    createTable: false,
  },
  table: {
    read: false,
    write: false,
    createRow: false,
    createForm: false,
  },
  form: {
    read: true,
    write: false,
  },
  submission: {
    list: false,
    read: false,
    write: false,
    start: true,
    submit: false,
    comment: false,
  },
  row: {
    read: false,
    write: false,
  },
  comment: {
    read: false,
    write: false,
  },
});

const userPermissions = permix.template((user: User) => {
  return {
    import: { create: user.organizationIds.size != 0 },
    organization: {
      list: true,
      create: true,
      read: (organization) =>
        user.organizationIds.has(organization.organizationId),
      write: (organization) =>
        user.organizationIds.has(organization.organizationId),
      createTable: (organization) =>
        user.organizationIds.has(organization.organizationId),
    },
    table: {
      write: (table) => user.organizationIds.has(table.organizationId),
      createForm: (table) => user.organizationIds.has(table.organizationId),
      read: (table) =>
        user.organizationIds.has(table.organizationId) ||
        user.teamIds.intersection(table.teamIds).size > 0,
      createRow: (table) =>
        user.organizationIds.has(table.organizationId) ||
        user.teamIds.intersection(table.teamIds).size > 0,
    },
    form: {
      write: (form) => user.organizationIds.has(form.organizationId),
      read: (form) =>
        user.organizationIds.has(form.organizationId) ||
        user.teamIds.intersection(form.teamIds).size > 0,
    },
    submission: {
      start: true,
      list: true,
      write: (submission) => submission.userIds.has(user.id),
      submit: (submission) => submission.userIds.has(user.id),
      read: (submission) =>
        submission.userIds.has(user.id) ||
        (submission.teamId ? user.teamIds.has(submission.teamId) : false) ||
        (submission.organizationId
          ? user.organizationIds.has(submission.organizationId)
          : false),
      comment: (submission) =>
        submission.userIds.has(user.id) ||
        (submission.teamId ? user.teamIds.has(submission.teamId) : false),
    },
    row: {
      read: (row) =>
        row.teamIds.intersection(user.teamIds).size > 0 ||
        user.organizationIds.has(row.organizationId),
      write: (row) =>
        row.teamIds.intersection(user.teamIds).size > 0 ||
        user.organizationIds.has(row.organizationId),
    },
    comment: {
      write: (comment) => comment.userId == user.id,
      read: (comment) =>
        comment.userId == user.id ||
        (comment.teamId ? user.teamIds.has(comment.teamId) : false) ||
        (comment.organizationId
          ? user.organizationIds.has(comment.organizationId)
          : false),
    },
  };
});

export function permissions(user: User | null) {
  if (user) {
    return userPermissions(user);
  }
  return anonymousPermissions();
}
