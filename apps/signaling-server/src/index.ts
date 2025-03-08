// packages/signaling-server/src/index.ts
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createLogger, format, transports } from "winston";
import { SERVER_CONFIG, SECURITY_CONFIG, LOGGING_CONFIG } from "../config";

// Set up logger
const logger = createLogger({
  level: LOGGING_CONFIG.LEVEL,
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    ...(LOGGING_CONFIG.FILE_LOGGING ? 
      [new transports.File({ filename: LOGGING_CONFIG.LOG_FILE_PATH })] : 
      [])
  ]
});

// Initialize Express app
const app = express();

// Apply security middleware
app.use(cors({
  origin: SERVER_CONFIG.CORS_ORIGIN,
  methods: SERVER_CONFIG.CORS_METHODS
}));
app.use(helmet());

// Apply rate limiting
if (SECURITY_CONFIG.RATE_LIMIT_MAX > 0) {
  app.use(rateLimit({
    windowMs: SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS, 
    max: SECURITY_CONFIG.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  }));
}

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: SERVER_CONFIG.CORS_ORIGIN,
    methods: SERVER_CONFIG.CORS_METHODS
  }
});

// Store connected clients
const clients = new Map();
let connectionCount = 0;

// Set up Socket.IO connection handling
io.on("connection", (socket) => {
  // Check if max connections reached
  if (connectionCount >= SECURITY_CONFIG.MAX_CONNECTIONS) {
    logger.warn(`Max connections limit reached (${SECURITY_CONFIG.MAX_CONNECTIONS}). Rejecting new connection.`);
    socket.disconnect(true);
    return;
  }
  
  connectionCount++;
  logger.info(`Client connected: ${socket.id}, Total connections: ${connectionCount}`);

  // Register client
  socket.on("register", (data) => {
    try {
      const { clientId, role } = data;
      
      if (!clientId || !role) {
        logger.warn(`Invalid registration data from ${socket.id}`);
        return;
      }
      
      clients.set(clientId, { socket, role });
      logger.info(`Client ${clientId} registered as ${role}`);
      socket.emit("registered", { success: true });
      
      // Notify hosts when new clients join
      if (role === "client") {
        for (const [id, client] of clients.entries()) {
          if (client.role === "host") {
            client.socket.emit("client-joined", { clientId });
          }
        }
      }
      
      // Notify clients when hosts are available
      if (role === "host") {
        for (const [id, client] of clients.entries()) {
          if (client.role === "client") {
            client.socket.emit("host-available", { hostId: clientId });
          }
        }
      }
    } catch (error) {
      logger.error(`Error during client registration: ${error}`);
      socket.emit("error", { message: "Registration failed" });
    }
  });

  // Handle signaling
  socket.on("offer", (data) => {
    try {
      const { to, from, offer } = data;
      
      if (!to || !from || !offer) {
        logger.warn(`Invalid offer data from ${from}`);
        return;
      }
      
      const target = clients.get(to);
      if (target) {
        logger.debug(`Forwarding offer from ${from} to ${to}`);
        target.socket.emit("offer", { from, offer });
      } else {
        logger.warn(`Target client ${to} not found for offer from ${from}`);
        socket.emit("error", { message: "Target client not found", code: "TARGET_NOT_FOUND" });
      }
    } catch (error) {
      logger.error(`Error handling offer: ${error}`);
    }
  });

  socket.on("answer", (data) => {
    try {
      const { to, from, answer } = data;
      
      if (!to || !from || !answer) {
        logger.warn(`Invalid answer data from ${from}`);
        return;
      }
      
      const target = clients.get(to);
      if (target) {
        logger.debug(`Forwarding answer from ${from} to ${to}`);
        target.socket.emit("answer", { from, answer });
      } else {
        logger.warn(`Target client ${to} not found for answer from ${from}`);
      }
    } catch (error) {
      logger.error(`Error handling answer: ${error}`);
    }
  });

  socket.on("ice-candidate", (data) => {
    try {
      const { to, from, candidate } = data;
      
      if (!to || !from || !candidate) {
        logger.warn(`Invalid ICE candidate data from ${from}`);
        return;
      }
      
      const target = clients.get(to);
      if (target) {
        logger.debug(`Forwarding ICE candidate from ${from} to ${to}`);
        target.socket.emit("ice-candidate", { from, candidate });
      }
    } catch (error) {
      logger.error(`Error handling ICE candidate: ${error}`);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    connectionCount--;
    logger.info(`Client disconnected: ${socket.id}, Total connections: ${connectionCount}`);
    let disconnectedId = null;
    
    // Find and remove the disconnected client
    for (const [id, client] of clients.entries()) {
      if (client.socket.id === socket.id) {
        disconnectedId = id;
        const role = client.role;
        clients.delete(id);
        
        // Notify other clients about disconnection
        for (const [peerId, peerClient] of clients.entries()) {
          if (role === "host") {
            if (peerClient.role === "client") {
              peerClient.socket.emit("host-disconnected", { hostId: id });
            }
          } else if (role === "client") {
            if (peerClient.role === "host") {
              peerClient.socket.emit("client-disconnected", { clientId: id });
            }
          }
        }
        break;
      }
    }
  });
});

// Define API routes
app.get("/", (req, res) => {
  res.send("WebRTC Signaling Server");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    connections: connectionCount,
    uptime: process.uptime(),
    environment: SERVER_CONFIG.NODE_ENV
  });
});

app.get("/stats", (req, res) => {
  // Only allow in non-production environments or with proper auth
  if (SERVER_CONFIG.NODE_ENV === "production" && SECURITY_CONFIG.AUTH_ENABLED) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const hosts = [];
  const clientsArr = [];
  
  for (const [id, client] of clients.entries()) {
    if (client.role === "host") {
      hosts.push(id);
    } else if (client.role === "client") {
      clientsArr.push(id);
    }
  }
  
  res.json({
    totalConnections: connectionCount,
    hosts: {
      count: hosts.length,
      ids: hosts
    },
    clients: {
      count: clientsArr.length,
      ids: clientsArr
    }
  });
});

// Start the server
server.listen(SERVER_CONFIG.PORT, SERVER_CONFIG.HOST, () => {
  logger.info(`Signaling server running on ${SERVER_CONFIG.HOST}:${SERVER_CONFIG.PORT}`);
  logger.info(`Environment: ${SERVER_CONFIG.NODE_ENV}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

// Export server for testing purposes
export { app, server, io };