const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// CORS configuration - allow all origins for production flexibility
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.) or any origin in production
    if (!origin || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      // Allow all origins in production for maximum compatibility
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/tests', require('./routes/testRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
      console.log('✅ Admin account created automatically');
      console.log('   Email: wakoumer4@gmail.com');
      console.log('   Password: Umer@123456');
    } else {
      console.log('✅ Admin account already exists');
    }
  } catch (error) {
    console.log('⚠️ Could not auto-seed admin (DB may not be ready yet)');
  }
};

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  // Wait a moment for DB connection to fully establish, then seed admin
  setTimeout(seedAdmin, 2000);
});
