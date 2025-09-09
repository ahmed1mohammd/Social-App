import { z } from "zod";

// Profile Image Upload Validation
export const profileImageUpload = {
  body: z.object({
    ContentType: z.string({ error: "ContentType is required" })
      .regex(/^image\/(jpeg|jpg|png|gif|webp)$/, { 
        message: "ContentType must be a valid image format (jpeg, jpg, png, gif, webp)" 
      }),
    originalname: z.string({ error: "originalname is required" })
      .min(1, { message: "originalname cannot be empty" })
      .max(255, { message: "originalname too long" })
      .regex(/^[^<>:"/\\|?*]+\.(jpg|jpeg|png|gif|webp)$/i, {
        message: "Invalid filename format"
      }),
  }),
};

// Update Profile Validation
export const updateProfile = {
  body: z.object({
    fullName: z.string({ error: "fullName is required" })
      .min(2, { message: "fullName must be at least 2 characters" })
      .max(20, { message: "fullName must not exceed 20 characters" })
      .optional(),
    phone: z.string({ error: "phone is required" })
      .regex(/^01[0-2,5]{1}[0-9]{8}$/, { 
        message: "Invalid Egyptian phone number format" 
      })
      .optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  }),
};

// Change Password Validation
export const changePassword = {
  body: z.object({
    currentPassword: z.string({ error: "currentPassword is required" }),
    newPassword: z.string({ error: "newPassword is required" })
      .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/, {
        message: "Password must be ≥8, include uppercase, number, special character",
      }),
    confirmPassword: z.string({ error: "confirmPassword is required" }),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "New password and confirm password do not match",
  }).refine((data) => data.currentPassword !== data.newPassword, {
    path: ["newPassword"],
    message: "New password must be different from current password",
  }),
};

// Delete Operations Validation
export const deleteProfileImage = {
  body: z.object({}).optional(),
};

export const deleteCoverImages = {
  body: z.object({}).optional(),
};

// Admin Operations Validation
export const freezeUser = {
  body: z.object({
    userId: z.string({ error: "userId is required" })
      .min(1, { message: "User ID cannot be empty" }),
  }),
};

export const restoreUser = {
  body: z.object({
    userId: z.string({ error: "userId is required" })
      .min(1, { message: "User ID cannot be empty" }),
  }),
};

export const hardDeleteUser = {
  body: z.object({
    userId: z.string({ error: "userId is required" })
      .min(1, { message: "User ID cannot be empty" }),
  }),
};

// General Operations Validation
export const getProfile = {
  body: z.object({}).optional(),
};

export const uploadCoverImages = {
  body: z.object({}).optional(),
};
