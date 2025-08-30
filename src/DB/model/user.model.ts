import mongoose, { Types, Schema, Document } from "mongoose";

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
  avatar?: string | null;
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
    avatar: { type: String, default: null },
  },
  { timestamps: true }
);

const UserModel = mongoose.model<IUser>("User", userSchema);
export default UserModel;
