import { Temporal } from 'temporal-polyfill';
import * as v from 'valibot';

import { ID, TypedValue, type Data } from './types';

const Operator = v.picklist(['eq', 'ne', 'lt', 'gt', 'lte', 'gte']);

const BinaryExpression = v.object({
  type: v.literal('binary'),
  left: v.object({ id: ID }),
  operator: Operator,
  right: TypedValue,
});

const AndExpression = v.object({
  type: v.literal('and'),
  expressions: v.array(BinaryExpression),
});

const OrExpression = v.object({
  type: v.literal('or'),
  expressions: v.array(BinaryExpression),
});

export const Expression = v.variant('type', [BinaryExpression, AndExpression, OrExpression]);
export type Expression = v.InferOutput<typeof Expression>;

export function compute(expression: Expression, data: Data): boolean {
  switch (expression.type) {
    case 'binary': {
      const left = data[expression.left.id];
      const right = expression.right;
      if (left?.type != right.type) {
        return expression.operator == 'ne' ? true : false;
      } else if (left.type == 'datetime' && right.type == 'datetime') {
        const result = compareDateTime(
          Temporal.PlainDateTime.from(left.value),
          Temporal.PlainDateTime.from(right.value),
        );
        switch (expression.operator) {
          case 'eq':
            return result == 'eq';
          case 'ne':
            return result != 'eq';
          case 'lt':
            return result == 'lt';
          case 'gt':
            return result == 'gt';
          case 'lte':
            return result == 'lt' || result == 'eq';
          case 'gte':
            return result == 'gt' || result == 'eq';
        }
      } else if (left.type == 'number' && right.type == 'number') {
        switch (expression.operator) {
          case 'eq':
            return left.value === right.value;
          case 'ne':
            return left.value !== right.value;
          case 'lt':
            return left.value < right.value;
          case 'gt':
            return left.value > right.value;
          case 'lte':
            return left.value <= right.value;
          case 'gte':
            return left.value >= right.value;
        }
      }
      switch (expression.operator) {
        case 'eq':
          return left.value === right.value;
        case 'ne':
          return left.value !== right.value;
        default:
          throw new Error(`Unsupported operator ${expression.operator} for type ${left.type}`);
      }
    }
    case 'and':
      return expression.expressions.every((expression) => compute(expression, data));
    case 'or':
      return expression.expressions.some((expression) => compute(expression, data));
  }
}

function compareDateTime(
  left: Temporal.PlainDateTime | Temporal.PlainDate,
  right: Temporal.PlainDateTime | Temporal.PlainDate,
): 'lt' | 'gt' | 'eq' {
  switch (Temporal.PlainDateTime.compare(left, right)) {
    case -1:
      return 'lt';
    case 1:
      return 'gt';
    default:
      return 'eq';
  }
}
