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
