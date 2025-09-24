import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import PostServise from "./post.servise";
import { cloudFileupload, fileValidation } from "../../utils/multer/clooud.multer";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./post.valiadation"
import { commentRouter } from "../comment";

 export const router = Router()
 router.use("/:postId/comment", commentRouter)
 
router.get("/all",
  authenticate,
  PostServise.getAllPosts);

router.get(
  "/user/:userId",
  authenticate,
  validation(validators.getAllUserPosts),
  PostServise.getAllUserPosts
);



router.post("/",
  authenticate,
  cloudFileupload({Validation:fileValidation.image}).array("attachments",2),
  validation(validators.creatPost),PostServise.createPost)


router.patch(
  "/:postId/update-post",
  authenticate,
  cloudFileupload({ Validation: fileValidation.image }).array("attachments", 2),
  validation(validators.updatePost),
  PostServise.updatepost
)


router.patch(
    "/:postId/like",
     authenticate,
     validation(validators.likepost),PostServise.likepost)

// Freeze Post
router.patch(
  "/:postId/freeze",
  authenticate,
  validation(validators.freezePost),
  PostServise.freezePost
);

// Restore Post
router.patch(
  "/:postId/restore",
  authenticate,
  validation(validators.restorePost),
  PostServise.restorePost
);

// Get Post by Id
router.get(
  "/:postId",
  authenticate,
  validation(validators.getPostById),
  PostServise.getPostById
);

// Hard Delete Post
router.delete(
  "/:postId/hard-delete",
  authenticate,
  validation(validators.hardDeletePost),
  PostServise.hardDeletePost
);



 export default router;