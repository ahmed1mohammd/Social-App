
import authService from './auth.service'
import { Router } from "express";
import * as validators from './auth.validation'
import { validation } from '../../middleware/validation.middleware';
const router = Router()

router.post("/signup", validation(validators.signup), authService.signup);
router.post("/verify-otp", validation(validators.verifyOtp), authService.verifyOtp);
router.post("/login", validation(validators.login), authService.login);
router.post("/refresh-token", validation(validators.refreshToken), authService.refresh);
router.post("/resend-otp", validation(validators.resendOtp), authService.resendOtp);

export default router