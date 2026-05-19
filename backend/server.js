require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Initialize the Express app
const app = express();

// Middleware
app.use(cors()); // Allows your Next.js app to make requests here
app.use(express.json()); // Allows your server to parse JSON data sent from the frontend

// A simple test route to make sure the server is alive
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Syntrix Labs Backend is running smoothly!' });
});

// Define the port (defaults to 5000 if not specified in .env)
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});