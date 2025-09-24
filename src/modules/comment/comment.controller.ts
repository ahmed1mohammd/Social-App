import { Router } from "express"
import { authenticate } from "../../middleware/auth.middleware";
import { cloudFileupload, fileValidation } from "../../utils/multer/clooud.multer";
import commentService from "./comment.service";
import * as validators from './comment.validation'
import { validation } from "../../middleware/validation.middleware";

const router = Router({ mergeParams: true });

router.post("/", 
authenticate,
cloudFileupload({Validation:fileValidation.image}).array("attachments",1),
validation(validators.createComment),
commentService.createComment)

router.post("/:commentId/reply", 
authenticate,
cloudFileupload({Validation:fileValidation.image}).array("attachments",1),
validation(validators.replyComment),
commentService.replyComment)

router.put("/:commentId/freeze",
 authenticate,
 validation(validators.freezeComment),
commentService.freezeComment);

router.put("/:commentId/restore",
authenticate,
 validation(validators.restoreComment), 
 commentService.restoreComment);

router.delete("/:commentId",
authenticate, 
validation(validators.hardDeleteComment),
 commentService.hardDeleteComment);

router.get("/:commentId", 
authenticate, 
validation(validators.getCommentById), 
commentService.getCommentById);

router.get("/",
authenticate, 
validation(validators.getCommentsWithReplies), 
commentService.getCommentsWithReplies);


 export default router