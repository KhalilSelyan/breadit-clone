import { z } from "zod";

export const PostValidator = z.object({
  title: z
    .string()
    .min(3, {
      message: "Title must be at least 3 characters long",
    })
    .max(128, { message: "Title must be at most 128 characters long" }),
  content: z.any(),
  subredditId: z.string(),
});

export type PostCreationRequest = z.infer<typeof PostValidator>;