 import type { Request,Response } from "express"
import { SuccessResponse } from "../../utils/response/success.response"
import { NotFoundException } from "../../utils/response/error.response";
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config";
import  { v4 as uuid}  from "uuid";
import {commentModel} from "../../DB/model/Comment.model";
import {AllowCommentsEnum, PostModel} from "../../DB/model/post.model";
import UserModel from "../../DB/model/user.model";
import { Types } from "mongoose";

export interface AuthUser {
  _id: Types.ObjectId;
  email: string;
  fullName: string;
  role: string;
}

export interface CustomRequest extends Request {
  user?: AuthUser;
}

class commentService{
constructor(){}

createComment = async (req:CustomRequest, res: Response): Promise<Response> => {
  const { postId } = req.params as { postId: string };

  const post = await PostModel.findById(postId);
  if (!post) {
    throw new NotFoundException("Post not found");
  }
  if (post.allowComments === AllowCommentsEnum.DISABLED) {
  throw new Error("Comments are disabled for this post");
}

  if (
    req.body.tags?.length &&
    (await UserModel.find({ _id: { $in: req.body.tags } })).length !==
      req.body.tags.length
  ) {
    throw new NotFoundException("tags not found");
  }

  let attachments: string[] = [];
  const assetsFolderId: string = uuid();

  if (req.files?.length) {
    attachments = await uploadFiles({
      files: req.files as Express.Multer.File[],
      path: `users/${req.user?._id}/comment/${assetsFolderId}`,
    });
  }

  const commentData = {
    ...req.body,
    attachments,
    assetsFolderId,
    createdBy: req.user?._id,
    postId,
  };

  const comment = await commentModel.create(commentData);

  if (!comment) {
    if (attachments.length) {
      await deleteFiles({ urls: attachments });
    }
    throw new NotFoundException("fail to create comment");
  }


  return SuccessResponse.created(res, "Comment created successfully");
};
 replyComment = async (req: CustomRequest, res: Response): Promise<Response> => {
  const { postId, commentId } = req.params as { postId: string; commentId: string };

  const post = await PostModel.findById(postId);
  if (!post) throw new NotFoundException("Post not found");

  const parentComment = await commentModel.findById(commentId);
  if (!parentComment) throw new NotFoundException("Parent comment not found");

  if (post.allowComments === AllowCommentsEnum.DISABLED)
    throw new Error("Comments are disabled for this post");

  if (
    req.body.tags?.length &&
    (await UserModel.find({ _id: { $in: req.body.tags } })).length !== req.body.tags.length
  ) {
    throw new NotFoundException("tags not found");
  }

  let attachments: string[] = [];
  const assetsFolderId: string = uuid();

  if (req.files?.length) {
    attachments = await uploadFiles({
      files: req.files as Express.Multer.File[],
      path: `users/${req.user?._id}/comment/${assetsFolderId}`,
    });
  }

  const replyData = {
    ...req.body,
    attachments,
    assetsFolderId,
    createdBy: req.user?._id,
    postId,
    commentId,
  };

  const reply = await commentModel.create(replyData);

  if (!reply) {
    if (attachments.length) await deleteFiles({ urls: attachments });
    throw new NotFoundException("fail to create reply");
  }

  return SuccessResponse.created(res, "Reply created successfully", reply);
};
 freezeComment = async (req: CustomRequest, res: Response): Promise<Response> => {
  const { postId, commentId } = req.params as { postId: string; commentId: string };

  const post = await PostModel.findById(postId);
  if (!post) throw new NotFoundException("Post not found");

  const comment = await commentModel.findByIdAndUpdate(
    commentId,
    { freezedAt: new Date(), freezedBy: req.user?._id },
    { new: true }
  );
  if (!comment) throw new NotFoundException("Comment not found");

  return SuccessResponse.ok(res, "Comment freezed successfully", comment);
};
 restoreComment = async (req: CustomRequest, res: Response): Promise<Response> => {
  const { postId, commentId } = req.params as { postId: string; commentId: string };

  const post = await PostModel.findById(postId);
  if (!post) throw new NotFoundException("Post not found");

  const comment = await commentModel.findByIdAndUpdate(
    commentId,
    { restoredAt: new Date(), restoredBy: req.user?._id, freezedAt: null, freezedBy: null },
    { new: true }
  );
  if (!comment) throw new NotFoundException("Comment not found");

  return SuccessResponse.ok(res, "Comment restored successfully", comment);
};
hardDeleteComment = async (req: CustomRequest, res: Response): Promise<Response> => {
  const { postId, commentId } = req.params as { postId: string; commentId: string };

  const post = await PostModel.findById(postId);
  if (!post) throw new NotFoundException("Post not found");

  const comment = await commentModel.findById(commentId);
  if (!comment) throw new NotFoundException("Comment not found");

  if (comment.attachments?.length) {
    await deleteFiles({ urls: comment.attachments });
  }

  await commentModel.findByIdAndDelete(commentId);

  return SuccessResponse.ok(res, "Comment deleted successfully");
};
getCommentById = async (req: CustomRequest, res: Response): Promise<Response> => {
  const { commentId } = req.params as { commentId: string };

  const comment = await commentModel.findById(commentId).populate("createdBy", "fullName email profileimage");
  if (!comment) throw new NotFoundException("Comment not found");

  return SuccessResponse.ok(res, "Comment fetched successfully", comment);
};
 getCommentsWithReplies = async (req: CustomRequest, res: Response): Promise<Response> => {
  const { postId } = req.params as { postId: string };

  const post = await PostModel.findById(postId);
  if (!post) throw new NotFoundException("Post not found");

  const comments = await commentModel
    .find({ postId, commentId: null })
    .populate("createdBy tags likes")
    .lean();

  for (const c of comments) {
    c.replies = await commentModel.find({ commentId: c._id }).populate("createdBy tags likes");
  }

  return SuccessResponse.ok(res, "Comments fetched successfully", comments);
};
 




}
 export default new commentService()