const express = require('express');
const { createServer } = require('http'); // Needed for Socket.IO
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const { Server } = require("socket.io");

require("dotenv").config({ path: "./config.env" });

const app = express();
const port = process.env.PORT || 3001;

// Create HTTP server from Express app
const server = createServer(app);

// CORS & JSON middleware
app.use(cors({
    origin: "http://localhost:3000",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Session middleware
const sessionMiddleware = session({
    secret: 'keyboard cat',
    saveUninitialized: false,
    resave: false,
    store: MongoStore.create({ mongoUrl: process.env.ATLAS_URI })
});
app.use(sessionMiddleware);

// Import your DB connection
const dbo = require("./db/conn");

// Routes
app.use(require("./routes/session"));
app.use(require("./routes/hangman"));

app.get("/", (req, res) => {
    res.send("Hello, World");
});

// ----- SOCKET.IO SETUP -----  Used Google and Chatgpt to help build this connection to socket.io
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Wrap express-session so Socket.IO can use it
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Example: listen for a "chat" message from client
    socket.on('chatMessage', (msg) => {
        console.log('Message from client:', msg);

        // You can access session data
        const session = socket.request.session;
        console.log('Session ID:', session.id);

        // Broadcast message to all clients
        io.emit('chatMessage', msg);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start server and connect to MongoDB
server.listen(port, () => {
    dbo.connectToServer((err) => {
        if (err) console.error(err);
    });
    console.log(`Server is running on port ${port}`);
});