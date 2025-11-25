import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

export default function SetName() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [hasName, setHasName] = useState(false);
  const [status, setStatus] = useState("Please Enter Your Name.");

  useEffect(() => {
    // Server asks user to provide a name
    socket.on("requestName", (msg) => setStatus(msg));

    // Waiting for the other player
    socket.on("waiting", (msg) => setStatus(msg));

    // Both players have submitted names → navigate to SelectWord
    socket.on("startSelectWord", () => {
      setHasName(true); // still mark that this player has a name
      navigate("/selectWord"); // <-- navigate instead of rendering SelectWord directly
    });

    return () => {
      socket.off("requestName");
      socket.off("waiting");
      socket.off("startSelectWord");
    };
  }, [navigate]);

  // If user has NOT entered a name yet → show name input screen
  if (!hasName) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Enter Name</h1>
        <p>{status}</p>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name..."
          style={{ padding: "0.5rem", width: "300px" }}
        />

        <button
          onClick={() => {
            if (name.trim() === "") return alert("Name cannot be empty!");
            socket.emit("submitName", name);
            setHasName(true);
          }}
          style={{ padding: "0.5rem 1rem", marginLeft: "0.5rem" }}
        >
          Submit
        </button>
      </div>
    );
  }

  // While waiting for the other player to submit a name
  return <p style={{ padding: "2rem" }}>{status}</p>;
}
