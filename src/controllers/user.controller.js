import asyncHandler from 'express-async-handler';

import { ENV } from '../config/env.js';

import User from '../models/user.model.js';
import Notification from '../models/notification.model.js';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { clerkClient } from '@clerk/express';

export const signUp = asyncHandler(async (req, res) => {
  const { firstName, lastName, userName, email, password } = req.body;
  if (!firstName || !lastName || !userName || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const existUser = await User.findOne({ $or: [{ email }, { userName }] });
  if (existUser) return res.status(400).json({ message: 'User already exist' });

  const hashedPass = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    firstName,
    lastName,
    userName,
    email,
    password: hashedPass,
  });

  const token = jwt.sign({ id: newUser._id }, ENV.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.status(201).json({
    message: 'User created successfully',
    token,
    user: {
      id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      userName: newUser.userName,
      email: newUser.email,
    },
  });
});

export const logIn = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: 'Invalid email or password' });

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch)
    return res.status(400).json({ message: 'Invalid email or password' });

  const token = jwt.sign({ id: user._id }, ENV.JWT_SECRET, { expiresIn: '7d' });
  res.status(200).json({
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      userName: user.userName,
      email: user.email,
    },
  });
});

export const getUserProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  const user = await User.findOne({ userName });
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.status(200).json({ user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findOneAndUpdate(req.user._id, req.body, {
    new: true,
  });

  if (!user) return res.status(404).json({ error: 'User not found' });

  res.status(200).json({ user });
});

export const syncUser = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const existingUser = await User.findOne({ clerkId: userId });
  if (existingUser) {
    return res
      .status(200)
      .json({ user: existingUser, message: 'User already exists' });
  }

  // create new user from Clerk data
  const clerkUser = await clerkClient.users.getUser(userId);

  const userData = {
    clerkId: userId,
    email: clerkUser.emailAddresses[0].emailAddress,
    firstName: clerkUser.firstName || '',
    lastName: clerkUser.lastName || '',
    userName: clerkUser.emailAddresses[0].emailAddress.split('@')[0],
    profilePic: clerkUser.imageUrl || '',
  };

  const user = await User.create(userData);

  res.status(201).json({ user, message: 'User created successfully' });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const user = await User.findOne({ user: req.user });

  if (!user) return res.status(404).json({ error: 'User not found' });

  res.status(200).json({ user });
});

export const followUser = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const { targetUserId } = req.params;

  if (currentUser._id.toString() === targetUserId) {
    return res.status(400).json({ error: 'You cannot follow yourself' });
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const isFollowing = currentUser.following.includes(targetUserId);

  if (isFollowing) {
    await User.findByIdAndUpdate(currentUser._id, {
      $pull: { following: targetUserId },
    });
    await User.findByIdAndUpdate(targetUserId, {
      $pull: { followers: currentUser._id },
    });
  } else {
    await User.findByIdAndUpdate(currentUser._id, {
      $addToSet: { following: targetUserId },
    });
    await User.findByIdAndUpdate(targetUserId, {
      $addToSet: { followers: currentUser._id },
    });

    await Notification.create({
      from: currentUser._id,
      to: targetUserId,
      type: 'follow',
    });
  }

  res.status(200).json({
    message: isFollowing
      ? 'User unfollowed successfully'
      : 'User followed successfully',
  });
});
