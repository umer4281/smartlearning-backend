const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs2 = require('fs');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// CORS configuration - allow all origins
const corsOptions = {
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs2.existsSync(uploadsDir)) {
  fs2.mkdirSync(uploadsDir, { recursive: true });
}

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGO_URI ? 'Set' : 'Not Set',
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/tests', require('./routes/testRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Auto-seed admin user on startup
const seedAdmin = async () => {
  try {
    const User = require('./models/User');
    const existingAdmin = await User.findOne({ email: 'wakoumer4@gmail.com' });
    if (!existingAdmin) {
      await User.create({
        name: 'Admin',
        email: 'wakoumer4@gmail.com',
        password: 'Umer@123456',
        role: 'admin',
      });
      console.log('Admin account created automatically');
    } else {
      console.log('Admin account already exists');
    }
  } catch (error) {
    console.log('Could not auto-seed admin:', error.message);
  }
};

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log('Server running on port ' + PORT);
  console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
  console.log('MongoDB URI: ' + (process.env.MONGO_URI ? 'Configured' : 'NOT SET'));
  setTimeout(seedAdmin, 2000);
});
