import mongoose from 'mongoose';
import { ENV } from './env.js';

export const connectDB = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log('Connected to DataBase successfully.');
  } catch (error) {
    console.log('Error connecting to DataBase');
    process.exit(1);
  }
};
