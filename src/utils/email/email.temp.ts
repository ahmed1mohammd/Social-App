export const emailTemplates = {
  /** Email for OTP verification */
  verifyOtp: (otp: string, name: string) => `
    <div style="font-family: Arial, sans-serif; background: #0d1117; color: #e6edf3; padding: 20px; border-radius: 10px; max-width: 500px; margin: auto; border: 1px solid #30363d;">
      <h2 style="color: #58a6ff; text-align: center;"> 🔐 Email Verification</h2>
      <p style="font-size: 16px;">Hi <b>${name}</b>,</p>
      <p style="font-size: 15px;">Use the following OTP to verify your email (valid for <b>2 minutes</b>):</p>
      <div style="background: #161b22; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <h1 style="color: #58a6ff; letter-spacing: 4px;">${otp}</h1>
      </div>
      <p style="font-size: 13px; color: #8b949e;">If you didn't request this, please ignore this email.</p>
    </div>
  `,

  /** Welcome email after login */
  welcomeAfterLogin: (name: string) => `
    <div style="font-family: Arial, sans-serif; background: #0d1117; color: #e6edf3; padding: 20px; border-radius: 10px; max-width: 500px; margin: auto; border: 1px solid #30363d;">
      <h2 style="color: #58a6ff; text-align: center;"> 🎉 Welcome Back!</h2>
      <p style="font-size: 16px;">Hello <b>${name}</b>,</p>
      <p style="font-size: 15px;">We're excited to see you again. Wishing you a great session ahead!</p>
      <div style="background: #161b22; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <p style="color: #58a6ff; font-size: 18px;">💙 Stay productive, stay inspired!</p>
      </div>
      <p style="font-size: 13px; color: #8b949e; text-align:center;">&copy; ${new Date().getFullYear()} SocialApp Team</p>
    </div>
  `,

  /** Reset password OTP email */
  resetPasswordOtp: (otp: string, name: string) => `
    <div style="font-family: Arial, sans-serif; background: #0d1117; color: #e6edf3; padding: 20px; border-radius: 10px; max-width: 500px; margin: auto; border: 1px solid #30363d;">
      <h2 style="color: #58a6ff; text-align: center;"> 🔑 Password Reset</h2>
      <p style="font-size: 16px;">Hi <b>${name}</b>,</p>
      <p style="font-size: 15px;">You requested to reset your password. Use the following OTP (valid for <b>2 minutes</b>):</p>
      <div style="background: #161b22; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <h1 style="color: #58a6ff; letter-spacing: 4px;">${otp}</h1>
      </div>
      <p style="font-size: 13px; color: #8b949e;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
    </div>
  `,
    /** New post tag notification */
  taggedInPost: (taggedUserName: string, authorName: string, content: string) => `
    <div style="font-family: Arial, sans-serif; background: #0d1117; color: #e6edf3; padding: 20px; border-radius: 10px; max-width: 500px; margin: auto; border: 1px solid #30363d;">
      <h2 style="color: #58a6ff; text-align: center;"> 📌 You've Been Tagged!</h2>
      <p style="font-size: 16px;">Hi <b>${taggedUserName}</b>,</p>
      <p style="font-size: 15px;"><b>${authorName}</b> mentioned you in a new post:</p>
      <div style="background: #161b22; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #c9d1d9; font-size: 15px;">${content}</p>
      </div>
      <p style="font-size: 13px; color: #8b949e;">Log in to your account to view the full post and interact with it.</p>
      <p style="font-size: 13px; color: #8b949e; text-align:center;">&copy; ${new Date().getFullYear()} SocialApp Team</p>
    </div>
  `,
};
