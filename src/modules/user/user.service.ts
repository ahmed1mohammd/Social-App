import type { Response } from "express";
import { IRequest } from "../auth/auth.dto";
import UserModel from "../../DB/model/user.model";
import { BadRequestException, UnauthorizedException, ForbiddenException } from "../../utils/response/error.response";
import { SuccessResponse } from "../../utils/response/success.response";
import { creatPresignedUploadLink, uploadFiles } from "../../utils/multer/s3.config";
import { s3Event } from "../../utils/multer/s3.event";

class UserService {
  constructor() {}

  private checkAdminRole = (user: any): void => {
    if (!user || user.role !== "Admin") {
      throw new ForbiddenException("Only admin users can perform this action");
    }
  }

    getProfile = async (req: IRequest, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new UnauthorizedException("User not authenticated");
    }

    return SuccessResponse.ok(res, "Profile retrieved successfully", {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
      phone: req.user.getDecryptedPhone(),
        role: req.user.role,
        isVerified: req.user.isVerified,
        profileimage: req.user.profileimage,
      profileCoverimage: req.user.profileCoverimage,
    });
  };

    imageProfile = async (req: IRequest, res: Response): Promise<Response> => {
    const { ContentType, originalname }: { ContentType: string, originalname: string } = req.body;
    const { url, key } = await creatPresignedUploadLink({
        ContentType,
        originalname,
        path: `profile/${req.user?._id}`
    });

    const oldProfileImage = req.user?.profileimage;
    const oldTempImage = req.user?.Tempprofileimage;

      const user = await UserModel.findOneAndUpdate(
        { _id: req.user?._id },
      { profileimage: key, Tempprofileimage: oldProfileImage },
      { new: true }
    );
      if (!user) {
        throw new BadRequestException("Fail to update profile image");
      }

    if (oldProfileImage) {
      try {
        const { deleteFile } = await import("../../utils/multer/s3.config");
        await deleteFile({ Key: oldProfileImage });
        console.log(`Old profile image deleted: ${oldProfileImage}`);
      } catch (error: any) {
        console.error(`Error deleting old profile image:`, error);
      }
    }

    if (oldTempImage) {
      try {
        const { deleteFile } = await import("../../utils/multer/s3.config");
        await deleteFile({ Key: oldTempImage });
        console.log(`Old temp profile image deleted: ${oldTempImage}`);
      } catch (error: any) {
        console.error(`Error deleting old temp profile image:`, error);
      }
    }

    s3Event.emit("trackProfileImageUpload", {
        userId: req.user?._id,
      oldKey: oldProfileImage,
        key,
      expiresIn: 3000
    });

    return SuccessResponse.ok(res, "Profile image upload initiated", {
        key,
        url
    });
  };

  ProfileCoverimage = async (req: IRequest, res: Response): Promise<Response> => {
    const oldCoverImages = req.user?.profileCoverimage || [];
    
    const urls = await uploadFiles({
      files: req.files as Express.Multer.File[],
      path: `profile/${req.user?._id}/Cover`
    });
    
    const user = await UserModel.findOneAndUpdate(
      { _id: req.user?._id },
      { profileCoverimage: urls },
      { new: true }
    );
    
    if (!user) {
      throw new BadRequestException("Failed to update cover images");
    }

    if (oldCoverImages.length > 0) {
      try {
        const { deleteFiles } = await import("../../utils/multer/s3.config");
        await deleteFiles({ urls: oldCoverImages });
        console.log(`Old cover images deleted: ${oldCoverImages.length} files`);
      } catch (error: any) {
        console.error(`Error deleting old cover images:`, error);
      }
    }

    return SuccessResponse.ok(res, "Cover images uploaded successfully", {
      urls,
      deletedOldImages: oldCoverImages.length
    });
  };

  deleteProfileImage = async (req: IRequest, res: Response): Promise<Response> => {
    if (!req.user?.profileimage) {
      throw new BadRequestException("No profile image to delete");
    }

    s3Event.emit("deleteProfileImage", {
      key: req.user.profileimage
    });

    const user = await UserModel.findOneAndUpdate(
      { _id: req.user._id },
      { profileimage: null, Tempprofileimage: null },
      { new: true }
    );

    if (!user) {
      throw new BadRequestException("Failed to delete profile image");
    }

    return SuccessResponse.ok(res, "Profile image deleted successfully");
  };

  deleteCoverImages = async (req: IRequest, res: Response): Promise<Response> => {
    if (!req.user?.profileCoverimage?.length) {
      throw new BadRequestException("No cover images to delete");
    }

    s3Event.emit("deleteCoverImages", {
      keys: req.user.profileCoverimage
    });

    const user = await UserModel.findOneAndUpdate(
      { _id: req.user._id },
      { profileCoverimage: [] },
      { new: true }
    );

    if (!user) {
      throw new BadRequestException("Failed to delete cover images");
    }

    return SuccessResponse.ok(res, "Cover images deleted successfully");
  };

  freezeUser = async (req: IRequest, res: Response): Promise<Response> => {
    this.checkAdminRole(req.user);

    const { userId } = req.body;
    if (!userId) {
      throw new BadRequestException("User ID is required");
    }

    const user = await UserModel.findOneAndUpdate(
      { _id: userId },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!user) {
      throw new BadRequestException("User not found");
    }

    return SuccessResponse.ok(res, "User frozen successfully", {
      userId: user._id,
      fullName: user.fullName,
      email: user.email,
      frozenAt: user.deletedAt
    });
  };

  restoreUser = async (req: IRequest, res: Response): Promise<Response> => {
    this.checkAdminRole(req.user);

    const { userId } = req.body;
    if (!userId) {
      throw new BadRequestException("User ID is required");
    }

    const user = await UserModel.findOneAndUpdate(
      { _id: userId, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      { new: true }
    );

    if (!user) {
      throw new BadRequestException("User not found or not frozen");
    }

    return SuccessResponse.ok(res, "User restored successfully", {
      userId: user._id,
      fullName: user.fullName,
      email: user.email,
      restoredAt: new Date()
    });
  };

  hardDeleteUser = async (req: IRequest, res: Response): Promise<Response> => {
    this.checkAdminRole(req.user);

    const { userId } = req.body;
    if (!userId) {
      throw new BadRequestException("User ID is required");
    }

    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      throw new BadRequestException("User not found");
    }

    const deletedFiles: string[] = [];
    const errors: string[] = [];

    try {
      if (targetUser.profileimage) {
        try {
          const { deleteFile } = await import("../../utils/multer/s3.config");
          await deleteFile({ Key: targetUser.profileimage });
          deletedFiles.push(`Profile image: ${targetUser.profileimage}`);
          console.log(`Profile image deleted: ${targetUser.profileimage}`);
        } catch (error: any) {
          errors.push(`Failed to delete profile image: ${error.message}`);
          console.error(`Error deleting profile image:`, error);
        }
      }

      if (targetUser.profileCoverimage?.length) {
        try {
          const { deleteFiles } = await import("../../utils/multer/s3.config");
          await deleteFiles({ urls: targetUser.profileCoverimage });
          deletedFiles.push(`Cover images: ${targetUser.profileCoverimage.length} files`);
          console.log(`Cover images deleted: ${targetUser.profileCoverimage.length} files`);
        } catch (error: any) {
          errors.push(`Failed to delete cover images: ${error.message}`);
          console.error(`Error deleting cover images:`, error);
        }
      }

      if (targetUser.Tempprofileimage) {
        try {
          const { deleteFile } = await import("../../utils/multer/s3.config");
          await deleteFile({ Key: targetUser.Tempprofileimage });
          deletedFiles.push(`Temp profile image: ${targetUser.Tempprofileimage}`);
          console.log(`Temp profile image deleted: ${targetUser.Tempprofileimage}`);
        } catch (error: any) {
          errors.push(`Failed to delete temp profile image: ${error.message}`);
          console.error(`Error deleting temp profile image:`, error);
        }
      }

      const path = `profile/${userId}`;
      try {
        const { deleteFolderByPrefix } = await import("../../utils/multer/s3.config");
        await deleteFolderByPrefix({ path });
        deletedFiles.push(`Profile folder: ${path}`);
        console.log(`Profile folder deleted: ${path}`);
      } catch (error: any) {
        if (error.message !== "empty directory") {
          errors.push(`Failed to delete profile folder: ${error.message}`);
          console.error(`Error deleting profile folder:`, error);
        } else {
          deletedFiles.push(`Profile folder: ${path} (was empty)`);
        }
      }

      const user = await UserModel.findByIdAndDelete(userId);

      if (!user) {
        throw new BadRequestException("Failed to delete user from database");
      }

      return SuccessResponse.ok(res, "User permanently deleted", {
        deletedUserId: userId,
        deletedUserName: user.fullName,
        deletedUserEmail: user.email,
        deletedAt: new Date(),
        deletedFiles,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error: any) {
      console.error("Error in hard delete process:", error);
      throw new BadRequestException(`Failed to delete user: ${error.message}`);
    }
  };

  updateProfile = async (req: IRequest, res: Response): Promise<Response> => {
    const { fullName, phone } = req.body;
    
    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (phone) updateData.phone = phone;

    const user = await UserModel.findOneAndUpdate(
      { _id: req.user?._id },
      updateData,
      { new: true }
    );

    if (!user) {
      throw new BadRequestException("Failed to update profile");
    }

    return SuccessResponse.ok(res, "Profile updated successfully", {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.getDecryptedPhone(),
      role: user.role,
      isVerified: user.isVerified,
    });
  };

  changePassword = async (req: IRequest, res: Response): Promise<Response> => {
    const { currentPassword, newPassword } = req.body;
    
    const user = await UserModel.findById(req.user?._id);
    if (!user) {
      throw new BadRequestException("User not found");
    }

    const { compareHash } = await import("../../utils/security/hashing.security");
    const isCurrentPasswordValid = await compareHash({ plaintext: currentPassword, hashValue: user.password });
    
    if (!isCurrentPasswordValid) {
      throw new BadRequestException("Current password is incorrect");
    }

    const { generateHash } = await import("../../utils/security/hashing.security");
    const hashedNewPassword = await generateHash({ plaintext: newPassword });

    await UserModel.findOneAndUpdate(
      { _id: req.user?._id },
      { password: hashedNewPassword },
      { new: true }
    );

    return SuccessResponse.ok(res, "Password changed successfully");
  };
}

export default new UserService();
