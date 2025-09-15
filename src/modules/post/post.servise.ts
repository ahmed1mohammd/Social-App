import type { Request, Response } from "express";
import { SuccessResponse } from "../../utils/response/success.response";
import UserModel from "../../DB/model/user.model";
import { NotFoundException } from "../../utils/response/error.response";
import { v4 as uuid } from "uuid";
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config";
import { PostModel } from "../../DB/model/post.model";
import { sendEmail } from "../../utils/email/email";
import {emailTemplates} from "../../utils/email/email.temp";

interface CustomRequest extends Request {
  user?: { _id: string; fullName?: string };
}

class PostServise {
  constructor() {}

  createPost = async (req: CustomRequest, res: Response): Promise<Response> => {
    if (
      req.body.tags?.length &&
      (await UserModel.find({ _id: { $in: req.body.tags } })).length !==
        req.body.tags.length
    ) {
      throw new NotFoundException("tags not found");
    }

    let attachments: string[] = [];
    let assetsFolderId: string = uuid();

    if (req.files?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req.user?._id}/post/${assetsFolderId}`,
      });
    }

    const postData = {
      ...req.body,
      attachments,
      assetsFolderId,
      createdBy: req.user?._id,
    };

    const post = await PostModel.create(postData);

    if (!post) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments });
      }
      throw new NotFoundException("fail to create post");
    }
    if (req.body.tags?.length) {
      const sendNotification = await UserModel.find({ _id: { $in: req.body.tags } });

      for (const user of sendNotification) {
        try {
          await sendEmail(
            user.email,
            "Someone tagged you in a post",
            emailTemplates.taggedInPost(
              user.fullName,
              req.user?.fullName || "A friend",
              post.content
            )
          );
        } catch (error) {
          console.error(`Failed to send email to ${user.email}:`, error);
        }
      }
    }

    return SuccessResponse.created(res, "Post created successfully");
  };

  likepost = async (req: CustomRequest, res: Response): Promise<Response> => {
    const { postId } = req.params as { postId: string };

    const post = await PostModel.findById(postId);
    if (!post) {
      throw new NotFoundException("Post not found");
    }

    if (post.likes.includes(req.user?._id)) {
      post.likes = post.likes.filter((id: string) => id.toString() !== req.user?._id);
      await post.save();
      return SuccessResponse.created(res, "Post unliked successfully");
    } else {
      post.likes.push(req.user?._id);
      await post.save();
      return SuccessResponse.created(res, "Post liked successfully");
    }
  };
}

export default new PostServise();