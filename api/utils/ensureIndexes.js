import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Gig from '../models/gig.model.js';

dotenv.config();

/**
 * Ensure all required indexes exist in MongoDB.
 * Call this once when the app starts or manually when needed.
 */
export async function ensureIndexes() {
  try {
    if (!process.env.MONGO) {
      throw new Error('MONGO connection string not found in .env');
    }

    // Connect to MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to MongoDB for index creation');
    }

    // Create text index on Gig collection
    await Gig.collection.createIndex({
      title: 'text',
      desc: 'text',
      features: 'text',
      cat: 'text',
      sortTitle: 'text',
      sortDesc: 'text',
    });
    console.log('✓ Text index created/verified on Gig collection');

    // List all indexes on Gig collection for verification
    const indexes = await Gig.collection.getIndexes();
    console.log('Indexes on Gig collection:', Object.keys(indexes));

    return true;
  } catch (err) {
    console.error('Error ensuring indexes:', err.message);
    throw err;
  }
}

// If run directly from command line
if (import.meta.url === `file://${process.argv[1]}`) {
  ensureIndexes()
    .then(() => {
      console.log('Index creation completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to ensure indexes:', err);
      process.exit(1);
    });
}
