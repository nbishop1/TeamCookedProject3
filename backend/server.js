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

//List of words for Hangman
const testWord = [
    "Hangman",
    "Dog",
    "Cat",
    "Star wars",
];

// Get a word for Hangman
app.get("/getWord", (req, res) => {
    res.json({
        phrase: testWord,
        source: "database"
    });
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

let players = {}; // socket.id → name
let totalNamedPlayers = 0;

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Step 1 — ask for name
    socket.emit("requestName", "Please enter your name.");

    // Step 2 — user submits name
    socket.on("submitName", (playerName) => {
        if (!playerName) return;

        players[socket.id] = playerName;
        totalNamedPlayers++;

        console.log("Player joined:", playerName);

        // Notify user they must wait
        if (totalNamedPlayers < 2) {
            socket.emit("waiting", "Waiting for the other user to enter their name...");
        }

        // When both users have names — start chat
        if (totalNamedPlayers === 2) {
            const names = Object.values(players);

            io.emit("startChat", {
                message: `Chat ready! ${names[0]} and ${names[1]} are connected.`,
                players: names
            });
        }
    });

    // Step 3 — handle messages
    socket.on("chatMessage", (msg) => {
        if (totalNamedPlayers < 2) {
            socket.emit("errorMessage", "You must wait for both users to enter names.");
            return;
        }

        io.emit("chatMessage", {
            sender: players[socket.id],
            text: msg,
        });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

        if (players[socket.id]) {
            delete players[socket.id];
            totalNamedPlayers--;

            // Reset everything when someone leaves
            io.emit("reset", "A user disconnected. Reload to restart.");
        }
    });
});

// Start server and connect to MongoDB
server.listen(port, () => {
    dbo.connectToServer((err) => {
        if (err) console.error(err);
    });
    console.log(`Server is running on port ${port}`);
});