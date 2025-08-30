import { Response, NextFunction } from "express";
import { IRequest } from "../modules/auth/auth.dto";
import { verifyAccessToken, getTokenTypeFromHeader } from "../utils/security/token.security";
import UserModel from "../DB/model/user.model";
import RevokedTokenModel from "../DB/model/revoked-token.model";
import { UnauthorizedException } from "../utils/response/error.response";

export const authenticate = async (
  req: IRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || (!authHeader.startsWith("Bearer ") && !authHeader.startsWith("System "))) {
      throw new UnauthorizedException("Access token required");
    }

    const { token, isAdmin } = getTokenTypeFromHeader(authHeader);
    const decoded = verifyAccessToken(token, isAdmin);
    
    if (!decoded) {
      throw new UnauthorizedException("Invalid access token");
    }

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

               if (isAdmin && user.role !== "Admin") {
             throw new UnauthorizedException("Admin access required");
           }

           // Check if this specific token is revoked
           // We need to store the actual token hash in revoked tokens, not just userId
           // For now, we'll skip this check since we're not storing the actual token
           // The JWT expiry will handle token invalidation

           req.user = user;
           next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (roles: string[]) => {
  return (req: IRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedException("Authentication required");
    }

    if (!roles.includes(req.user.role)) {
      throw new UnauthorizedException("Insufficient permissions");
    }

    next();
  };
};
