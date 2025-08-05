import asyncHandler from 'express-async-handler';
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'User not found' });

  const notification = await Notification.find({ to: user._id })
    .sort({ createdAt: -1 })
    .populate('from', 'username profilePic')
    .populate('post', 'content image')
    .populate('comment', 'content');

  res.status(200).json({ notification });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const user = req.user;
  const { notificationId } = req.params;

  if (!user) return res.status(401).json({ message: 'User not found' });

  const notification = await Notification.findAndDelete({
    _id: notificationId,
    to: user._id,
  });
  if (!notification)
    return res.status(404).json({ message: 'Notification not found' });
  res.status(200).json({ message: 'Notification deleted successfully' });
});
