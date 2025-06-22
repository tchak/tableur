import * as R from 'remeda';
import { Column } from './column.contract';
import type { Field as FormField } from './form.contract';
import type {
  ChoiceListTypedValue,
  ChoiceTypedValue,
  Data,
  FileTypedValue,
  TextTypedValue,
  TypedValue,
} from './shared.contract';
import type { Field as SubmissionField } from './submission.contract';

export function castSubmissionField(
  field: FormField,
  typedValue: TypedValue,
): SubmissionField | null {
  switch (field.type) {
    case 'text':
      return {
        ...R.omit(field, ['condition']),
        value: castTextValue(typedValue),
      };
    case 'number':
      return {
        ...R.omit(field, ['condition']),
        value: castNumberValue(typedValue),
      };
    case 'boolean':
      return {
        ...R.omit(field, ['condition']),
        value: castBooleanValue(typedValue),
      };
    case 'date':
      return {
        ...R.omit(field, ['condition']),
        value: castDateValue(typedValue),
      };
    case 'datetime':
      return {
        ...R.omit(field, ['condition']),
        value: castDateTimeValue(typedValue),
      };
    case 'file':
      return {
        ...R.omit(field, ['condition']),
        value: castFileValue(typedValue),
      };
    case 'choice':
      return {
        ...R.omit(field, ['condition']),
        value: castChoiceValue(typedValue),
      };
    case 'choiceList':
      return {
        ...R.omit(field, ['condition']),
        value: castChoiceListValue(typedValue),
      };
  }
}

export function castRowData(data: Data, columns: Column[]): Data {
  const typedData: Data = {};
  for (const column of columns) {
    const typedValue = data[column.id];
    if (column.type == typedValue?.type) {
      typedData[column.id] = typedValue;
    } else if (typedValue) {
      switch (column.type) {
        case 'text': {
          const value = castTextValue(typedValue);
          if (value) {
            typedData[column.id] = { type: column.type, value };
          }
          break;
        }
        case 'number': {
          const value = castNumberValue(typedValue);
          if (value) {
            typedData[column.id] = { type: column.type, value };
          }
          break;
        }
        case 'boolean': {
          const value = castBooleanValue(typedValue);
          if (value) {
            typedData[column.id] = { type: column.type, value };
          }
          break;
        }
        case 'date': {
          const value = castDateValue(typedValue);
          if (value) {
            typedData[column.id] = { type: column.type, value };
          }
          break;
        }
        case 'datetime': {
          const value = castDateTimeValue(typedValue);
          if (value) {
            typedData[column.id] = { type: column.type, value };
          }
          break;
        }
        case 'file': {
          const value = castFileValue(typedValue);
          if (value) {
            typedData[column.id] = { type: column.type, value };
          }
          break;
        }
        case 'choice': {
          const value = castChoiceValue(typedValue);
          if (value) {
            typedData[column.id] = { type: column.type, value };
          }
          break;
        }
        case 'choiceList': {
          const value = castChoiceListValue(typedValue);
          if (value) {
            typedData[column.id] = { type: column.type, value };
          }
          break;
        }
      }
    }
  }
  return typedData;
}

export function extractTypedValue(field: SubmissionField): TypedValue | null {
  if (field.value == null) {
    return null;
  }
  return R.pick(field, ['type', 'value']) as TypedValue;
}

// export function castTypedValue(
//   value: TypedValue,
//   type: TypedValue['type'],
// ): NullableTypedValue {
//   switch (type) {
//     case 'text':
//       return { type, value: castTextValue(value) };
//     case 'number':
//       return { type, value: castNumberValue(value) };
//     case 'boolean':
//       return { type, value: castBooleanValue(value) };
//     case 'date':
//       return { type, value: castDateValue(value) };
//     case 'datetime':
//       return { type, value: castDateTimeValue(value) };
//     case 'file':
//       return { type, value: castFileValue(value) };
//     case 'choice':
//       return { type, value: castChoiceValue(value) };
//     case 'choiceList':
//       return { type, value: castChoiceListValue(value) };
//   }
// }

function castTextValue(value: TypedValue): TextTypedValue['value'] | null {
  switch (value.type) {
    case 'text':
      return value.value;
    case 'boolean':
      return value.value ? 'Yes' : 'No';
    case 'number':
      return value.value.toString();
    default:
      return null;
  }
}

function castNumberValue(value: TypedValue): number | null {
  switch (value.type) {
    case 'number':
      return value.value;
    default:
      return null;
  }
}

function castBooleanValue(value: TypedValue): boolean | null {
  switch (value.type) {
    case 'boolean':
      return value.value;
    default:
      return null;
  }
}

function castDateValue(value: TypedValue): string | null {
  switch (value.type) {
    case 'date':
      return value.value;
    default:
      return null;
  }
}

function castDateTimeValue(value: TypedValue): string | null {
  switch (value.type) {
    case 'datetime':
      return value.value;
    default:
      return null;
  }
}

function castChoiceValue(value: TypedValue): ChoiceTypedValue['value'] | null {
  switch (value.type) {
    case 'choice':
      return value.value;
    default:
      return null;
  }
}

function castChoiceListValue(
  value: TypedValue,
): ChoiceListTypedValue['value'] | null {
  switch (value.type) {
    case 'choiceList':
      return value.value;
    default:
      return null;
  }
}

function castFileValue(value: TypedValue): FileTypedValue['value'] | null {
  switch (value.type) {
    case 'file':
      return value.value;
    default:
      return null;
  }
}
