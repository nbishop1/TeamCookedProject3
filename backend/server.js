const express = require("express");
const { createServer } = require("http"); // Needed for Socket.IO
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
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Session middleware
const sessionMiddleware = session({
  secret: "keyboard cat",
  saveUninitialized: false,
  resave: false,
  store: MongoStore.create({ mongoUrl: process.env.ATLAS_URI }),
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
    credentials: true,
  },
});

// Wrap express-session so Socket.IO can use it
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

let players = {
  player1: null, // socket.id
  player2: null, // socket.id
};

let names = {}; // socket.id → name
let round = 0;
let secretWord = null;
let currentWord = [];
let wrongAttempts = 0;
let maxAttempts = 6;
let win = false;

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Assign players
  socket.on("submitName", (name) => {
    names[socket.id] = name;
    console.log("User connected:", name);

    if (!players.player1) players.player1 = socket.id;
    else if (!players.player2) players.player2 = socket.id;

    if (players.player1 && players.player2) {
      console.log("both users connected");
      io.emit("startSelectWord", {
        players: {
          p1: names[players.player1],
          p2: names[players.player2],
        },
      });
    } else {
      socket.emit("waiting", "Waiting for the other player...");
    }
  });

  // Who is who
  socket.on("whoAmI", () => {
    if (socket.id === players.player1) socket.emit("youAre", { player: 1 });
    else socket.emit("youAre", { player: 2 });
  });

  // Player 1 submits word
  socket.on("submitWord", (word) => {
    console.log("Word:", word);
    if (socket.id !== players.player1) return;
    secretWord = word.toLowerCase();
    currentWord = Array(secretWord.length).fill("_");
    console.log("Secret word submit:", secretWord);
    io.emit("startGame", { wordLength: secretWord.length });
  });

  // Player 2 guesses a letter
  socket.on("guessLetter", (letter) => {
    console.log(
      "Letter guessed:",
      letter,
      "Player2?",
      socket.id === players.player2
    );
    console.log("Secret word:", secretWord);
    if (socket.id !== players.player2) return;

    letter = letter.toLowerCase();
    let correct = false;

    for (let i = 0; i < secretWord.length; i++) {
      if (secretWord[i] === letter) {
        currentWord[i] = letter; // update server state
        correct = true;
      }
    }

    console.log(currentWord);
    if (!correct) {
      wrongAttempts++;
    }

    // Emit to both players
    io.to(players.player1).emit("letterResult", {
      letter,
      correct,
      currentWord,
    });
    io.to(players.player2).emit("letterResult", {
      letter,
      correct,
      currentWord,
    });

    // Check if game ended
    const gameWon = !currentWord.includes("_");
    const gameLost = wrongAttempts >= maxAttempts;

    if (gameWon || gameLost) {
      console.log("Game Ended");
      round++;

      if (round >= 2) {
        console.log("Rounds Ended");
        io.emit("showHighScores");
        // reset for next session
        secretWord = null;
        currentWord = [];
        wrongAttempts = 0;
        round = 0;
        return;
      }

      io.emit("endgame", { gameWon }); // emit to both players

      // Rotate players
      [players.player1, players.player2] = [players.player2, players.player1];
      secretWord = null;
      currentWord = [];
      wrongAttempts = 0;

      
    }
  });

  // Disconnect logic
  socket.on("disconnect", () => {
    if (players.player1 === socket.id || players.player2 === socket.id) {
      players = { player1: null, player2: null };
      names = {};
      secretWord = null;
      round = 0;
      console.log("User Disconnected:");
      io.emit("reset", "A player disconnected. Restarting game...");
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
