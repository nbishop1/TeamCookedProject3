const express = require("express");

// router is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /record.
const router = express.Router();

// This will help us connect to the database
const dbo = require("../db/conn");

// This helps convert the id from string to ObjectId for the _id.
const ObjectId = require("mongodb").ObjectId;

// Middleware: require session
function requireSession(req, res, next) {
  if (!req.session.userId) {
    return res.status(400).json({ error: "session not set yet" });
  }
  next();
}

router.get("/hangman/scores", requireSession, async (req, res) => {
  const db_connect = dbo.getDb();
  const scores = await db_connect.collection("hangmanScores").find({}).toArray();
  res.json(scores);
});

module.exports = router;