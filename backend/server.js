require('dotenv').config({ quiet: true });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const authMiddleware = require('./middleware/authMiddleware');
const requireAdmin = require('./middleware/adminMiddleware');
const requireStaff = require('./middleware/staffMiddleware');
const sanitizeInput = require('./middleware/sanitizeInput');
const { apiLimiter } = require('./middleware/rateLimiters');

// Initialize Express App
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

const defaultClientUrls = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002'
];

const allowedOrigins = (process.env.CLIENT_URL || defaultClientUrls.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const mongoUri = (process.env.MONGO_URI || '').trim();

const isPlaceholderMongoUri = (uri) => (
  !uri ||
  uri.includes('cluster.example.mongodb.net') ||
  uri.includes('user:password')
);

const getDatabaseStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  return states[mongoose.connection.readyState] || 'unknown';
};

const requireDatabase = (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    success: false,
    message: 'Database is not connected. Set MONGO_URI in backend/.env and restart the server.',
    database: getDatabaseStatus()
  });
};

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(sanitizeInput);
app.use('/api', apiLimiter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Syntrix Labs API is running.',
    database: getDatabaseStatus()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    message: 'Syntrix Labs API is running.',
    database: getDatabaseStatus()
  });
});

// API Routes
app.use('/api/auth', requireDatabase, require('./routes/auth'));
app.use('/api/projects', requireDatabase, require('./routes/projects'));
app.use('/api/notifications', requireDatabase, require('./routes/notifications'));
app.use('/api/tasks', requireDatabase, require('./routes/tasks'));
app.use('/api/uploads', requireDatabase, require('./routes/uploads'));
app.use('/api/meetings', requireDatabase, require('./routes/meetings'));
app.use('/api/payments', requireDatabase, require('./routes/payments'));
app.use('/api/consultations', requireDatabase, require('./routes/consultations'));
app.use('/api/advertisements', requireDatabase, require('./routes/advertisements'));
app.use('/api/team', requireDatabase, require('./routes/team'));
app.use('/api/team-meetings', requireDatabase, require('./routes/teamMeetings'));

app.get('/api/admin/clients', requireDatabase, authMiddleware, requireStaff, async (req, res) => {
  const User = require('./models/User');
  const Project = require('./models/Project');
  const Payment = require('./models/Payment');
  const { isAdminEmail } = require('./utils/adminAccess');
  // Clients section lists genuine clients only — team members (role 'team')
  // and admins (email in ADMIN_EMAILS) belong to the Team area, not here.
  const allUsers = await User.find({ role: { $ne: 'team' } }).select('-password').sort({ createdAt: -1 });
  const clients = allUsers.filter((u) => !isAdminEmail(u.email));
  const results = await Promise.all(clients.map(async (client) => {
    const activeProjects = await Project.countDocuments({ client: client._id, status: { $ne: 'Completed' } });
    const pendingProjects = await Project.countDocuments({ client: client._id, status: { $in: ['Planning', 'Pending'] } });
    const upcomingPayments = await Payment.countDocuments({ client: client._id, status: { $ne: 'Paid' } });
    const projects = await Project.find({ client: client._id }).select('title status trackingStage dueDate').sort({ createdAt: -1 });
    return { ...client.toObject(), activeProjects, pendingProjects, upcomingPayments, projects };
  }));
  res.json(results);
});

app.put('/api/admin/clients/:id', requireDatabase, authMiddleware, requireAdmin, async (req, res) => {
  const User = require('./models/User');
  const allowed = ['name', 'email', 'phone', 'company'];
  const updates = {};
  allowed.forEach((field) => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'Client not found' });
  }
  res.json({ success: true, client: user });
});

app.delete('/api/admin/clients/:id', requireDatabase, authMiddleware, requireAdmin, async (req, res) => {
  const User = require('./models/User');
  const Project = require('./models/Project');
  const Payment = require('./models/Payment');
  const Meeting = require('./models/Meeting');
  const Consultation = require('./models/Consultation');
  const DocumentUpload = require('./models/DocumentUpload');
  const id = req.params.id;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Client not found' });
  }

  await Promise.all([
    Project.deleteMany({ client: id }),
    Payment.deleteMany({ client: id }),
    Meeting.deleteMany({ client: id }),
    Consultation.deleteMany({ client: id }),
    DocumentUpload.deleteMany({ client: id }),
    User.findByIdAndDelete(id)
  ]);

  res.json({ success: true });
});

app.get('/api/admin/summary', requireDatabase, authMiddleware, requireAdmin, async (req, res) => {
  const User = require('./models/User');
  const Project = require('./models/Project');
  const Payment = require('./models/Payment');
  const Meeting = require('./models/Meeting');
  const Consultation = require('./models/Consultation');
  const TeamMember = require('./models/TeamMember');

  const [
    totalClients,
    activeProjects,
    upcomingPayments,
    upcomingMeetings,
    consultationMessages,
    teamMembers
  ] = await Promise.all([
    User.countDocuments(),
    Project.countDocuments({ status: { $ne: 'Completed' } }),
    Payment.countDocuments({ status: { $ne: 'Paid' } }),
    Meeting.countDocuments({ status: 'Upcoming' }),
    Consultation.countDocuments(),
    TeamMember.countDocuments()
  ]);

  res.json({
    totalClients,
    activeProjects,
    upcomingPayments,
    upcomingMeetings,
    consultationMessages,
    teamMembers
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File is too large. Maximum upload size is 25 MB.'
    });
  }

  if (error?.message === 'Unsupported file type') {
    return res.status(400).json({
      success: false,
      message: 'Unsupported file type. Upload a PDF, image, document, spreadsheet, presentation, text file, or ZIP.'
    });
  }

  console.error('Unhandled API Error:', error);
  return res.status(500).json({
    success: false,
    message: 'Server error'
  });
});

async function connectDatabase() {
  if (isPlaceholderMongoUri(mongoUri)) {
    // In production, never auto-create a throwaway DB — require a real one.
    if (process.env.NODE_ENV === 'production') {
      console.warn('MongoDB is not configured. Set MONGO_URI to enable database features.');
      return;
    }

    // Dev convenience: spin up an ephemeral in-memory MongoDB so the app is
    // fully functional locally with zero setup. Data resets on restart.
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mem = await MongoMemoryServer.create();
      await mongoose.connect(mem.getUri());
      console.log('No MONGO_URI set — started an in-memory MongoDB for local dev.');
      console.log('Data is temporary and resets on restart. Set MONGO_URI in backend/.env for a persistent database.');
    } catch (error) {
      console.warn('Could not start in-memory MongoDB:', error.message);
      console.warn('Set MONGO_URI in backend/.env to enable database features.');
    }
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('Successfully connected to MongoDB.');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error('The API is still running, but database routes will return 503 until MONGO_URI is fixed.');
  }
}

// Start Server (only when run directly, not when imported by tests)
if (require.main === module) {
  const http = require('http');
  const { Server } = require('socket.io');
  const jwt = require('jsonwebtoken');
  const User = require('./models/User');
  const { isAdminEmail } = require('./utils/adminAccess');

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true }
  });

  // Authenticate each socket with the same JWT used for the REST API.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error('No auth token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.user && decoded.user.id;
      socket.data.userId = userId;
      try {
        const user = await User.findById(userId).select('email role');
        socket.data.isStaff = isAdminEmail(user && user.email) || (user && user.role === 'team');
      } catch {
        socket.data.isStaff = false;
      }
      return next();
    } catch (error) {
      return next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.data.userId) {
      socket.join(`user:${socket.data.userId}`); // a client's own consultation room
    }
    // Admins can join a specific client's room to watch that conversation live.
    socket.on('join', (clientId) => {
      if (socket.data.isStaff && clientId) {
        socket.join(`user:${clientId}`);
      }
    });
  });

  app.set('io', io); // so routes can emit (req.app.get('io'))

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  connectDatabase();
}

module.exports = { app, connectDatabase };
