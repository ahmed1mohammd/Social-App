import { Types } from 'mongoose'
import {z} from 'zod'


export const createComment = {
  params: z.strictObject({
    postId: z.string().refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid postId",
    }),
  }),
  body: z
    .strictObject({
      content: z.string().min(2).max(20000).optional(),
      attachments: z.array(z.any()).max(2).optional(),
      tags: z
        .array(
          z.string().refine((data) => Types.ObjectId.isValid(data), {
            message: "Invalid id type",
          })
        )
        .max(35)
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.attachments?.length && !data.content) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "sorry pls put content or attachments",
        });
      }
      if (
        data.tags?.length &&
        data.tags.length !== [...new Set(data.tags)].length
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["tags"],
          message: "tags must be unique",
        });
      }
    }),
};

export const replyComment ={
    params:createComment.params.extend({
        commentId:z.string()
    }),
    body:createComment.body
}

export const freezeComment = {
  params: z.strictObject({
    postId: z.string().refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid postId",
    }),
    commentId: z.string().refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid commentId",
    }),
  }),
};

export const restoreComment = freezeComment;

export const hardDeleteComment = freezeComment;

export const getCommentById = {
  params: z.strictObject({
    postId: z.string().refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid postId",
    }),
    commentId: z.string().refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid commentId",
    }),
  }),
};


export const getCommentsWithReplies = {
  params: z.strictObject({
    postId: z.string().refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid postId",
    }),
  }),
};
