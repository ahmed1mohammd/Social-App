import { CustomRequest } from "../comment/comment.service";
import { Response } from "express";
import { FriendRequestModel, FriendRequestStatus } from "../../DB/model/friend.model";
import  UserModel  from "../../DB/model/user.model";
import { NotFoundException, BadRequestException } from "../../utils/response/error.response.js";
import { SuccessResponse } from "../../utils/response/success.response.js";

export class FriendService {
  sendRequest = async (req: CustomRequest, res: Response): Promise<Response> => {
    const senderId = req.user?._id;
    const { receiverId } = req.body;

    if (senderId?.toString() === receiverId) {
      throw new BadRequestException("Cannot friend yourself");
    }

    const existing = await FriendRequestModel.findOne({ sender: senderId, receiver: receiverId });
    if (existing) {
      throw new BadRequestException("Friend request already sent");
    }

    const request = await FriendRequestModel.create({ sender: senderId, receiver: receiverId });
    return SuccessResponse.created(res, "Friend request sent", request);
  };

  acceptRequest = async (req: CustomRequest, res: Response): Promise<Response> => {
    const { requestId } = req.body;

    const request = await FriendRequestModel.findById(requestId);
    if (!request) throw new NotFoundException("Request not found");

    request.status = FriendRequestStatus.ACCEPTED;
    await request.save();

    await UserModel.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.receiver } });
    await UserModel.findByIdAndUpdate(request.receiver, { $addToSet: { friends: request.sender } });

    return SuccessResponse.ok(res, "Friend request accepted", request);
  };

  rejectRequest = async (req: CustomRequest, res: Response): Promise<Response> => {
    const { requestId } = req.body;

    const request = await FriendRequestModel.findById(requestId);
    if (!request) throw new NotFoundException("Request not found");

    request.status = FriendRequestStatus.REJECTED;
    await request.save();

    return SuccessResponse.ok(res, "Friend request rejected", request);
  };

  blockUser = async (req: CustomRequest, res: Response): Promise<Response> => {
    const senderId = req.user?._id;
    const { receiverId } = req.body;

    const blocked = await FriendRequestModel.findOneAndUpdate(
      { sender: senderId, receiver: receiverId },
      { status: FriendRequestStatus.BLOCKED },
      { new: true, upsert: true }
    );

    return SuccessResponse.ok(res, "User blocked", blocked);
  };

  getFriends = async (req: CustomRequest, res: Response): Promise<Response> => {
    const userId = req.user?._id;

    const user = await UserModel.findById(userId).populate("friends", "fullName profileimage");
    if (!user) throw new NotFoundException("User not found");

    return SuccessResponse.ok(res, "Friends list fetched", user.friends);
  };
}


export const friendService = new FriendService();
