import userService from './user.service'
import { Router } from "express";
import { authenticate } from '../../middleware/auth.middleware';

const router = Router()

router.get("/profile", authenticate, userService.getProfile);

export default router
