import {z} from "zod"
import { AllowCommentsEnum, AvailabilityEnum } from "../../DB/model/post.model"
import { Types } from "mongoose"


export const creatPost = {
    body: z.strictObject({
        content: z.string().min(2).max(50000).optional(),
        attachments: z.array(z.any()).max(2).optional(),
        availability: z.enum(AvailabilityEnum).default(AvailabilityEnum.PUBLIC),
        allowComments: z.enum(AllowCommentsEnum).default(AllowCommentsEnum.ALLOWED),
        tags: z.array(z.string().refine(data=>{ return Types.ObjectId.isValid(data)}, {error:"invalid id type"})).max(10).optional(),

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
export const likepost={
    params:z.strictObject({
        postId: z.string().refine(data => Types.ObjectId.isValid(data), {
            message: "Invalid postId format"
        })
    })
}