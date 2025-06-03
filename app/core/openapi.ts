import { describeRoute as describeHonoRoute } from 'hono-openapi';
import { resolver } from 'hono-openapi/valibot';
import * as v from 'valibot';

import { env } from '~/lib/env';

export function describeRoute<T>({
  description,
  output,
}: {
  description: string;
  output: v.GenericSchema<T>;
}) {
  return describeHonoRoute({
    description,
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: resolver(output),
          },
        },
      },
    },
    validateResponse: env.NODE_ENV == 'test',
  });
}
