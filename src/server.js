import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';

import userRoutes from './routes/user.route.js';
import postsRoutes from './routes/post.route.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.use('/api/users', userRoutes);
app.use('/api/posts', postsRoutes);

app.use((err, req, res) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const startServer = async () => {
  try {
    await connectDB();

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
