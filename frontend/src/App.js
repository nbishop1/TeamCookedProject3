import { useEffect, useState } from "react";
import { io } from "socket.io-client";

// Connect to the Socket.IO server
const socket = io("http://localhost:3001", {
  withCredentials: true, // important for session cookies
});

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [hasName, setHasName] = useState(false);
  const [status, setStatus] = useState("Connecting...");
  const [canChat, setCanChat] = useState(false);

  // Listen for incoming messages from server
  useEffect(() => {
    socket.on("requestName", (msg) => {
      setStatus(msg);
    });

    socket.on("waiting", (msg) => {
      setStatus(msg);
    });

    socket.on("startChat", (data) => {
      setStatus(data.message);
      setCanChat(true);
      setHasName(true);
    });

    socket.on("reset", (msg) => {
      alert(msg);
      window.location.reload();
    });

    socket.on("errorMessage", (msg) => {
      alert(msg);
    });

    socket.on("chatMessage", (msg) => {
      setMessages((prev) => [...prev, `${msg.sender}: ${msg.text}`]);
    });

    return () => {
      socket.off("requestName");
      socket.off("waiting");
      socket.off("startChat");
      socket.off("reset");
      socket.off("errorMessage");
      socket.off("chatMessage");
    };
  }, []);

  const sendMessage = () => {
    if (input.trim() === "") return;
    // Send message to server
    socket.emit("chatMessage", input);
    setInput(""); // clear input
  };

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
            socket.emit("submitName", name);
          }}
          style={{ padding: "0.5rem 1rem", marginLeft: "0.5rem" }}
        >
          Submit
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Realtime Chat</h1>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{ padding: "0.5rem", width: "300px" }}
        />
        <button
          onClick={sendMessage}
          style={{ padding: "0.5rem 1rem", marginLeft: "0.5rem" }}
        >
          Send
        </button>
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {messages.map((msg, idx) => (
          <li
            key={idx}
            style={{
              background: "#f0f0f0",
              marginBottom: "0.5rem",
              padding: "0.5rem",
              borderRadius: "5px",
            }}
          >
            {msg}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
