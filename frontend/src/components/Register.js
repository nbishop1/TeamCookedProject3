import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  async function handleCreate(e) {
    e.preventDefault();

    if (!username || !password) {
      setStatus("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setStatus("Password must be at least 6 characters");
      return;
    }

    setStatus("Checking username...");
    try {
      // Check if username exists
      const checkRes = await fetch("http://localhost:4000/accounts/exists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const checkData = await checkRes.json();

      if (checkData.status === 1) {
        setStatus("Username already in use");
        return;
      }

      setStatus("Creating account...");
      // Create new account
      const createRes = await fetch("http://localhost:4000/accounts/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const createData = await createRes.json();

      if (!createRes.ok) {
        setStatus("Account creation failed");
        return;
      }

      setStatus("Account created successfully. Redirecting to login...");
      setTimeout(() => navigate("/"), 1500); // redirect to login after 1.5s

    } catch (err) {
      console.error(err);
      setStatus("Server error");
    }
  }

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h3>Create account</h3>
      <form onSubmit={handleCreate}>
        <div style={{ marginBottom: "15px" }}>
          <input
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", marginBottom: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
          />
          <input
            placeholder="Password (minimum 6 characters)"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
          />
        </div>
        <button type="submit" style={{ width: "100%", padding: "10px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px" }}>
          Create Account
        </button>
        <div className="status" style={{ marginTop: "15px", color: status.includes("error") || status.includes("failed") || status.includes("already in use") ? "#dc3545" : "#28a745" }}>
          {status}
        </div>
        <p style={{ textAlign: "center", marginTop: "15px" }}>
          Already have an account? <Link to="/">Login here</Link>
        </p>
      </form>
    </div>
  );
}
