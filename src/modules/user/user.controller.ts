import userService from './user.service';
import { Router } from "express";
import { authenticate } from '../../middleware/auth.middleware';
import { validation } from '../../middleware/validation.middleware';
import { cloudFileupload, fileValidation, storageEnum } from '../../utils/multer/clooud.multer';
import { 
  profileImageUpload, 
  updateProfile, 
  changePassword, 
  deleteProfileImage, 
  deleteCoverImages, 
  freezeUser, 
  restoreUser, 
  hardDeleteUser, 
  getProfile, 
  uploadCoverImages
} from './user.validation';

const router = Router();

// User Profile Routes
router.get("/profile", authenticate, validation(getProfile), userService.getProfile);
router.patch("/update-profile", authenticate, validation(updateProfile), userService.updateProfile);
router.patch("/change-password", authenticate, validation(changePassword), userService.changePassword);

// Profile Images Routes
router.patch("/profile-image", authenticate, validation(profileImageUpload), userService.imageProfile);
router.patch("/profile-cover-image", authenticate, validation(uploadCoverImages), cloudFileupload({Validation: fileValidation.image, storageApproach: storageEnum.disk}).array("images", 2), userService.ProfileCoverimage);
router.delete("/profile-image", authenticate, validation(deleteProfileImage), userService.deleteProfileImage);
router.delete("/cover-images", authenticate, validation(deleteCoverImages), userService.deleteCoverImages);

// Admin Routes
router.patch("/admin/freeze-user", authenticate, validation(freezeUser), userService.freezeUser);
router.patch("/admin/restore-user", authenticate, validation(restoreUser), userService.restoreUser);
router.delete("/admin/hard-delete-user", authenticate, validation(hardDeleteUser), userService.hardDeleteUser);

export default router;
