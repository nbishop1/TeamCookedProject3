import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

export default function Game() {
  const navigate = useNavigate();
  const [blanks, setBlanks] = useState([]);
  const [guess, setGuess] = useState("");
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [maxAttempts, setMaxAttempts] = useState(6);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [isPlayer2, setIsPlayer2] = useState(false);

  useEffect(() => {
    socket.emit("whoAmI");
    socket.on("youAre", (data) => setIsPlayer2(data.player === 2));

    socket.on("startGame", ({ wordLength }) => {
      setBlanks(Array(wordLength).fill("_"));
      setGuessedLetters([]);
      setWrongAttempts(0);
      setMaxAttempts(6);
    });

    socket.on("letterResult", ({ letter, correct, currentWord }) => {
      if (correct) {
        setBlanks(currentWord);
      } else {
        setWrongAttempts((prev) => prev + 1);
      }
      setGuessedLetters((prev) => [...prev, letter]);
      console.log(wrongAttempts, maxAttempts, isPlayer2, blanks);
    });

    socket.on("endgame", ({ gameWon }) => {
      console.log("next game", gameWon);
      navigate("/selectWord");
    });

    socket.on("showHighScores", () => navigate("/highScores"));

    return () => {
      socket.off("youAre");
      socket.off("startGame");
      socket.off("letterResult");
      socket.off("showHighScores");
    };
  }, [navigate, isPlayer2]);

  const submitGuess = () => {
    const letter = guess.trim().toLowerCase();
    console.log("Trying to guess:", letter, "isPlayer2:", isPlayer2);
    if (!letter || guessedLetters.includes(letter) || !isPlayer2) return;
    socket.emit("guessLetter", letter);
    setGuess("");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Hangman</h1>
      <p>{blanks.join("-")}</p>
      <p>
        Wrong attempts: {wrongAttempts} / {maxAttempts}
      </p>

      <input
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        maxLength={1}
        placeholder="Enter a letter"
        style={{ marginRight: "0.5rem" }}
        disabled={!isPlayer2}
      />
      <button onClick={submitGuess} disabled={!isPlayer2}>
        Guess
      </button>

      {!isPlayer2 && <p>You're watching Player 2 guess...</p>}
      <p>Guessed letters: {guessedLetters.join(", ")}</p>
    </div>
  );
}
