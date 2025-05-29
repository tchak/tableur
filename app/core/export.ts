import * as R from 'remeda';

import type { Column } from './column.contract';
import type { Data } from './shared.contract';

export function columnValue(data: Data, column: Column) {
  const typedValue = data[column.id];
  if (column.type != typedValue?.type)
    return {
      str() {
        return null;
      },
    };
  const options =
    column.type == 'choice' || column.type == 'choiceList'
      ? Object.fromEntries(
          column.options.map((option) => [option.id, option.name]),
        )
      : {};
  return {
    str() {
      switch (typedValue.type) {
        case 'text':
        case 'date':
        case 'datetime':
          return typedValue.value;
        case 'number':
        case 'boolean':
          return typedValue.value.toString();
        case 'choice':
          return options[typedValue.value] ?? null;
        case 'choiceList':
          return typedValue.value
            .map((id) => options[id])
            .filter(R.isDefined)
            .join(', ');
        case 'file':
          return typedValue.value.map((file) => file.filename).join(', ');
      }
    },
  };
}
