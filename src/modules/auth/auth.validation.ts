import {  z } from "zod";

export const signup = {
  body: z.object({
    fullName: z.string({error: "fullName is required" })
      .min(2, { message: "min fullName is 2 char" })
      .max(20, { message: "max fullName is 20 char" }),
    email: z.string({error: "email is required" })
      .email({ message: "Invalid email, must be like example@gmail.com" }),
    phone: z.string({error: "phone is required" })
      .regex(/^01[0-2,5]{1}[0-9]{8}$/, { message: "Invalid Egyptian phone number" }),
    password: z.string({error: "password is required" })
      .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/, {
        message: "Password must be ≥8, include uppercase, number, special",
      }),
    confirmPassword: z.string({error: "confirmPassword is required" }),
  }).refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Password mismatch with confirmPassword",
  }),
};

export const login = {
  body: z.object({
    email: z.string({error: "email is required" })
      .email({ message: "Invalid email, must be like example@gmail.com" }),
    password: z.string({error: "password is required" })
      .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/, {
        message: "Password must be ≥8, include uppercase, number, special",
      }),
  }),
};

export const verifyOtp = {
  body: z.object({
    email: z.string().email(),
    otp: z.string().length(6, { message: "OTP must be 6 digits" }),
  }),
};

export const refreshToken = {
  body: z.object({
    refreshToken: z.string({error: "refreshToken is required" }),
  }),
};

export const logout = {
  body: z.object({}).optional(),
};

export const googleSignup = {
  body: z.object({
    idToken: z.string({error: "Google ID token is required" }),
  }),
};

export const googleLogin = {
  body: z.object({
    idToken: z.string({error: "Google ID token is required" }),
  }),
};

export const forgotPassword = {
  body: z.object({
    email: z.string().email({ message: "Invalid email format" }),
  }),
};

export const resetPassword = {
  body: z.object({
    email: z.string().email({ message: "Invalid email format" }),
    otp: z.string().length(6, { message: "OTP must be 6 digits" }),
    newPassword: z.string({error: "newPassword is required" })
      .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/, {
        message: "Password must be ≥8, include uppercase, number, special",
      }),
    confirmPassword: z.string({error: "confirmPassword is required" }),
  }).refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Password mismatch with confirmPassword",
  }),
};

export const resendOtp = {
  body: z.object({
    email:z.string().email()
  }),
};

