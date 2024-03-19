const Post = require("../models/Post");
const User = require("../models/User");
const { error, success } = require("../utils/responseWrapper");

const followOrUnFollowUserController = async (req, res) => {
  try {
    const { userIdToFollow } = req.body;
    const curUserId = req._id;
    const curUser = await User.findById(curUserId);

    const userToFollow = await User.findById(userIdToFollow);

    if (userIdToFollow === curUserId) {
      return res.send(error(409, "User cannot follow themselves"));
    }

    if (!userToFollow) {
      return res.send(error(404, "User to follow not found"));
    }

    if (curUser.followings.includes(userIdToFollow)) {
      // ALready follow
      const followingIndex = curUser.followings.indexOf(userIdToFollow);
      curUser.followings.splice(followingIndex, 1);
      await curUser.save();

      const followerIndex = userToFollow.followers.indexOf(curUserId);
      userToFollow.followers.slice(followerIndex, 1);
      await userToFollow.save();

      return res.send(success(200, "User Unfollowed"));
    } else {
      curUser.followings.push(userIdToFollow);
      await curUser.save();

      userToFollow.followers.push(curUserId);
      await userToFollow.save();

      return res.send(success(200, "User Followed"));
    }
  } catch (e) {
    console.log(e);
    return res.send(error(500, e.message));
  }
};

const getPostsOfFollowing = async (req, res) => {
  try {
    const curUserId = req._id;
    const curUser = await User.findById(curUserId);

    const posts = await Post.find({
      owner: {
        $in: curUser.followings,
      },
    });

    return res.send(success(200, { posts }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

const getMyPostsController = async (req, res) => {
  const userId = req._id;
  const curUser = await User.findById(userId);

  try {
    if (curUser.posts.length) {
      const posts = await Post.find({
        owner: userId,
      }).populate("likes");

      return res.send(success(200, { posts }));
    } else {
      return res.send(error(500, "User POst Not Found"));
    }
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

const getUserPostController = async (req, res) => {
  try {
    const { userId } = req.body;
    const curUserId = req._id;

    // const curUser = await User.findById(curUserId);
    const user = await User.findById(userId);

    if (user.posts.length) {
      const posts = await Post.find({
        owner: userId,
      }).populate("likes");
      return res.send(success(200, posts));
    } else {
      return res.send(error(500, "User Post Not Found"));
    }
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

const deleteUserProfileController = async (req, res) => {
  try {
    const userId = req._id;

    const curUser = await User.findById(userId);

    await Post.deleteMany({
      owner: userId,
    });

    //   Now deleting Myself in others following list
    curUser.followers.forEach(async (followersId) => {
      const follows = await User.findById(followersId);
      const index = follows.followings.indexOf(userId);
      follows.followings.splice(index, 1);
      await follows.save();
    });

    // Now deleting Myself in others followers list
    curUser.followings.forEach(async (follwingsId) => {
      const following = await User.findById(follwingsId);
      const index = following.followers.indexOf(userId);
      following.followers.splice(index, 1);
      await following.save();
    });

    // remove Myself from all Likes
    const allPost = await Post.find();

    allPost.forEach(async (post) => {
      const index = post.likes.indexOf(userId);
      post.likes.splice(index, 1);
      await post.save();
    });

    await curUser.remove();

    res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
    });

    return res.send(success(200, "User deleted successfully"));
  } catch (e) {
    console.log(e);
    return res.send(error(500, e.message));
  }
};

module.exports = {
  followOrUnFollowUserController,
  getPostsOfFollowing,
  getMyPostsController,
  getUserPostController,
  deleteUserProfileController,

  // deleteMyProfile
};
