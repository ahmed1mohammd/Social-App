
import jwt, {Secret, SignOptions, JwtPayload } from "jsonwebtoken";

export const generateAccessToken = (payload: object): string => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET as Secret, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRE as string,
  } as SignOptions);
};

export const generateRefreshToken = (payload: object): string => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET as Secret, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRE as string, 
  } as SignOptions);
};

// Verify Access Token
export const verifyAccessToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as JwtPayload;
  } catch {
    return null;
  }
};

// Verify Refresh Token
export const verifyRefreshToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as JwtPayload;
  } catch {
    return null;
  }
};
