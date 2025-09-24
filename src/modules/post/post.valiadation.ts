import {z} from "zod"
import { AllowCommentsEnum, AvailabilityEnum } from "../../DB/model/post.model"
import { Types } from "mongoose"


export const creatPost = {
    body: z.strictObject({
        content: z.string().min(2).max(50000).optional(),
        attachments: z.array(z.any()).max(2).optional(),
        availability: z.enum(AvailabilityEnum).default(AvailabilityEnum.PUBLIC),
        allowComments: z.enum(AllowCommentsEnum).default(AllowCommentsEnum.ALLOWED),
        tags: z.array(z.string().refine(data=>{ return Types.ObjectId.isValid(data)}, {error:"invalid id type"})).max(35).optional(),

    }).superRefine((data, ctx) => {
        if (!data.attachments?.length && !data.content) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "sorry pls put content or attachments"
            })
        }
        if ( data.tags?.length && data.tags.length !== [...new Set(data.tags)].length ) {
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message: "tags must be unique"
            })
        }
    })
}

export const updatePost = {
  params: z.strictObject({
    postId: z.string(),
  }),

  body: z
    .object({
      content: z.string().min(2).max(50000).optional(),
      availability: z.nativeEnum(AvailabilityEnum).optional(),
      allowComments: z.nativeEnum(AllowCommentsEnum).optional(),

      removedAttachments: z.array(z.string()).optional(),
      tags: z
        .array(
          z.string().refine((data) => Types.ObjectId.isValid(data), {
            message: "invalid id type",
          })
        )
        .max(10)
        .optional(),

      removedtags: z
        .array(
          z.string().refine((data) => Types.ObjectId.isValid(data), {
            message: "invalid id type",
          })
        )
        .max(10)
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (Object.values(data).every((v) => v === undefined)) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "You must update at least one field",
        });
      }

      if (data.tags && data.tags.length !== [...new Set(data.tags)].length) {
        ctx.addIssue({
          code: "custom",
          path: ["tags"],
          message: "Tags must be unique",
        });
      }

      if (
        data.removedtags &&
        data.removedtags.length !== [...new Set(data.removedtags)].length
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["removedtags"],
          message: "Tags must be unique",
        });
      }
    }),
};

export const likepost={
    params:z.strictObject({
        postId: z.string().refine(data => Types.ObjectId.isValid(data), {
            message: "Invalid postId format"
        })
    })
}

export const freezePost = {
  params: z.strictObject({
    postId: z.string().refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid postId",
    }),
  }),
};

export const restorePost = {
  params: z.strictObject({
    postId: z.string().refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid postId",
    }),
  }),
};

export const getPostById = {
  params: z.strictObject({
    postId: z.string().refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid postId",
    }),
  }),
};

export const getAllUserPosts = {
  params: z.strictObject({
   userId: z.string().refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid postId",
    }),
  }),
};

export const hardDeletePost = {
  params: z.strictObject({
    postId: z.string().refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid postId",
    }),
  }),
};
