export const emailTemplates = {
  /** Email for OTP verification */
  verifyOtp: (otp: string, name: string) => `
    <div style="font-family: 'Poppins', Arial, sans-serif; background: #000; padding: 40px; border-radius: 20px; max-width: 520px; margin: auto; box-shadow: 0 12px 28px rgba(0,0,0,0.5);">
      <div style="background: #111; border-radius: 16px; padding: 25px; text-align: center; border: 2px solid #b91c1c;">
        <h2 style="color: #b91c1c; font-size: 28px; margin-bottom: 10px;">Verify Your Email</h2>
        <p style="font-size: 17px; color:#fff;">Hey <b>${name}</b> 👋</p>
        <p style="font-size: 16px; color:#ddd;">Use this OTP to verify your email. It expires in <b>2 minutes</b>!</p>
        <div style="background: rgba(185,28,28,0.15); padding: 20px; border-radius: 12px; margin: 25px 0;">
          <h1 style="letter-spacing: 6px; color:#b91c1c; font-size: 32px; font-weight: bold;">${otp}</h1>
        </div>
        <p style="font-size: 14px; color: #aaa;">If you didn't request this, just ignore this email 😎</p>
      </div>
    </div>
  `,

  /** Welcome email after login */
  welcomeAfterLogin: (name: string) => `
    <div style="font-family: 'Poppins', Arial, sans-serif; background: #000; padding: 40px; border-radius: 20px; max-width: 520px; margin: auto; box-shadow: 0 12px 28px rgba(0,0,0,0.5);">
      <div style="background: #111; border-radius: 16px; padding: 25px; text-align: center; border: 2px solid #b91c1c;">
        <h2 style="color: #b91c1c; font-size: 28px; margin-bottom: 10px;">Welcome Back! 🎉</h2>
        <p style="font-size: 17px; color:#fff;">Hello <b>${name}</b>,</p>
        <p style="font-size: 16px; color:#ddd;">Great to see you again. Let's make today awesome!</p>
        <div style="background: rgba(185,28,28,0.15); padding: 20px; border-radius: 12px; margin: 25px 0;">
          <p style="color: #b91c1c; font-size: 18px; font-weight: 600;">Stay motivated, stay creative! ✨</p>
        </div>
        <p style="font-size: 14px; color: #aaa; text-align:center;">&copy; ${new Date().getFullYear()} SocialApp Team</p>
      </div>
    </div>
  `,

  /** Reset password OTP email */
  resetPasswordOtp: (otp: string, name: string) => `
    <div style="font-family: 'Poppins', Arial, sans-serif; background: #000; padding: 40px; border-radius: 20px; max-width: 520px; margin: auto; box-shadow: 0 12px 28px rgba(0,0,0,0.5);">
      <div style="background: #111; border-radius: 16px; padding: 25px; text-align: center; border: 2px solid #b91c1c;">
        <h2 style="color: #b91c1c; font-size: 28px; margin-bottom: 10px;">Reset Your Password 🔐</h2>
        <p style="font-size: 17px; color:#fff;">Hi <b>${name}</b>,</p>
        <p style="font-size: 16px; color:#ddd;">Use this OTP to reset your password (expires in <b>2 minutes</b>):</p>
        <div style="background: rgba(185,28,28,0.15); padding: 20px; border-radius: 12px; margin: 25px 0;">
          <h1 style="letter-spacing: 6px; color:#b91c1c; font-size: 32px; font-weight: bold;">${otp}</h1>
        </div>
        <p style="font-size: 14px; color: #aaa;">If you didn't request this, ignore this email 😌</p>
      </div>
    </div>
  `,

  /** New post tag notification */
  taggedInPost: (taggedUserName: string, authorName: string, content: string) => `
    <div style="font-family: 'Poppins', Arial, sans-serif; background: #000; padding: 40px; border-radius: 20px; max-width: 520px; margin: auto; box-shadow: 0 12px 28px rgba(0,0,0,0.5);">
      <div style="background: #111; border-radius: 16px; padding: 25px; text-align: center; border: 2px solid #b91c1c;">
        <h2 style="color: #b91c1c; font-size: 28px; margin-bottom: 10px;">You've Been Tagged! 📌</h2>
        <p style="font-size: 17px; color:#fff;">Hi <b>${taggedUserName}</b>,</p>
        <p style="font-size: 16px; color:#ddd;"><b>${authorName}</b> mentioned you in a new post:</p>
        <div style="background: rgba(185,28,28,0.15); padding: 20px; border-radius: 12px; margin: 25px 0;">
          <p style="color: #fff; font-size: 16px;">${content}</p>
        </div>
        <p style="font-size: 14px; color: #aaa;">Log in to view the post and interact 👍</p>
        <p style="font-size: 14px; color: #aaa; text-align:center;">&copy; ${new Date().getFullYear()} SocialApp Team</p>
      </div>
    </div>
  `,

  /** Like notification email */
  likeNotification: (likerName: string, postContent: string) => `
    <div style="font-family: 'Poppins', Arial, sans-serif; background: #000; padding: 40px; border-radius: 20px; max-width: 520px; margin: auto; box-shadow: 0 12px 28px rgba(0,0,0,0.5);">
      <div style="background: #111; border-radius: 16px; padding: 25px; text-align: center; border: 2px solid #b91c1c;">
        <h2 style="color: #b91c1c; font-size: 28px; margin-bottom: 10px;">Someone Liked Your Post! ❤️</h2>
        <p style="font-size: 17px; color:#fff;">Hey there,</p>
        <p style="font-size: 16px; color:#ddd;"><b>${likerName}</b> just liked your post:</p>
        <div style="background: rgba(185,28,28,0.15); padding: 20px; border-radius: 12px; margin: 25px 0; text-align: left;">
          <p style="color: #ddd; font-size: 16px; font-style: italic;">"${postContent.substring(0, 150)}${postContent.length > 150 ? '...' : ''}"</p>
        </div>
        <p style="font-size: 14px; color: #aaa;">Keep creating great content! 🌟</p>
      </div>
    </div>
  `,

  /** Enable 2FA OTP email */
  twoStepEnableOtp: (otp: string, name: string) => `
    <div style="font-family: 'Poppins', Arial, sans-serif; background: #000; padding: 40px; border-radius: 20px; max-width: 520px; margin: auto; box-shadow: 0 12px 28px rgba(0,0,0,0.5);">
      <div style="background: #111; border-radius: 16px; padding: 25px; text-align: center; border: 2px solid #b91c1c;">
        <h2 style="color: #b91c1c; font-size: 28px; margin-bottom: 10px;">Enable 2FA 🔒</h2>
        <p style="font-size: 17px; color:#fff;">Hi <b>${name}</b>,</p>
        <p style="font-size: 16px; color:#ddd;">Use this OTP to enable 2-Step Verification (valid for <b>2 minutes</b>):</p>
        <div style="background: rgba(185,28,28,0.15); padding: 20px; border-radius: 12px; margin: 25px 0;">
          <h1 style="letter-spacing: 6px; color:#b91c1c; font-size: 32px; font-weight: bold;">${otp}</h1>
        </div>
        <p style="font-size: 14px; color: #aaa;">Ignore this if you didn't request it 😉</p>
      </div>
    </div>
  `,

  /** Login OTP email (for 2FA) */
  twoStepLoginOtp: (otp: string, name: string) => `
    <div style="font-family: 'Poppins', Arial, sans-serif; background: #000; padding: 40px; border-radius: 20px; max-width: 520px; margin: auto; box-shadow: 0 12px 28px rgba(0,0,0,0.5);">
      <div style="background: #111; border-radius: 16px; padding: 25px; text-align: center; border: 2px solid #b91c1c;">
        <h2 style="color: #b91c1c; font-size: 28px; margin-bottom: 10px;">Login Verification 🔑</h2>
        <p style="font-size: 17px; color:#fff;">Hi <b>${name}</b>,</p>
        <p style="font-size: 16px; color:#ddd;">Use this OTP to complete your login (expires in <b>2 minutes</b>):</p>
        <div style="background: rgba(185,28,28,0.15); padding: 20px; border-radius: 12px; margin: 25px 0;">
          <h1 style="letter-spacing: 6px; color:#b91c1c; font-size: 32px; font-weight: bold;">${otp}</h1>
        </div>
        <p style="font-size: 14px; color: #aaa;">Ignore this if you didn't request it 😎</p>
      </div>
    </div>
  `,
};
