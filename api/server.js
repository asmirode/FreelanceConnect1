import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRoute from './routes/user.route.js';
import gigRoute from './routes/gig.route.js';
import reviewRoute from './routes/review.route.js';
import orderRoute from './routes/order.route.js';
import conversationRoute from './routes/conversation.route.js';
import messageRoute from './routes/message.route.js';
import authRoute from './routes/auth.route.js';
import chatRoute from './routes/chat.route.js';
import aiRoute from './routes/ai.route.js';
import cookieParser from "cookie-parser";
import cors from 'cors';
import { ensureIndexes } from './utils/ensureIndexes.js';

// Suppress deprecation warnings from dependencies
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  // Only suppress the specific util._extend deprecation warning
  if (warning.name === 'DeprecationWarning' && warning.message.includes('util._extend')) {
    return; // Suppress this specific warning
  }
  // Log other warnings normally
  console.warn(warning.name, warning.message);
});

const app = express();
dotenv.config();
mongoose.set('strictQuery', true);
const connect = async () => {
  try {
    if(!process.env.MONGO){
      throw new Error('MONGO connection string is not set in environment variables (process.env.MONGO)');
    }
    await mongoose.connect(process.env.MONGO, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // keep the default bufferCommands:true so mongoose queues operations until connected
    });
    console.log('database connected');
    // Ensure all required indexes exist (for AI matching $text search, etc.)
    await ensureIndexes();
  } catch (error) {
    console.error(error);
    // Rethrow so caller knows connect failed and server won't start
    throw error;
  }
};
//middleware
// Frontend origin(s) for CORS. Allow configuration via CLIENT_URL env var. Default to Vite's dev port.
const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'];
app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin (like mobile apps or curl)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) !== -1){
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Origin not allowed'));
  },
  credentials:true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth/', authRoute);
app.use('/api/users', userRoute);
app.use('/api/gigs', gigRoute);
app.use('/api/reviews', reviewRoute);
app.use('/api/orders', orderRoute);
app.use('/api/conversations', conversationRoute);
app.use('/api/messages', messageRoute);
app.use('/api/chat', chatRoute);
app.use('/api/ai', aiRoute);


// Global error handler
app.use((err, req, res, next) => {
  const errorStatus = err.status || 500
  const errorMessage = err.message || "Something went wrong"

  return res.status(errorStatus).send(errorMessage);
})
// Start server only after successful DB connection to avoid buffering/timeouts
const startServer = async () => {
  try {
    await connect();
    // Attach mongoose connection event listeners for better diagnostics
    mongoose.connection.on('connected', () => console.log('Mongoose connection: connected'));
    mongoose.connection.on('error', (err) => console.error('Mongoose connection error:', err));
    mongoose.connection.on('disconnected', () => console.warn('Mongoose connection: disconnected'));

    // Default to port 8000 to avoid conflicts with the frontend dev server (often on 3000)
    const port = process.env.PORT || 8000; 
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server due to DB connection error:', err);
    process.exit(1);
  }
};

startServer();