import { useEffect, useState } from "react";
import fetchWord from "./fetchWord";  // we'll create this next

export default function Hangman() {
  const [word, setWord] = useState("");         // the full word
  const [guessed, setGuessed] = useState([]);   // letters guessed
  const [lives, setLives] = useState(6);

  // Load a new word on first render
  useEffect(() => {
    async function load() {
      const newWord = await fetchWord();
      setWord(newWord.toLowerCase());
    }
    load();
  }, []);

  // The masked word: "_ p p l e"
  const display = word
    .split("")
    .map((ch) => (guessed.includes(ch) ? ch : "_"))
    .join(" ");

  // Handle user guess
  function guessLetter(letter) {
    if (guessed.includes(letter)) return;

    setGuessed((prev) => [...prev, letter]);

    if (!word.includes(letter)) {
      setLives((l) => l - 1);
    }
  }

  // Win or lose logic
  const isWin = word && word.split("").every((ch) => guessed.includes(ch));
  const isLose = lives <= 0;

  return (
    <div style={{ fontFamily: "Arial", padding: "2rem" }}>
      <h1>Hangman</h1>

      <h2>{display}</h2>
      <p>Lives left: {lives}</p>

      {isWin && <h2>🎉 You Win!</h2>}
      {isLose && <h2>💀 Game Over — Word was: {word}</h2>}

      {!isWin && !isLose && (
        <div style={{ marginTop: "1rem" }}>
          {"abcdefghijklmnopqrstuvwxyz".split("").map((letter) => (
            <button
              key={letter}
              onClick={() => guessLetter(letter)}
              disabled={guessed.includes(letter)}
              style={{
                margin: "3px",
                padding: "6px 8px",
                opacity: guessed.includes(letter) ? 0.4 : 1,
              }}
            >
              {letter}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
