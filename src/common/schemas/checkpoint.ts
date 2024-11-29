import { z } from "zod";

export const CheckpointSchema = z.object({
  executedJsSteps: z.array(z.string()),
});
export type Checkpoint = z.infer<typeof CheckpointSchema>;
