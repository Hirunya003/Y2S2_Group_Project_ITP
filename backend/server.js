import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js"; 
import inventoryRoutes from "./routes/inventoryRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5555;
const mongoDBURL = process.env.MONGODB_URL;

// Middleware for parsing request body
app.use(express.json());

// Middleware for handling CORS POLICY
app.use(cors());

// Routes
app.get('/', (request, response) => {
  return response.status(200).send('Welcome To Supermarket API');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/", supplierRoutes);

// Enhanced error handling
mongoose
  .connect(mongoDBURL)
  .then(() => {
    console.log('App connected to database');
    app.listen(PORT, () => {
      console.log(`App is listening to port: ${PORT}`);
      console.log(`Server URL: http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.log('Failed to connect to the database. Server will not start.');
    console.error('Error details:', error);
  });
