import { describe, expect, it } from 'bun:test';
import { Temporal } from 'temporal-polyfill';

import { compute, type Expression } from './expression';

describe('expression', () => {
  describe('number', () => {
    it('eq', () => {
      const columnId = crypto.randomUUID();
      const expression: Expression = {
        type: 'binary',
        left: { id: columnId },
        operator: 'eq',
        right: { type: 'number', value: 2 },
      };
      expect(compute(expression, {})).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'text', value: 'hello' } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 1 } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 2 } })).toBeTrue();
    });

    it('ne', () => {
      const columnId = crypto.randomUUID();
      const expression: Expression = {
        type: 'binary',
        left: { id: columnId },
        operator: 'ne',
        right: { type: 'number', value: 2 },
      };
      expect(compute(expression, {})).toBeTrue();
      expect(compute(expression, { [columnId]: { type: 'text', value: 'hello' } })).toBeTrue();
      expect(compute(expression, { [columnId]: { type: 'number', value: 1 } })).toBeTrue();
      expect(compute(expression, { [columnId]: { type: 'number', value: 2 } })).toBeFalse();
    });

    it('gt', () => {
      const columnId = crypto.randomUUID();
      const expression: Expression = {
        type: 'binary',
        left: { id: columnId },
        operator: 'gt',
        right: { type: 'number', value: 2 },
      };
      expect(compute(expression, {})).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'text', value: 'hello' } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 1 } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 2 } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 3 } })).toBeTrue();
    });

    it('gte', () => {
      const columnId = crypto.randomUUID();
      const expression: Expression = {
        type: 'binary',
        left: { id: columnId },
        operator: 'gte',
        right: { type: 'number', value: 2 },
      };
      expect(compute(expression, {})).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'text', value: 'hello' } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 1 } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 2 } })).toBeTrue();
      expect(compute(expression, { [columnId]: { type: 'number', value: 3 } })).toBeTrue();
    });

    it('lt', () => {
      const columnId = crypto.randomUUID();
      const expression: Expression = {
        type: 'binary',
        left: { id: columnId },
        operator: 'lt',
        right: { type: 'number', value: 2 },
      };
      expect(compute(expression, {})).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'text', value: 'hello' } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 1 } })).toBeTrue();
      expect(compute(expression, { [columnId]: { type: 'number', value: 2 } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 3 } })).toBeFalse();
    });

    it('lte', () => {
      const columnId = crypto.randomUUID();
      const expression: Expression = {
        type: 'binary',
        left: { id: columnId },
        operator: 'lte',
        right: { type: 'number', value: 2 },
      };
      expect(compute(expression, {})).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'text', value: 'hello' } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 1 } })).toBeTrue();
      expect(compute(expression, { [columnId]: { type: 'number', value: 2 } })).toBeTrue();
      expect(compute(expression, { [columnId]: { type: 'number', value: 3 } })).toBeFalse();
    });
  });

  describe('text', () => {
    it('eq', () => {
      const columnId = crypto.randomUUID();
      const expression: Expression = {
        type: 'binary',
        left: { id: columnId },
        operator: 'eq',
        right: { type: 'text', value: 'hello' },
      };
      expect(compute(expression, {})).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 1 } })).toBeFalse();
      expect(
        compute(expression, { [columnId]: { type: 'text', value: 'hello world' } }),
      ).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'text', value: 'hello' } })).toBeTrue();
    });

    it('ne', () => {
      const columnId = crypto.randomUUID();
      const expression: Expression = {
        type: 'binary',
        left: { id: columnId },
        operator: 'ne',
        right: { type: 'text', value: 'hello' },
      };
      expect(compute(expression, {})).toBeTrue();
      expect(compute(expression, { [columnId]: { type: 'number', value: 1 } })).toBeTrue();
      expect(
        compute(expression, { [columnId]: { type: 'text', value: 'hello world' } }),
      ).toBeTrue();
      expect(compute(expression, { [columnId]: { type: 'text', value: 'hello' } })).toBeFalse();
    });
  });

  describe('boolean', () => {
    it('eq', () => {
      const columnId = crypto.randomUUID();
      const expression: Expression = {
        type: 'binary',
        left: { id: columnId },
        operator: 'eq',
        right: { type: 'boolean', value: true },
      };
      expect(compute(expression, {})).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 1 } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'boolean', value: false } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'boolean', value: true } })).toBeTrue();
    });

    it('ne', () => {
      const columnId = crypto.randomUUID();
      const expression: Expression = {
        type: 'binary',
        left: { id: columnId },
        operator: 'ne',
        right: { type: 'boolean', value: true },
      };
      expect(compute(expression, {})).toBeTrue();
      expect(compute(expression, { [columnId]: { type: 'number', value: 1 } })).toBeTrue();
      expect(compute(expression, { [columnId]: { type: 'boolean', value: false } })).toBeTrue();
      expect(compute(expression, { [columnId]: { type: 'boolean', value: true } })).toBeFalse();
    });
  });

  describe('datetime', () => {
    it('eq', () => {
      const now = Temporal.Now.plainDateTimeISO();
      const columnId = crypto.randomUUID();
      const expression: Expression = {
        type: 'binary',
        left: { id: columnId },
        operator: 'eq',
        right: { type: 'datetime', value: now.toString() },
      };
      expect(compute(expression, {})).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'text', value: 'hello' } })).toBeFalse();
      expect(
        compute(expression, {
          [columnId]: { type: 'datetime', value: now.add({ days: 1 }).toString() },
        }),
      ).toBeFalse();
      expect(
        compute(expression, { [columnId]: { type: 'datetime', value: now.toString() } }),
      ).toBeTrue();
    });

    it('ne', () => {
      const now = Temporal.Now.plainDateTimeISO();
      const columnId = crypto.randomUUID();
      const expression: Expression = {
        type: 'binary',
        left: { id: columnId },
        operator: 'ne',
        right: { type: 'datetime', value: now.toString() },
      };
      expect(compute(expression, {})).toBeTrue();
      expect(compute(expression, { [columnId]: { type: 'text', value: 'hello' } })).toBeTrue();
      expect(
        compute(expression, {
          [columnId]: { type: 'datetime', value: now.add({ days: 1 }).toString() },
        }),
      ).toBeTrue();
      expect(
        compute(expression, { [columnId]: { type: 'datetime', value: now.toString() } }),
      ).toBeFalse();
    });

    it('gt', () => {
      const now = Temporal.Now.plainDateTimeISO();
      const columnId = crypto.randomUUID();
      const expression: Expression = {
        type: 'binary',
        left: { id: columnId },
        operator: 'gt',
        right: { type: 'datetime', value: now.toString() },
      };
      expect(compute(expression, {})).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'text', value: 'hello' } })).toBeFalse();
      expect(
        compute(expression, {
          [columnId]: { type: 'datetime', value: now.subtract({ days: 1 }).toString() },
        }),
      ).toBeFalse();
      expect(
        compute(expression, { [columnId]: { type: 'datetime', value: now.toString() } }),
      ).toBeFalse();
      expect(
        compute(expression, {
          [columnId]: { type: 'datetime', value: now.add({ days: 1 }).toString() },
        }),
      ).toBeTrue();
    });

    it('gte', () => {
      const now = Temporal.Now.plainDateTimeISO();
      const columnId = crypto.randomUUID();
      const expression: Expression = {
        type: 'binary',
        left: { id: columnId },
        operator: 'gte',
        right: { type: 'datetime', value: now.toString() },
      };
      expect(compute(expression, {})).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'text', value: 'hello' } })).toBeFalse();
      expect(
        compute(expression, {
          [columnId]: { type: 'datetime', value: now.subtract({ days: 1 }).toString() },
        }),
      ).toBeFalse();
      expect(
        compute(expression, { [columnId]: { type: 'datetime', value: now.toString() } }),
      ).toBeTrue();
      expect(
        compute(expression, {
          [columnId]: { type: 'datetime', value: now.add({ days: 1 }).toString() },
        }),
      ).toBeTrue();
    });

    it('lt', () => {
      const now = Temporal.Now.plainDateTimeISO();
      const columnId = crypto.randomUUID();
      const expression: Expression = {
        type: 'binary',
        left: { id: columnId },
        operator: 'lt',
        right: { type: 'datetime', value: now.toString() },
      };
      expect(compute(expression, {})).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'text', value: 'hello' } })).toBeFalse();
      expect(
        compute(expression, {
          [columnId]: { type: 'datetime', value: now.subtract({ days: 1 }).toString() },
        }),
      ).toBeTrue();
      expect(
        compute(expression, { [columnId]: { type: 'datetime', value: now.toString() } }),
      ).toBeFalse();
      expect(
        compute(expression, {
          [columnId]: { type: 'datetime', value: now.add({ days: 1 }).toString() },
        }),
      ).toBeFalse();
    });

    it('lte', () => {
      const now = Temporal.Now.plainDateTimeISO();
      const columnId = crypto.randomUUID();
      const expression: Expression = {
        type: 'binary',
        left: { id: columnId },
        operator: 'lte',
        right: { type: 'datetime', value: now.toString() },
      };
      expect(compute(expression, {})).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'text', value: 'hello' } })).toBeFalse();
      expect(
        compute(expression, {
          [columnId]: { type: 'datetime', value: now.subtract({ days: 1 }).toString() },
        }),
      ).toBeTrue();
      expect(
        compute(expression, { [columnId]: { type: 'datetime', value: now.toString() } }),
      ).toBeTrue();
      expect(
        compute(expression, {
          [columnId]: { type: 'datetime', value: now.add({ days: 1 }).toString() },
        }),
      ).toBeFalse();
    });
  });

  describe('and', () => {
    it('gt and lt', () => {
      const columnId = crypto.randomUUID();
      const expression: Expression = {
        type: 'and',
        expressions: [
          {
            type: 'binary',
            left: { id: columnId },
            operator: 'gt',
            right: { type: 'number', value: 2 },
          },
          {
            type: 'binary',
            left: { id: columnId },
            operator: 'lt',
            right: { type: 'number', value: 4 },
          },
        ],
      };
      expect(compute(expression, {})).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'text', value: 'hello' } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 1 } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 2 } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 3 } })).toBeTrue();
      expect(compute(expression, { [columnId]: { type: 'number', value: 4 } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 5 } })).toBeFalse();
    });

    it('gt and lt and ne', () => {
      const columnId = crypto.randomUUID();
      const expression: Expression = {
        type: 'and',
        expressions: [
          {
            type: 'binary',
            left: { id: columnId },
            operator: 'gt',
            right: { type: 'number', value: 2 },
          },
          {
            type: 'binary',
            left: { id: columnId },
            operator: 'lt',
            right: { type: 'number', value: 5 },
          },
          {
            type: 'binary',
            left: { id: columnId },
            operator: 'ne',
            right: { type: 'number', value: 3 },
          },
        ],
      };
      expect(compute(expression, {})).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'text', value: 'hello' } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 1 } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 2 } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 3 } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 4 } })).toBeTrue();
      expect(compute(expression, { [columnId]: { type: 'number', value: 5 } })).toBeFalse();
      expect(compute(expression, { [columnId]: { type: 'number', value: 6 } })).toBeFalse();
    });
  });
});
