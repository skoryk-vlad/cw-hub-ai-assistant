import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from './config/index.js';
import { createApp } from './app.js';

/**
 * Entry point: Connect to MongoDB and start server
 */
async function main() {
  try {
    // Connect to MongoDB
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    // Create and start Express app
    const app = createApp();
    app.listen(config.port, () => {
      console.log(`Chat server running on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
