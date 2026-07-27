import 'dotenv/config';
import connectDB from './config/db.js';
import app from './app.js';

const port = process.env.PORT || 5000;

async function startServer() {
  // Let the DB connector decide how to connect (real URI or in-memory fallback)
  await connectDB();

  app.listen(port, () => {
    console.log(`MedRemind backend running on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start backend:', error.message);
  process.exit(1);
});
