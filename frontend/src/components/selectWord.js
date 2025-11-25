import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

export default function SelectWord() {
  const navigate = useNavigate();
  const [isPlayer1, setIsPlayer1] = useState(false);
  const [word, setWord] = useState("");

  useEffect(() => {
    socket.emit("whoAmI");

    socket.on("youAre", (data) => setIsPlayer1(data.player === 1));
    socket.on("startGame", () => navigate("/game"));

    return () => {
      socket.off("youAre");
      socket.off("startGame");
    };
  }, [navigate]);

  const submitWord = () => {
    if (!word.trim()) return;
    socket.emit("submitWord", word);
  };

  if (!isPlayer1) return <h2>Waiting for Player 1 to choose a word...</h2>;

  return (
    <div>
      <h1>Player 1: Choose a Word</h1>
      <input
        value={word}
        onChange={(e) => setWord(e.target.value)}
        placeholder="Enter secret word"
      />
      <button onClick={submitWord}>Submit Word</button>
    </div>
  );
}
