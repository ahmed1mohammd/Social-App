import mongoose, { Schema, Document } from "mongoose";

export interface IRevokedToken extends Document {
  tokenId: string;
  userId: string;
  tokenType: "access" | "refresh";
  revokedAt: Date;
  expiresAt: Date;
}

const revokedTokenSchema = new Schema<IRevokedToken>(
  {
    tokenId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    tokenType: { type: String, enum: ["access", "refresh"], required: true },
    revokedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RevokedTokenModel = mongoose.model<IRevokedToken>("RevokedToken", revokedTokenSchema);
export default RevokedTokenModel;
