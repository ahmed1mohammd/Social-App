import { Request } from "express";
import { IUser } from "../../DB/model/user.model";

export interface IRequest extends Request {
  user?: IUser;
}

export interface ISignupinputDTO {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

export interface ILogininputDTO {
  email: string;
  password: string;
}

export interface IVerifyOtpDTO {
  email: string;
  otp: string;
}

export interface IRefreshTokenDTO {
  refreshToken: string;
}

export interface IForgotPasswordDTO {
  email: string;
}

export interface IResetPasswordDTO {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IGoogleAuthDTO {
  idToken: string;
}

export interface IGoogleSignupDTO {
  idToken: string;
}

export interface IGoogleLoginDTO {
  idToken: string;
}

export interface ILogoutDTO {

}
