import * as v from 'valibot';

const PrismaError = v.pipe(
  v.variant('code', [
    v.object({
      code: v.picklist(['P2015', 'P2025']),
      message: v.string(),
    }),
    v.object({
      code: v.literal('P1008'),
      message: v.string(),
    }),
  ]),
  v.transform((error) => {
    switch (error.code) {
      case 'P2025':
      case 'P2015':
        return { message: error.message, status: 404 as const };
      case 'P1008':
        return { message: error.message, status: 408 as const };
    }
  }),
);

export function parseServerError(error: unknown) {
  const result = v.safeParse(PrismaError, error);
  if (result.success) {
    return result.output;
  }
  return { message: 'Unknown error', status: 500 as const };
}
