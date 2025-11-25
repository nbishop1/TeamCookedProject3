import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

export default function HighScores() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>High Scores</h1>
      <p>Display the scores here!</p>
    </div>
  );
}