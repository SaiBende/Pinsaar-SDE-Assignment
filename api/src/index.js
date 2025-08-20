import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';
import path from 'path';


dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const PORT = process.env.API_PORT;


const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
