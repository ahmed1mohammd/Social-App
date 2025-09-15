import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import PostServise from "./post.servise";
import { cloudFileupload, fileValidation } from "../../utils/multer/clooud.multer";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./post.valiadation"

 export const router = Router()
 
router.post("/", authenticate,cloudFileupload({Validation:fileValidation.image}).array("attachments",2),validation(validators.creatPost), PostServise.createPost)

router.patch("/:postId/like", authenticate,validation(validators.likepost), PostServise.likepost)




 export default router;