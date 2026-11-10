import { z } from 'zod';

const diagnosticFieldsSchema = z.record(
  z.string(),
  z.union([z.string().max(3000), z.number().finite(), z.boolean(), z.null()]),
);
export type DiagnosticFields = z.infer<typeof diagnosticFieldsSchema>;
export const clientLogSchema = z.object({
  level: z.number().int(),
  time: z.number(),
  session: z.string().max(50),
  event: z.string().max(100),
  fields: diagnosticFieldsSchema,
});
