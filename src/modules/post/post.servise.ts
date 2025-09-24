import { Response } from "express";
import { v4 as uuid } from "uuid";
import { PostModel, AvailabilityEnum} from "../../DB/model/post.model";
import UserModel from "../../DB/model/user.model";
import { SuccessResponse } from "../../utils/response/success.response";
import { BadRequestException, ForbiddenException, NotFoundException } from "../../utils/response/error.response";
import { uploadFiles, deleteFiles } from "../../utils/multer/s3.config";
import { sendEmail } from "../../utils/email/email";
import { emailTemplates } from "../../utils/email/email.temp";
import mongoose, { Types } from "mongoose";
import { commentModel } from "../../DB/model/Comment.model";


interface CustomRequest extends Request {
  user?: { _id: string; fullName?: string; friends?: string[] };
  files?: Express.Multer.File[];
  body: any;
  params: any;
}




export const postAvailability = async (req: CustomRequest) => {
  const userId = req.user?._id;
  if (!userId) {
    return [{ availability: AvailabilityEnum.PUBLIC }];
  }
  const user = await UserModel.findById(userId).select("friends");
  const friends = (user?.friends || []).map(f => new mongoose.Types.ObjectId(f.toString()));
  return [
    { availability: AvailabilityEnum.PUBLIC },
    { availability: AvailabilityEnum.ONLYME, createdBy: new mongoose.Types.ObjectId(userId) },
    {
      availability: AvailabilityEnum.FRIENDS,
      createdBy: { $in: [...friends, new mongoose.Types.ObjectId(userId)] },
    },
    {
      availability: { $ne: AvailabilityEnum.ONLYME },
      tags: { $in: [new mongoose.Types.ObjectId(userId)] },
    },
  ];
};

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
    const assetsFolderId: string = uuid();

    if (req.files?.length) {
      attachments = await uploadFiles({
        files: req.files,
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
          sendEmail(
            user.email,
            "Someone tagged you in a post",
            emailTemplates.taggedInPost(user.fullName, req.user?.fullName || "A friend", post.content)
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
  const userId = req.user?._id;

  if (!userId) {
    throw new NotFoundException("User not authenticated");
  }

  const post = await PostModel.findById(postId);
  if (!post) {
    throw new NotFoundException("Post not found");
  }

  const allowedPost = await PostModel.findOne({
    _id: postId,
    $or: [
      ...(await postAvailability(req)),
      {
        availability: AvailabilityEnum.ONLYME,
        tags: { $in: [new mongoose.Types.ObjectId(userId)] },
      },
    ],
  });

  if (!allowedPost) {
    throw new ForbiddenException("You don’t have permission to like this post");
  }
  
  if (allowedPost.freezedBy) {
  throw new BadRequestException("This post is frozen and cannot be liked");
}

  const alreadyLiked = allowedPost.likes.some(
    (id: any) => id.toString() === userId.toString()
  );

  if (alreadyLiked) {
    allowedPost.likes = allowedPost.likes.filter(
      (id: any) => id.toString() !== userId.toString()
    );
    await allowedPost.save();
    return SuccessResponse.ok(res, "Post unliked");
  } else {
    allowedPost.likes.push(new mongoose.Types.ObjectId(userId));
    await allowedPost.save();
    return SuccessResponse.ok(res, "Post liked");
  }
};

updatepost = async (req: CustomRequest, res: Response): Promise<any> => {
  const { postId } = req.params as unknown as { postId: Types.ObjectId };

  const existingPost = await PostModel.findOne({
    _id: postId,
    createdBy: req.user?._id,
  });

  if (!existingPost) {
    throw new NotFoundException("post not found");
  }

  if (
    req.body.tags?.length &&
    (await UserModel.find({ _id: { $in: req.body.tags } })).length !==
      req.body.tags.length
  ) {
    throw new NotFoundException("tags not found");
  }

  let attachments: string[] = [];
  if (req.files?.length) {
    attachments = await uploadFiles({
      files: req.files,
      path: `users/${existingPost.createdBy}/post/${existingPost.assetsFolderId}`,
    });
  }

 
  const updateData: any = {};
  if (req.body.content) updateData.content = req.body.content;
  if (req.body.allowComments) updateData.allowComments = req.body.allowComments;
  if (req.body.availability) updateData.availability = req.body.availability;

  if (attachments.length) {
    updateData.$addToSet = {
      ...(updateData.$addToSet || {}),
      attachments: { $each: attachments },
    };
  }

  if (req.body.tags?.length) {
    updateData.$addToSet = {
      ...(updateData.$addToSet || {}),
      tags: { $each: req.body.tags },
    };
  }

  if (req.body.removedAttachments?.length) {
    updateData.$pull = {
      ...(updateData.$pull || {}),
      attachments: { $in: req.body.removedAttachments },
    };
  }

  if (req.body.removedtags?.length) {
    updateData.$pull = {
      ...(updateData.$pull || {}),
      tags: { $in: req.body.removedtags },
    };
  }

  
  if (
    !Object.keys(updateData).length ||
    (Object.keys(updateData).length === 1 &&
      (updateData.$addToSet === undefined && updateData.$pull === undefined))
  ) {
    throw new BadRequestException("You must update at least one field 😁");
  }

  const updatedPost = await PostModel.updateOne({ _id: postId }, updateData);

  if (!updatedPost.matchedCount) {
    if (attachments.length) {
      await deleteFiles({ urls: attachments });
    }
    throw new NotFoundException("fail to update post");
  } else {
    if (req.body.removedAttachments?.length) {
      await deleteFiles({ urls: req.body.removedAttachments });
    }
  }

  return SuccessResponse.ok(res, "Post updated successfully");
};

freezePost = async (req: CustomRequest, res: Response): Promise<any> => {
  const { postId } = req.params;

  const existingPost = await PostModel.findById(postId);
  if (!existingPost) throw new NotFoundException("Post not found");

  // لو البوست متجمد قبل كده من يوزر تاني
  if (existingPost.freezedBy && existingPost.freezedBy.toString() !== req.user?._id.toString()) {
    throw new BadRequestException("You cannot freeze this post");
  }

  await PostModel.updateOne(
    { _id: postId },
    { 
      freezedAt: new Date(),
      freezedBy: req.user?._id,
      restoredAt: null,
      restoredBy: null
    }
  );

  return SuccessResponse.ok(res, "Post frozen successfully");
};

restorePost = async (req: CustomRequest, res: Response): Promise<any> => {
  const { postId } = req.params;

  const existingPost = await PostModel.findById(postId);
  if (!existingPost) throw new NotFoundException("Post not found");

  // لازم اللي عمل freeze هو اللي يعمل restore
  if (existingPost.freezedBy?.toString() !== req.user?._id.toString()) {
    throw new BadRequestException("Only the same user who froze the post can restore it");
  }

  await PostModel.updateOne(
    { _id: postId },
    { 
      restoredAt: new Date(),
      restoredBy: req.user?._id,
      freezedAt: null,
      freezedBy: null
    }
  );

  return SuccessResponse.ok(res, "Post restored successfully");
};

getPostById = async (req: CustomRequest, res: Response): Promise<any> => {
  const { postId } = req.params;

  const post = await PostModel.findById(postId)
    .select("_id content attachments availability allowComments likes tags createdBy");

  if (!post) throw new NotFoundException("Post not found");

  if (post.freezedAt && !post.restoredAt) {
    throw new ForbiddenException("post is frozen");
  }

  // هات الكومنتات اللي تابعة للبوست ده
  const comments = await commentModel.find({ postId })
    .populate("createdBy", "fullName profileimage")
    .sort({ createdAt: -1 });

  return SuccessResponse.ok(res, "Post fetched successfully", {
    ...post.toObject(),
    comments,
  });
};

getAllPosts = async (req: CustomRequest, res: Response): Promise<any> => {
  const posts = await PostModel.find({
    $or: [
      { freezedAt: { $exists: false } }, 
      { $and: [{ freezedAt: { $exists: true } }, { restoredAt: { $exists: true } }] }
    ]
  })
    .select("_id content attachments assetsFolderId availability allowComments likes tags createdBy");

  return SuccessResponse.ok(res, "Posts fetched successfully", posts);
};

getAllUserPosts = async (req: CustomRequest, res: Response): Promise<any> => {
  const { userId } = req.params;

  const query: any = { freezedAt: { $exists: false } };

  if (userId) {
    query.createdBy = userId;
  }

  const posts = await PostModel.find(query)
    .select("_id content attachments assetsFolderId availability allowComments likes tags createdBy")
    .populate("createdBy", "_id")
    .populate("tags", "_id");

  if (!posts.length) {
    throw new NotFoundException("No posts found for this user");
  }

  return SuccessResponse.ok(res, "Posts fetched successfully", posts);
};

hardDeletePost = async (req: CustomRequest, res: Response): Promise<any> => {
  const { postId } = req.params;

  const post = await PostModel.findById(postId);
  if (!post) throw new NotFoundException("Post not found");

  // مين اللي مسموحله يمسح؟ (الـ creator أو admin)
  if (post.createdBy.toString() !== req.user?._id.toString() && !req.user?.isAdmin) {
    throw new ForbiddenException("You cannot delete this post");
  }

  // امسح الملفات من S3
  if (post.attachments && post.attachments.length > 0) {
    await deleteFiles({ urls: post.attachments });
  }

  // امسح البوست نفسه
  await PostModel.findByIdAndDelete(postId);

  return SuccessResponse.ok(res, "Post deleted permanently");
};


   
    
    




  
}






export default new PostServise();
