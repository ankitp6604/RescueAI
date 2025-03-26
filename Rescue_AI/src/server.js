import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import facilityRoutes from './routes/facilityRoutes.js';
import dispatchRoutes from './routes/dispatchRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import { setupSocketHandlers } from './socket/socketHandlers.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Debug: Log the imported routes
console.log('Emergency Routes:', emergencyRoutes);

// API routes
app.use('/api/facilities', facilityRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/emergency', emergencyRoutes);

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io }; 