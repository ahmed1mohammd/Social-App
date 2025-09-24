import authService from './auth.service'
import { Router } from "express";
import * as validators from './auth.validation'
import { validation } from '../../middleware/validation.middleware';
import { authenticate } from "../../middleware/auth.middleware";


const router = Router()

router.post("/signup", validation(validators.signup), authService.signup);
router.post("/verify-otp", validation(validators.verifyOtp), authService.verifyOtp);
router.post("/refresh-token", validation(validators.refreshToken), authService.refresh);
router.post("/logout", validation(validators.logout), authService.logout);
router.post("/google-signup", validation(validators.googleSignup), authService.googleSignup);
router.post("/google-login", validation(validators.googleLogin), authService.googleLogin);
router.post("/forgot-password", validation(validators.forgotPassword), authService.forgotPassword);
router.post("/reset-password", validation(validators.resetPassword), authService.resetPassword);
router.post("/resend-otp", validation(validators.resendOtp), authService.resendOtp);
router.post("/update-email-request",authenticate, validation(validators.updateEmailRequest), authService.updateEmailRequest);
router.post("/confirm-update-email", authenticate, validation(validators.confirmUpdateEmail), authService.confirmUpdateEmail);
router.post("/request-2fa",authenticate ,validation(validators.requestEnable2FA),authService.requestEnable2FA);
router.post("/verify-2fa",authenticate,validation(validators.verifyEnable2FA),authService.verifyEnable2FA);
router.post("/login-2fa",validation(validators.loginWith2FA),authService.loginWith2FA);
router.post("/verify-login-otp",validation(validators.verifyLoginOtp),authService.verifyLoginOtp);


export default router