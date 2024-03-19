const requireUser = require("../middlewares/requireUser");
const userController = require("../controllers/userController");

const router = require("express").Router();

router.post(
  "/follow",
  requireUser,
  userController.followOrUnFollowUserController
);

router.get("/getAllPost", requireUser, userController.getPostsOfFollowing);
router.get("/getMyPost", requireUser, userController.getMyPostsController);
router.get("/getUserPost", requireUser, userController.getUserPostController);

module.exports = router;
