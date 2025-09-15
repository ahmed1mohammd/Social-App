
import jwt, { Secret, SignOptions, JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";

export interface ITokenPayload {
  id: string;
  email: string;
  role: string;
}

export interface IRefreshTokenPayload {
  id: string;
  tokenId: string;
}

export const generateAccessToken = (payload: ITokenPayload): string => {
  if (!process.env.ACCESS_TOKEN_SECRET || !process.env.ADMIN_TOKEN_SECRET) {
    throw new Error("Token secrets not configured");
  }

  const secret = payload.role === "Admin" 
    ? process.env.ADMIN_TOKEN_SECRET as Secret 
    : process.env.ACCESS_TOKEN_SECRET as Secret;

  return jwt.sign(payload, secret, {
    expiresIn: process.env.ACCESS_EXPIRES_IN || "120m",
  } as SignOptions);
};

export const generateRefreshToken = (payload: IRefreshTokenPayload): string => {
  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error("Refresh token secret not configured");
  }
  
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET as Secret, {
    expiresIn: process.env.REFRESH_EXPIRES_IN || "365d",
  } as SignOptions);
};

export const verifyAccessToken = (token: string, isAdmin: boolean = false): ITokenPayload | null => {
  try {
    const secret = isAdmin 
      ? process.env.ADMIN_TOKEN_SECRET as string 
      : process.env.ACCESS_TOKEN_SECRET as string;

    return jwt.verify(token, secret) as ITokenPayload;
  } catch (err) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): IRefreshTokenPayload | null => {
  try {
    return jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as IRefreshTokenPayload;
  } catch {
    return null;
  }
};

export const generateTokenId = (): string => {
  return new Types.ObjectId().toString();
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};

export const getTokenTypeFromHeader = (
  authHeader: string
):

{ token: string; isAdmin: boolean } => {
  const parts = authHeader.split(" ");
  if (parts.length !== 2) {
    return { token: "", isAdmin: false };
  }

  const scheme = parts[0] || "";
  const token = parts[1] || "";

  if (/^Bearer$/i.test(scheme)) {
    return { token, isAdmin: false };
  } else if (/^System$/i.test(scheme)) {
    return { token, isAdmin: true };
  }

  return { token: "", isAdmin: false };
};
