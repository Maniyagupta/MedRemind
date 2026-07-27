import 'dotenv/config';
import mongoose from 'mongoose';

// Try to use provided MONGODB_URI. If not present and running in development,
// use an in-memory MongoDB instance so the app can start for local testing.
const connectDB = async () => {
	try {
		let mongoUri = process.env.MONGODB_URI;

		if (!mongoUri) {
			// No explicit MongoDB URI provided — use in-memory server for local runs.
			const { MongoMemoryServer } = await import('mongodb-memory-server');
			const mongod = await MongoMemoryServer.create();
			mongoUri = mongod.getUri();
			console.log('No MONGODB_URI provided — using in-memory MongoDB at', mongoUri);
		}

		await mongoose.connect(mongoUri, {
			// recommended options are defaults in mongoose v6+, keep for clarity
			autoIndex: true,
		});

		console.log('Database connected successfully');
	} catch (error) {
		console.error('Database connection failed:', error.message);
		process.exit(1);
	}
};

export default connectDB;