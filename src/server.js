import express from 'express';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';

const app = express();

const startServer = async () => {
  try {
    await connectDB();

    // listen for local development
    if (ENV.NODE_ENV !== 'production') {
      app.listen(ENV.PORT, () =>
        console.log('Server is up and running on PORT:', ENV.PORT)
      );
    }
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
