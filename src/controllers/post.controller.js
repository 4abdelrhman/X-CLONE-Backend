import asyncHandler from 'express-async-handler';
import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import cloudinary from '../config/cloudinary.js';
import Notification from '../models/notification.model.js';

export const getPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .populate('user', 'firstName lastName userName email profilePic')
    .populate({
      path: 'comments',
      populate: {
        path: 'user',
        select: 'firstName lastName userName email profilePic',
      },
    });
  res.status(200).json({ posts });
});

const getPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findById(postId)
    .populate('user', 'firstName lastName userName email profilePic')
    .populate({
      path: 'comments',
      populate: {
        path: 'user',
        select: 'firstName lastName userName email profilePic',
      },
    });

  if (!post) return res.status(404).json({ message: 'Post not found' });

  res.status(200).json({ post });
});

export const getUserPosts = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  const user = await User.findOne({ userName });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const posts = await Post.find({ user: user._id })
    .sort({ createdAt: -1 })
    .populate('user', 'firstName lastName userName email profilePic')
    .populate({
      comments: {
        path: 'user',
        select: 'firstName lastName userName email profilePic',
      },
    });

  res.status(200).json({ posts: posts });
});

export const createPost = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { content } = req.body;
  const imageFile = req.file;

  if (!content && !imageFile)
    return res
      .status(400)
      .json({ message: 'Post must contain either text or image' });

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  let imageUrl = '';

  if (imageFile) {
    try {
      // convert buffer to base64 for cloudinary
      const base64Image = `data:${
        imageFile.mimetype
      };base64,${imageFile.buffer.toString('base64')}`;

      const uploadResponse = await cloudinary.uploader.upload(base64Image, {
        folder: 'social_media_posts',
        resource_type: 'image',
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto' },
          { format: 'auto' },
        ],
      });
      imageUrl = uploadResponse.secure_url;
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      return res.status(400).json({ error: 'Failed to upload image' });
    }
  }

  const post = await Post.create({
    user: user._id,
    content: content || '',
    image: imageUrl,
  });

  res.status(201).json({ post });
});

export const likePost = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { postId } = req.params;

  const user = await User.findById(userId);
  const post = await Post.findById(postId);

  if (!user || !post)
    return res.status(404).json({ message: 'User or Post not found' });

  const isLiked = post.likes.includes(userId);

  if (isLiked) {
    //Unlike the post
    await Post.findOneAndUpdate(postId, {
      $pull: { likes: userId },
    });
  } else {
    //Like the post
    await findOneAndUpdate(postId, {
      $push: { likes: userId },
    });
  }

  if (post.user.toString() !== userId.toString()) {
    await Notification.create({
      from: userId,
      to: post.user,
      type: 'Like',
      post: postId,
    });
  }

  res.status(200).json({
    message: isLiked ? 'Post unliked successfully' : 'Post liked successfully',
  });
});

export const deletePost = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { postId } = req.params;

  const user = await User.findById({ userId });
  const post = await Post.findById(postId);

  if (!user || !post)
    return res.status(404).json({ error: 'User or post not found' });

  if (post.user.toString() !== user._id.toString()) {
    return res
      .status(403)
      .json({ error: 'You can only delete your own posts' });
  }

  // delete all comments on this post
  await Comment.deleteMany({ post: postId });

  // delete the post
  await Post.findByIdAndDelete(postId);

  res.status(200).json({ message: 'Post deleted successfully' });
});
