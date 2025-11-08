import React, { useState, useEffect } from "react";
import AccountCard from "./AccountCard";
import TransactionForm from "./TransactionForm";
import History from "./History";
import ChartBreakdown from "./ChartBreakdown";
import Transfer from "./Transfer";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("accounts");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  if (!user) return <p>Loading user...</p>;

  const handleUserUpdate = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const renderTab = () => {
    switch (activeTab) {
      case "accounts":
        return (
          <div>
            <h2>Your Accounts</h2>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <AccountCard
                name="Savings"
                amount={user.savings || 0}
                accountKey="savings"
                onUpdate={handleUserUpdate}
              />
              <AccountCard
                name="Checking"
                amount={user.checking || 0}
                accountKey="checking"
                onUpdate={handleUserUpdate}
              />
              <AccountCard
                name={user.otherName || "Other"}
                amount={user.other || 0}
                accountKey="other"
                onUpdate={handleUserUpdate}
              />
            </div>
            <TransactionForm userId={user._id} onUpdate={handleUserUpdate} />
          </div>
        );
      case "history":
        return <History userId={user._id} />;
      case "chart":
        return <ChartBreakdown userId={user._id} />;
      case "transfer":
        return <Transfer userId={user._id} onUpdate={handleUserUpdate} />;
      default:
        return <div>Select a tab above</div>;
    }
  };

  return (
    <div>
      <nav style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#f0f0f0" }}>
        <h1>Banking Dashboard</h1>
        <div>
          <button
            onClick={() => setActiveTab("accounts")}
            style={{ margin: "5px", padding: "10px" }}
          >
            Accounts
          </button>
          <button
            onClick={() => setActiveTab("history")}
            style={{ margin: "5px", padding: "10px" }}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab("chart")}
            style={{ margin: "5px", padding: "10px" }}
          >
            Chart
          </button>
          <button
            onClick={() => setActiveTab("transfer")}
            style={{ margin: "5px", padding: "10px" }}
          >
            Transfer
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("user");
              window.location.href = "/";
            }}
            style={{ margin: "5px", padding: "10px", backgroundColor: "#ff6b6b", color: "white" }}
          >
            Logout
          </button>
        </div>
      </nav>
      <div style={{ padding: "20px" }}>
        {renderTab()}
      </div>
    </div>
  );
}