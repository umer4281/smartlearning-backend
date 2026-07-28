const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

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

// Dynamic CORS - allow any origin in development for mobile testing
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

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
app.use('/api/quran', require('./routes/quranRoutes'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io for Video/Audio calls and real-time features
const users = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join room (for classroom)
  socket.on('join-room', ({ roomId, userId, userName }) => {
    socket.join(roomId);
    users[socket.id] = { userId, userName, roomId };
    
    // Notify others in the room
    socket.to(roomId).emit('user-joined', { userId, userName, socketId: socket.id });
    
    // Send current users list to the new user
    const roomUsers = Object.values(users).filter(u => u.roomId === roomId);
    socket.emit('room-users', roomUsers);
  });

  // Handle WebRTC signaling for video/audio calls
  socket.on('offer', ({ offer, to }) => {
    socket.to(to).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ answer, to }) => {
    socket.to(to).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ candidate, to }) => {
    socket.to(to).emit('ice-candidate', { candidate, from: socket.id });
  });

  // Toggle audio/video
  socket.on('toggle-audio', ({ roomId, enabled }) => {
    socket.to(roomId).emit('audio-toggled', { userId: users[socket.id]?.userId, enabled });
  });

  socket.on('toggle-video', ({ roomId, enabled }) => {
    socket.to(roomId).emit('video-toggled', { userId: users[socket.id]?.userId, enabled });
  });

  // Chat messages
  socket.on('send-message', ({ roomId, message }) => {
    const user = users[socket.id];
    if (user) {
      io.to(roomId).emit('receive-message', {
        userId: user.userId,
        userName: user.userName,
        message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Handle manual leave room
  socket.on('leave-room', ({ roomId }) => {
    const user = users[socket.id];
    if (user) {
      socket.to(roomId).emit('user-left', { userId: user.userId, userName: user.userName });
      socket.leave(roomId);
      delete users[socket.id];
      console.log(`${user.userName} left room ${roomId}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      socket.to(user.roomId).emit('user-left', { userId: user.userId, userName: user.userName });
      delete users[socket.id];
      console.log(`${user.userName} disconnected from room ${user.roomId}`);
    } else {
      console.log('Client disconnected:', socket.id);
    }
  });
});

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

server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  // Wait a moment for DB connection to fully establish, then seed admin
  setTimeout(seedAdmin, 2000);
});
