import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';

import userRoutes from './routes/user.route.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.use('/api/users', userRoutes);

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
