import type { Request, Response } from "express";
import {ISignupinputDTO,ILogininputDTO,IVerifyOtpDTO,IRefreshTokenDTO,} from "./auth.dto";
import UserModel from "../../DB/model/user.model";
import { generateHash, compareHash } from "../../utils/security/hashing.security";
import {generateAccessToken,generateRefreshToken,verifyRefreshToken,} from "../../utils/security/token.security";
import { generateOtp, otpExpiryDate } from "../../utils/otp/otp";
import { sendEmail } from "../../utils/email/email";
import { emailTemplates } from "../../utils/email/email.temp";
import {BadRequestException,UnauthorizedException,} from "../../utils/response/error.response";

class AuthenticationService {
  constructor() {}

 // Signup & email OTP 
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
      isVerified: false,
    });

    const otp = generateOtp();
    const otpHash = await generateHash({ plaintext: otp });
    user.otpHash = otpHash;
    user.otpExpires = otpExpiryDate();
    await user.save();

    await sendEmail(user.email, "Verify your email", emailTemplates.verifyOtp(otp, user.fullName));

    return res.status(201).json({
      message: "Signup successful. OTP sent to email.",
      data: { id: user._id, fullName: user.fullName, email: user.email },
    });
  };

  // Verify OTP
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

  //Login
  login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password }: ILogininputDTO = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) throw new UnauthorizedException("Invalid email or password");

    const match = await compareHash({ plaintext: password, hashValue: user.password });
    if (!match) throw new UnauthorizedException("Invalid email or password");

    if (!user.isVerified) throw new UnauthorizedException("Please verify your email first");

    const accessToken = generateAccessToken({ id: user._id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user._id });

    user.refreshToken = refreshToken;
    await user.save();
    await sendEmail(user.email, "Welcome back 🎉", emailTemplates.welcomeAfterLogin(user.fullName));

    return res.status(200).json({message: "Login successful",
      data: {user: { id: user._id, fullName: user.fullName, email: user.email },accessToken,refreshToken,},
    });
  };

  // Refresh verify refresh token, issue a new access token 
 refresh = async (req: Request, res: Response): Promise<Response> => {
  const { refreshToken }: IRefreshTokenDTO = req.body;

  if (!refreshToken) throw new UnauthorizedException("Refresh token required");

  const decoded = verifyRefreshToken(refreshToken);

  if (!decoded || typeof decoded !== "object" || !("id" in decoded)) {
    throw new UnauthorizedException("Invalid refresh token");
  }

  const user = await UserModel.findById((decoded as any).id);
  if (!user || user.refreshToken !== refreshToken) {
    throw new UnauthorizedException("Invalid refresh token");
  }

  const newAccessToken = generateAccessToken({
    id: user._id.toString(),
    email: user.email,
  });

  return res.status(200).json({ accessToken: newAccessToken });
};


 // Resend OTP
  resendOtp = async (req: Request, res: Response): Promise<Response> => {
    const { email } = req.body as { email: string };
    const user = await UserModel.findOne({ email });
    if (!user) throw new BadRequestException("User not found");
    if (user.isVerified) throw new BadRequestException("User already verified");

    const otp = generateOtp();
    user.otpHash = await generateHash({ plaintext: otp });
    user.otpExpires = otpExpiryDate();
    await user.save();

    await sendEmail(user.email, "Verify your email (OTP)", emailTemplates.verifyOtp(otp, user.fullName));

    return res.status(200).json({ message: "OTP resent successfully" });
  };
}

export default new AuthenticationService();
