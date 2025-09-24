import { z } from "zod";
import { Types } from "mongoose";

const objectId = z.string().refine((id) => Types.ObjectId.isValid(id), {
  message: "Invalid ObjectId",
});

export const sendRequestValidation = {
  body: z.object({
    receiverId: objectId,
  }),
};

export const acceptRequestValidation = {
  body: z.object({
    requestId: objectId,
  }),
};

export const rejectRequestValidation = {
  body: z.object({
    requestId: objectId,
  }),
};

export const blockUserValidation = {
  body: z.object({
    receiverId: objectId,
  }),
};
