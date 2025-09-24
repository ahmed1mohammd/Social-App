import type { Request, Response } from "express";
import {ISignupinputDTO,IVerifyOtpDTO,IRefreshTokenDTO,IForgotPasswordDTO,IResetPasswordDTO,IGoogleSignupDTO,IGoogleLoginDTO,} from "./auth.dto";
import UserModel from "../../DB/model/user.model";
import RevokedTokenModel from "../../DB/model/revoked-token.model";
import { generateHash, compareHash } from "../../utils/security/hashing.security";
import {generateAccessToken,generateRefreshToken,verifyRefreshToken,verifyAccessToken,generateTokenId,getTokenTypeFromHeader,} from "../../utils/security/token.security";
import { generateOtp, otpExpiryDate } from "../../utils/otp/otp";
import { sendEmail } from "../../utils/email/email";
import { emailTemplates } from "../../utils/email/email.temp";
import {BadRequestException, UnauthorizedException,} from "../../utils/response/error.response";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthenticationService {
  constructor() {}

  signup = async (req: Request, res: Response): Promise<Response> => {
    const { fullName, email, password, confirmPassword, phone }: ISignupinputDTO = req.body;

    if (password !== confirmPassword) {
      throw new BadRequestException("Password mismatch with confirmPassword");
    }

    const exists = await UserModel.findOne({ email });
    if (exists) throw new BadRequestException("Email already registered");

    const passwordHash = await generateHash({ plaintext: password });

    const user = await UserModel.create({
      fullName,
      email,
      phone,
      password: passwordHash,
      role: "user",
      isVerified: false,
    });

    const otp = generateOtp();
    const otpHash = await generateHash({ plaintext: otp });
    user.otpHash = otpHash;
    user.otpExpires = otpExpiryDate();
    await user.save();

     sendEmail(
      user.email,
      "Verify your email",
      emailTemplates.verifyOtp(otp, user.fullName)
    );

    return res.status(201).json({
      message: "Signup successful. OTP sent to email.",
      data: { id: user._id, fullName: user.fullName, email: user.email },
    });
  };

  verifyOtp = async (req: Request, res: Response): Promise<Response> => {
    const { email, otp }: IVerifyOtpDTO = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) throw new BadRequestException("User not found");

    if (!user.otpHash || !user.otpExpires) throw new BadRequestException("OTP not set");
    if (user.otpExpires < new Date()) throw new UnauthorizedException("OTP expired");

    const ok = await compareHash({ plaintext: otp, hashValue: user.otpHash });
    if (!ok) throw new UnauthorizedException("Invalid OTP");

    user.isVerified = true;
    user.otpHash = null;
    user.otpExpires = null;
    await user.save();

    return res.status(200).json({ message: "Email verified successfully" });
  };
  
  refresh = async (req: Request, res: Response): Promise<Response> => {
    const { refreshToken }: IRefreshTokenDTO = req.body;

    if (!refreshToken) throw new UnauthorizedException("Refresh token required");

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) throw new UnauthorizedException("Invalid refresh token");

    const user = await UserModel.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken || user.refreshTokenId !== decoded.tokenId) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const newTokenId = generateTokenId();
    const newAccessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    const newRefreshToken = generateRefreshToken({
      id: user._id.toString(),
      tokenId: newTokenId,
    });

    const oldTokenId = user.refreshTokenId;
    user.refreshToken = newRefreshToken;
    user.refreshTokenId = newTokenId;
    await user.save();

    if (oldTokenId) {
      await RevokedTokenModel.create({
        tokenId: oldTokenId,
        userId: user._id.toString(),
        tokenType: "refresh",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  };

  logout = async (req: Request, res: Response): Promise<Response> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || (!authHeader.startsWith("Bearer ") && !authHeader.startsWith("System "))) {
      throw new BadRequestException("Authorization header required");
    }

    const { token, isAdmin } = getTokenTypeFromHeader(authHeader);
    const decoded = verifyAccessToken(token, isAdmin);
    
    if (!decoded) {
      throw new BadRequestException("Invalid token");
    }

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      throw new BadRequestException("User not found");
    }

    if (user.refreshTokenId) {
      await RevokedTokenModel.create({
        tokenId: user.refreshTokenId,
        userId: user._id.toString(),
        tokenType: "refresh",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }
    
    user.refreshToken = null;
    user.refreshTokenId = null;
    await user.save();

    return res.status(200).json({ message: "Logged out successfully" });
  };

  googleSignup = async (req: Request, res: Response): Promise<Response> => {
    const { idToken }: IGoogleSignupDTO = req.body;

    try {
      if (!process.env.WEB_CLIENT_ID) {
        throw new BadRequestException("Google client ID not configured");
      }

      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.WEB_CLIENT_ID,
      });

      const payload = await ticket.getPayload();
      if (!payload) throw new UnauthorizedException("Invalid Google token");

      const { email, name, picture, sub: googleId } = payload;
      if (!email) throw new UnauthorizedException("Email not found in Google token");

      
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        throw new BadRequestException("Email already registered. Please use Google login instead.");
      }

      
      const user = await UserModel.create({
        fullName: name || "Google User",
        email: email,
        password: await generateHash({ plaintext: googleId + Date.now() }),
        phone: "",
        role: "user",
        isVerified: true,
        googleId,
        profileimage: picture || null,
      });

      const tokenId = generateTokenId();
      const accessToken = generateAccessToken({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      });
      const refreshToken = generateRefreshToken({
        id: user._id.toString(),
        tokenId,
      });

      user.refreshToken = refreshToken;
      user.refreshTokenId = tokenId;
      await user.save();

      return res.status(201).json({
        message: "Google signup successful",
        data: {
          user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException("Google signup failed");
    }
  };

  googleLogin = async (req: Request, res: Response): Promise<Response> => {
    const { idToken }: IGoogleLoginDTO = req.body;

    try {
      if (!process.env.WEB_CLIENT_ID) {
        throw new BadRequestException("Google client ID not configured");
      }

      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.WEB_CLIENT_ID,
      });

      const payload = await ticket.getPayload();
      if (!payload) throw new UnauthorizedException("Invalid Google token");

      const { email, sub: googleId } = payload;
      if (!email) throw new UnauthorizedException("Email not found in Google token");

      const user = await UserModel.findOne({ email });
      if (!user) {
        throw new BadRequestException("User not found. Please use Google signup first.");
      }

      
      if (!user.googleId) {
        throw new BadRequestException("This email is registered with regular password. Please use regular login.");
      }

      
      if (user.googleId !== googleId) {
        user.googleId = googleId;
        await user.save();
      }

      const tokenId = generateTokenId();
      const accessToken = generateAccessToken({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      });
      const refreshToken = generateRefreshToken({
        id: user._id.toString(),
        tokenId,
      });

      user.refreshToken = refreshToken;
      user.refreshTokenId = tokenId;
      await user.save();

      return res.status(200).json({
        message: "Google login successful",
        data: {
          user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException("Google login failed");
    }
  };

  forgotPassword = async (req: Request, res: Response): Promise<Response> => {
    const { email }: IForgotPasswordDTO = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) throw new BadRequestException("User not found");

    const otp = generateOtp();
    const otpHash = await generateHash({ plaintext: otp });
    user.otpHash = otpHash;
    user.otpExpires = otpExpiryDate();
    await user.save();

     sendEmail(
      user.email,
      "Reset your password",
      emailTemplates.resetPasswordOtp(otp, user.fullName)
    );

    return res.status(200).json({ message: "Password reset OTP sent to email" });
  };

  resetPassword = async (req: Request, res: Response): Promise<Response> => {
    const { email, otp, newPassword, confirmPassword }: IResetPasswordDTO = req.body;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException("Password mismatch with confirmPassword");
    }

    const user = await UserModel.findOne({ email });
    if (!user) throw new BadRequestException("User not found");

    if (!user.otpHash || !user.otpExpires) throw new BadRequestException("OTP not set");
    if (user.otpExpires < new Date()) throw new UnauthorizedException("OTP expired");

    const ok = await compareHash({ plaintext: otp, hashValue: user.otpHash });
    if (!ok) throw new UnauthorizedException("Invalid OTP");

    const passwordHash = await generateHash({ plaintext: newPassword });
    user.password = passwordHash;
    user.otpHash = null;
    user.otpExpires = null;
    await user.save();

    if (user.refreshTokenId) {
      await RevokedTokenModel.create({
        tokenId: user.refreshTokenId,
        userId: user._id.toString(),
        tokenType: "refresh",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      user.refreshToken = null;
      user.refreshTokenId = null;
      await user.save();
    }

    return res.status(200).json({ message: "Password reset successfully" });
  };

  resendOtp = async (req: Request, res: Response): Promise<Response> => {
    const { email } = req.body as { email: string };
    const user = await UserModel.findOne({ email });
    if (!user) throw new BadRequestException("User not found");
    if (user.isVerified) throw new BadRequestException("User already verified");

    const otp = generateOtp();
    user.otpHash = await generateHash({ plaintext: otp });
    user.otpExpires = otpExpiryDate();
    await user.save();

     sendEmail(
      user.email,
      "Verify your email (OTP)",
      emailTemplates.verifyOtp(otp, user.fullName)
    );

    return res.status(200).json({ message: "OTP resent successfully" });
  };

  updateEmailRequest = async (req: Request, res: Response): Promise<Response> => {
  const user = (req as any).user;

  if (!user || !user.id) {
    throw new UnauthorizedException("User not authenticated or session invalid");
  }

  const { newEmail } = req.body as { newEmail: string };
  const userId = user.id;

  const existing = await UserModel.findOne({ email: newEmail });
  if (existing) throw new BadRequestException("Email already in use");

  const userRecord = await UserModel.findById(userId);
  if (!userRecord) throw new BadRequestException("User not found");

  const otp = generateOtp();
  const otpHash = await generateHash({ plaintext: otp });

  userRecord.pendingEmail = newEmail;
  userRecord.emailOTP = otpHash;
  userRecord.emailOTPExpires = otpExpiryDate();
  await userRecord.save();

   sendEmail(
    newEmail,
    "Confirm your new email",
    emailTemplates.verifyOtp(otp, userRecord.fullName)
  );

  return res.status(200).json({
    message: "OTP sent to new email. Please verify to update your email.",
  });
  };

  confirmUpdateEmail = async (req: Request, res: Response): Promise<Response> => {
  const { otp } = req.body as { otp: string };
  const userId = (req as any).user.id; 

  const user = await UserModel.findById(userId);
  if (!user) throw new BadRequestException("User not found");

  if (!user.pendingEmail || !user.emailOTP || !user.emailOTPExpires) {
    throw new BadRequestException("No email update request found");
  }

  if (user.emailOTPExpires < new Date()) {
    throw new UnauthorizedException("OTP expired");
  }

  const ok = await compareHash({ plaintext: otp, hashValue: user.emailOTP });
  if (!ok) throw new UnauthorizedException("Invalid OTP");

  user.email = user.pendingEmail;
  user.pendingEmail = null;
  user.emailOTP = null;
  user.emailOTPExpires = null;
  await user.save();

  return res.status(200).json({ message: "Email updated successfully" });
  };
  
   requestEnable2FA = async (req: Request, res: Response): Promise<Response> => {
    const userId = (req as any).user?.id;
    if (!userId) throw new UnauthorizedException("User not authenticated");

    const user = await UserModel.findById(userId);
    if (!user) throw new BadRequestException("User not found");

    const otp = generateOtp();
    const otpHash = await generateHash({ plaintext: otp });

    user.twoStepOtpHash = otpHash;
    user.twoStepOtpExpires = otpExpiryDate();
    await user.save();

    await sendEmail(
      user.email,
      "Enable 2-Step Verification",
      emailTemplates.twoStepEnableOtp(otp, user.fullName)
    );

    return res.status(200).json({ message: "OTP sent to your email" });
  };
  
   verifyEnable2FA = async (req: Request, res: Response): Promise<Response> => {
    const userId = (req as any).user?.id;
    const { otp } = req.body as { otp: string };

    const user = await UserModel.findById(userId);
    if (!user) throw new BadRequestException("User not found");

    if (!user.twoStepOtpHash || !user.twoStepOtpExpires) {
      throw new BadRequestException("No OTP request found");
    }
    if (user.twoStepOtpExpires < new Date()) {
      throw new UnauthorizedException("OTP expired");
    }

    const ok = await compareHash({ plaintext: otp, hashValue: user.twoStepOtpHash });
    if (!ok) throw new UnauthorizedException("Invalid OTP");

    user.twoStepEnabled = true;
    user.twoStepOtpHash = null;
    user.twoStepOtpExpires = null;
    await user.save();

    return res.status(200).json({ message: "2FA enabled successfully" });
  };

  loginWith2FA = async (req: Request, res: Response): Promise<Response> => {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) throw new UnauthorizedException("Invalid email or password");

    const match = await compareHash({ plaintext: password, hashValue: user.password });
    if (!match) throw new UnauthorizedException("Invalid email or password");

    if (user.twoStepEnabled) {
      const otp = generateOtp();
      const otpHash = await generateHash({ plaintext: otp });
      user.twoStepOtpHash = otpHash;
      user.twoStepOtpExpires = otpExpiryDate();
      await user.save();

      await sendEmail(
        user.email,
        "Login Verification",
        emailTemplates.twoStepLoginOtp(otp, user.fullName)
      );

      return res.status(200).json({ message: "OTP sent to email for login verification" });
    }

    
    const tokenId = generateTokenId();
    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      id: user._id.toString(),
      tokenId,
    });

    user.refreshToken = refreshToken;
    user.refreshTokenId = tokenId;
    await user.save();

      sendEmail(
      user.email,
      "Welcome back",
      emailTemplates.welcomeAfterLogin(user.fullName)
    );

    return res.status(200).json({
      message: "Login successful",
      data: { accessToken, refreshToken },
    });
  };

  verifyLoginOtp = async (req: Request, res: Response): Promise<Response> => {
    const { email, otp } = req.body as { email: string; otp: string };

    const user = await UserModel.findOne({ email });
    if (!user) throw new BadRequestException("User not found");

    if (!user.twoStepOtpHash || !user.twoStepOtpExpires) {
      throw new BadRequestException("No OTP request found");
    }
    if (user.twoStepOtpExpires < new Date()) {
      throw new UnauthorizedException("OTP expired");
    }

    const ok = await compareHash({ plaintext: otp, hashValue: user.twoStepOtpHash });
    if (!ok) throw new UnauthorizedException("Invalid OTP");

    user.twoStepOtpHash = null;
    user.twoStepOtpExpires = null;
    await user.save();

    const tokenId = generateTokenId();
    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      id: user._id.toString(),
      tokenId,
    });

    user.refreshToken = refreshToken;
    user.refreshTokenId = tokenId;
    await user.save();

  sendEmail(
      user.email,
      "Welcome back",
      emailTemplates.welcomeAfterLogin(user.fullName)
    );
  return res.status(200).json({
    message: "Login successful with 2FA",
    data: { accessToken, refreshToken },
  });
};



}

export default new AuthenticationService();
