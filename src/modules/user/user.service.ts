import type { Response } from "express";
import { IRequest } from "../auth/auth.dto";
import UserModel from "../../DB/model/user.model";
import { UnauthorizedException } from "../../utils/response/error.response";

class UserService {
  constructor() {}

  getProfile = async (req: IRequest, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new UnauthorizedException("User not authenticated");
    }

    return res.status(200).json({
      message: "Profile retrieved successfully",
      data: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        isVerified: req.user.isVerified,
        avatar: req.user.avatar,
      },
    });
  };
}

export default new UserService();
