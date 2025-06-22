import { Temporal } from 'temporal-polyfill';
import * as v from 'valibot';

import { ID, TypedValue, type Data } from './shared.contract';

const BinaryOperator = v.picklist([
  'eq',
  'ne',
  'lt',
  'gt',
  'lte',
  'gte',
  'in',
  'nin',
  'has',
]);
const UnaryOperator = v.picklist(['present', 'blank']);

const UnaryExpression = v.object({
  type: v.literal('unary'),
  left: v.object({ id: ID }),
  operator: UnaryOperator,
});

const BinaryExpression = v.object({
  type: v.literal('binary'),
  left: v.object({ id: ID }),
  operator: BinaryOperator,
  right: TypedValue,
});

const _Expression = v.variant('type', [UnaryExpression, BinaryExpression]);

const _AndExpression = v.object({
  type: v.literal('and'),
  expressions: v.array(_Expression),
});

const _OrExpression = v.object({
  type: v.literal('or'),
  expressions: v.array(_Expression),
});

const AndExpression = v.object({
  type: v.literal('and'),
  expressions: v.array(v.variant('type', [_Expression, _OrExpression])),
});

const OrExpression = v.object({
  type: v.literal('or'),
  expressions: v.array(v.variant('type', [_Expression, _AndExpression])),
});

export const Expression = v.variant('type', [
  UnaryExpression,
  BinaryExpression,
  AndExpression,
  OrExpression,
]);
export type Expression = v.InferOutput<typeof Expression>;

export function compute(expression: Expression, data: Data): boolean {
  switch (expression.type) {
    case 'unary': {
      const left = data[expression.left.id];
      if (expression.operator == 'present') {
        return left != null;
      }
      return left == null;
    }
    case 'binary': {
      const left = data[expression.left.id];
      const right = expression.right;
      if (left?.type != right.type) {
        return expression.operator == 'ne' ? true : false;
      } else if (
        (left.type == 'datetime' || left.type == 'date') &&
        (right.type == 'datetime' || right.type == 'date')
      ) {
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
          default:
            throw new Error(
              `Invalid operator: ${expression.operator} for ${left.type}`,
            );
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
          default:
            throw new Error(
              `Unsupported operator ${expression.operator} for type ${left.type}`,
            );
        }
      } else if (left.type == 'choiceList' && right.type == 'choice') {
        if (expression.operator == 'has') {
          return left.value.includes(right.value);
        }
        throw new Error(
          `Unsupported operator ${expression.operator} for type ${left.type}`,
        );
      } else if (left.type == 'choice') {
        if (right.type == 'choice') {
          switch (expression.operator) {
            case 'eq':
              return left.value == right.value;
            case 'ne':
              return left.value != right.value;
          }
        } else if (right.type == 'choiceList') {
          switch (expression.operator) {
            case 'in':
              return right.value.includes(left.value);
            case 'nin':
              return !right.value.includes(left.value);
          }
        }
        throw new Error(
          `Unsupported operator ${expression.operator} for type ${left.type}`,
        );
      }
      switch (expression.operator) {
        case 'eq':
          return left.value === right.value;
        case 'ne':
          return left.value !== right.value;
        default:
          throw new Error(
            `Unsupported operator ${expression.operator} for type ${left.type}`,
          );
      }
    }
    case 'and':
      return expression.expressions.every((expression) =>
        compute(expression, data),
      );
    case 'or':
      return expression.expressions.some((expression) =>
        compute(expression, data),
      );
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
