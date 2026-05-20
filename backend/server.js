require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Initialize Express App
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
// Auth Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/tasks', require('./routes/tasks'));
// MongoDB Atlas Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB Atlas!'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Syntrix Labs API is running.' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});