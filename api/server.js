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
import skillRoute from './routes/skill.route.js';
import upskillRoute from './routes/upskilling.route.js';
import chatRoute from './routes/chat.route.js';
import cookieParser from "cookie-parser";
import cors from 'cors';

const app = express();
dotenv.config();
mongoose.set('strictQuery', true);

const connect = async () => {
  try {
    if (!process.env.MONGO) {
      console.error('\n❌ ERROR: MONGO environment variable is not set!');
      console.error('Please create a .env file in the /api directory with:');
      console.error('MONGO=your_mongodb_connection_string\n');
      console.error('Example: MONGO=mongodb://localhost:27017/freelanceconnect');
      console.error('Or for MongoDB Atlas: MONGO=mongodb+srv://username:password@cluster.mongodb.net/dbname\n');
      throw new Error('MONGO environment variable is not set');
    }
    
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGO, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      connectTimeoutMS: 10000, // Give up initial connection after 10s
    });
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('\n❌ Database connection failed!');
    if (error.name === 'MongoServerSelectionError') {
      console.error('Could not connect to MongoDB server. Please check:');
      console.error('1. Is MongoDB running? (if local)');
      console.error('2. Is your connection string correct?');
      console.error('3. Are your network/firewall settings correct?');
      console.error('4. If using MongoDB Atlas, is your IP whitelisted?');
    }
    console.error('Error details:', error.message);
    console.error('\nThe server will not start until the database connection is established.\n');
    throw error; // Re-throw to be caught by the outer catch
  }
};

//middleware
//frontend port number
app.use(cors({origin:"http://localhost:3000",credentials:true}));
app.use(express.json());
app.use(cookieParser());

// Middleware to check MongoDB connection state
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).send('Database connection not available');
  }
  next();
});

app.use('/api/auth/', authRoute);
app.use('/api/users', userRoute);
app.use('/api/gigs', gigRoute);
app.use('/api/reviews', reviewRoute);
app.use('/api/orders', orderRoute);
app.use('/api/conversations', conversationRoute);
app.use('/api/messages', messageRoute);
app.use('/api/skills', skillRoute);
app.use('/api/upskilling', upskillRoute);
app.use('/api/chat', chatRoute);

app.use((err, req, res, next) => {
  const errorStatus = err.status || 500
  const errorMessage = err.message || "Something went wrong"

  return res.status(errorStatus).send(errorMessage);
})

// Connect to database first, then start server
connect().then(() => {
  //backend port number
  app.listen(8000, () => {
    console.log('🚀 Server running on http://localhost:8000');
  });
}).catch((error) => {
  console.error('\n💥 Server startup failed due to database connection error.');
  console.error('Please fix the database connection issue and restart the server.');
  console.error('Nodemon will automatically restart when you fix the .env file.\n');
  process.exit(1); // Exit so nodemon knows to wait for file changes
});