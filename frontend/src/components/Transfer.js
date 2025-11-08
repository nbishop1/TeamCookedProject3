import React, { useState } from "react";

export default function Transfer({ userId, onUpdate }) {
  const [form, setForm] = useState({
    targetUserId: "",
    targetAccount: "savings",
    sourceAccount: "savings",
    amount: 0,
    category: "",
  });
  const [isInternalTransfer, setIsInternalTransfer] = useState(true);

  function updateForm(value) {
    setForm(prev => ({ ...prev, ...value }));
  }

  async function onSubmit(e) {
    e.preventDefault();

    // Validation for internal transfers
    if (isInternalTransfer && form.sourceAccount === form.targetAccount) {
      alert("Cannot transfer to the same account. Please select different source and target accounts.");
      return;
    }

    // Validate amount
    const amount = Number(form.amount);
    if (amount <= 0) {
      alert("Please enter a valid amount greater than $0");
      return;
    }

    // Set target user ID for internal transfers
    const transferData = {
      targetUserId: isInternalTransfer ? userId : form.targetUserId,
      sourceAccount: form.sourceAccount,
      targetAccount: form.targetAccount,
      amount: amount,
      category: form.category
    };

    console.log("Sending transfer data:", transferData); // Debug log

    try {
      const response = await fetch(`http://localhost:4000/accounts/transfer/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transferData),
      });

      const data = await response.json();
      console.log("Server response:", data); // Debug log

      if (!response.ok) {
        alert(data.errorMessage || "Transfer failed");
        return;
      }

      alert("Transfer successful!");
      onUpdate(data);
      setForm({ targetUserId: "", targetAccount: "savings", sourceAccount: "savings", amount: 0, category: "" });
    } catch (err) {
      console.error("Transfer error:", err); // Debug log
      alert("Server error. Please try again later.");
    }
  }

  return (
    <div>
      <h4>Transfer Money</h4>

      {/* Display current user ID for reference */}
      <div style={{ marginBottom: "15px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "5px" }}>
        <strong>Your User ID:</strong> {userId}
      </div>

      {/* Transfer type toggle */}
      <div style={{ marginBottom: "15px" }}>
        <label>
          <input
            type="radio"
            checked={isInternalTransfer}
            onChange={() => setIsInternalTransfer(true)}
          />
          Transfer between my accounts
        </label>
        <br />
        <label>
          <input
            type="radio"
            checked={!isInternalTransfer}
            onChange={() => setIsInternalTransfer(false)}
          />
          Transfer to another user
        </label>
      </div>

      <form onSubmit={onSubmit}>
        <div>
          <label>Source Account:</label>
          <select value={form.sourceAccount} onChange={(e) => updateForm({ sourceAccount: e.target.value })}>
            <option value="savings">Savings</option>
            <option value="checking">Checking</option>
            <option value="other">Other</option>
          </select>
        </div>

        {!isInternalTransfer && (
          <div>
            <label>Target User ID:</label>
            <input
              type="text"
              value={form.targetUserId}
              onChange={(e) => updateForm({ targetUserId: e.target.value })}
              placeholder="Enter recipient's user ID"
              required={!isInternalTransfer}
            />
          </div>
        )}

        <div>
          <label>Target Account:</label>
          <select value={form.targetAccount} onChange={(e) => updateForm({ targetAccount: e.target.value })}>
            <option value="savings">Savings</option>
            <option value="checking">Checking</option>
            <option value="other">Other</option>
          </select>
          {isInternalTransfer && form.sourceAccount === form.targetAccount && (
            <div style={{ color: "red", fontSize: "12px" }}>
              Cannot transfer to the same account
            </div>
          )}
        </div>

        <div>
          <label>Amount:</label>
          <input type="number" value={form.amount} onChange={(e) => updateForm({ amount: e.target.value })} />
        </div>

        <div>
          <label>Category:</label>
          <input type="text" value={form.category} onChange={(e) => updateForm({ category: e.target.value })} />
        </div>

        <button type="submit">Transfer</button>
      </form>
    </div>
  );
}