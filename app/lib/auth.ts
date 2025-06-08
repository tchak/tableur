import { os } from '@orpc/server';
import { createPermix, type PermixDefinition } from 'permix';

import { prisma } from './db';

export interface User {
  id: string;
  email: string;
  currentOrganizationId: string | null;
  organizationIds: Set<string>;
  teamIds: Set<string>;
}

export async function findUser(
  userId: string,
  sessionOrganizationId?: string,
): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: {
      email: true,
      organizations: {
        where: { deletedAt: null },
        orderBy: { organization: { createdAt: 'asc' } },
        select: { organizationId: true },
      },
      teams: { where: { deletedAt: null }, select: { teamId: true } },
    },
  });
  if (!user) return null;
  const organizationIds = new Set(
    user.organizations.map(({ organizationId }) => organizationId),
  );
  const firstOrganizationId = user.organizations.at(0)?.organizationId ?? null;
  const currentOrganizationId = sessionOrganizationId
    ? organizationIds.has(sessionOrganizationId)
      ? sessionOrganizationId
      : firstOrganizationId
    : firstOrganizationId;

  return {
    id: userId,
    email: user.email,
    currentOrganizationId,
    organizationIds,
    teamIds: new Set(user.teams.map(({ teamId }) => teamId)),
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

export function permissions(user: User | null) {
  if (user) {
    return userPermissions(user);
  }
  return anonymousPermissions();
}

export const withTable = os.middleware(async ({ next }, input: TableInput) => {
  const table = await findTable(input);
  return next({ context: { table } });
});

export const withForm = os.middleware(async ({ next }, input: FormInput) => {
  const form = await findForm(input);
  return next({ context: { form } });
});

export const withComment = os.middleware(
  async ({ next }, input: CommentInput) => {
    const comment = await findComment(input);
    return next({ context: { comment } });
  },
);

export const withSubmission = os.middleware(
  async ({ next }, input: SubmissionInput) => {
    const submission = await findSubmission(input);
    return next({ context: { submission } });
  },
);

export const withRow = os.middleware(async ({ next }, input: RowInput) => {
  const row = await findRow(input);
  return next({ context: { row } });
});

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

interface Organization {
  organizationId: string;
}

interface TableInput {
  tableId: string;
}

interface Table {
  organizationId: string;
  teamIds: Set<string>;
}

async function findTable(input: TableInput): Promise<Table> {
  const table = await prisma.table.findUniqueOrThrow({
    where: {
      id: input.tableId,
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

interface FormInput {
  formId: string;
}

interface Form {
  organizationId: string;
  tableId: string;
  teamIds: Set<string>;
}

async function findForm(input: FormInput): Promise<Form> {
  const { table } = await prisma.form.findUniqueOrThrow({
    where: {
      id: input.formId,
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

interface CommentInput {
  commentId: string;
}

interface Comment {
  userId: string;
  organizationId: string | null;
  teamId: string | null;
}

async function findComment(input: CommentInput): Promise<Comment> {
  const {
    userId,
    row: { table },
  } = await prisma.comment.findUniqueOrThrow({
    where: {
      id: input.commentId,
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

interface SubmissionInput {
  submissionId: string;
}

interface Submission {
  organizationId: string | null;
  teamId: string | null;
  userIds: Set<string>;
}

async function findSubmission(input: SubmissionInput): Promise<Submission> {
  const { users, team } = await prisma.submission.findUniqueOrThrow({
    where: {
      id: input.submissionId,
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

interface RowInput {
  rowId: string;
}

interface Row {
  organizationId: string;
  teamIds: Set<string>;
}

async function findRow(input: RowInput): Promise<Row> {
  const { table, teams } = await prisma.row.findUniqueOrThrow({
    where: {
      id: input.rowId,
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
