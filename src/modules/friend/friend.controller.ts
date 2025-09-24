import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as validators from "./friend.validation";
import { validation } from "../../middleware/validation.middleware";
import {friendService} from "./friend.service";

const router = Router();

router.post(
  "/send",
  authenticate,
  validation(validators.sendRequestValidation),
  friendService.sendRequest
);

router.post(
  "/accept",
  authenticate,
  validation(validators.acceptRequestValidation),
  friendService.acceptRequest
);

router.post(
  "/reject",
  authenticate,
  validation(validators.rejectRequestValidation),
  friendService.rejectRequest
);

router.post(
  "/block",
  authenticate,
  validation(validators.blockUserValidation),
  friendService.blockUser
);

router.get(
  "/list",
  authenticate,
  friendService.getFriends
);

export default router;
