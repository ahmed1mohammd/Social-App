import mongoose, { Types, Schema, Document } from "mongoose";
import { encryptPhone, decryptPhone, isEncryptedPhone } from "../../utils/security/phone.encryption";

export interface IUser extends Document {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  isVerified: boolean;
  otpHash?: string | null;
  otpExpires?: Date | null;
  refreshToken?: string | null;
  refreshTokenId?: string | null;
  googleId?: string | null;
  profileimage?: string;
  profileCoverimage?: string[];
  Tempprofileimage?: string;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  pendingEmail?: string | null;
  emailOTP?: string | null;
  emailOTPExpires?: Date | null;

  getDecryptedPhone(): string;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, minlength: 2, maxlength: 20 },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "Admin"], default: "user" },
    isVerified: { type: Boolean, default: false },
    otpHash: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    refreshToken: { type: String, default: null },
    refreshTokenId: { type: String, default: null },
    googleId: { type: String, default: null },
    profileimage: { type: String, default: null },
    profileCoverimage: [String],
    Tempprofileimage: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    pendingEmail: { type: String, default: null },
    emailOTP: { type: String, default: null },
    emailOTPExpires: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  if (this.isModified("phone") && !isEncryptedPhone(this.phone)) {
    this.phone = encryptPhone(this.phone);
  }
  next();
});

userSchema.methods.getDecryptedPhone = function (): string {
  if (isEncryptedPhone(this.phone)) {
    return decryptPhone(this.phone);
  }
  return this.phone;
};

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  if (userObject.phone && isEncryptedPhone(userObject.phone)) {
    userObject.phone = decryptPhone(userObject.phone);
  }
  return userObject;
};

const UserModel = mongoose.model<IUser>("User", userSchema);
export default UserModel;
