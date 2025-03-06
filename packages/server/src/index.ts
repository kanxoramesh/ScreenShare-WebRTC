// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Your React app URL
        methods: ["GET", "POST"]
    }
});

// Track connected users
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle remote control registration
    socket.on('register', (userId) => {
        connectedUsers.set(userId, socket.id);
        console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    // Handle connection request
    socket.on('requestConnection', ({ from, to }) => {
        const targetSocket = connectedUsers.get(to);
        if (targetSocket) {
            io.to(targetSocket).emit('connectionRequest', { from });
        }
    });

    // Handle offer
    socket.on('offer', ({ offer, to }) => {
        const targetSocket = connectedUsers.get(to);
        if (targetSocket) {
            io.to(targetSocket).emit('offer', { offer, from: socket.id });
        }
    });

    // Handle answer
    socket.on('answer', ({ answer, to }) => {
        const targetSocket = connectedUsers.get(to);
        if (targetSocket) {
            io.to(targetSocket).emit('answer', { answer, from: socket.id });
        }
    });

    // Handle ICE candidates
    socket.on('iceCandidate', ({ candidate, to }) => {
        const targetSocket = connectedUsers.get(to);
        if (targetSocket) {
            io.to(targetSocket).emit('iceCandidate', { candidate, from: socket.id });
        }
    });

    // Handle device info
    socket.on('deviceInfo', ({ dimensions, to }) => {
        const targetSocket = connectedUsers.get(to);
        if (targetSocket) {
            io.to(targetSocket).emit('deviceInfo', dimensions);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        // Remove user from connected users
        connectedUsers.forEach((socketId, userId) => {
            if (socketId === socket.id) {
                connectedUsers.delete(userId);
            }
        });
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});