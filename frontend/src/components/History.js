import React, { useState, useEffect } from "react";
import dayjs from "dayjs";

export default function History({ userId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    account: 'all', // 'all', 'savings', 'checking', 'other'
    type: 'all', // 'all', 'deposit', 'withdraw', 'transfer_in', 'transfer_out'
  });

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      try {
        let url = `http://localhost:4000/accounts/${userId}/transactions?limit=100`;

        if (filter.account !== 'all') {
          url += `&account=${filter.account}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        let filteredTransactions = data.transactions || [];

        // Apply type filter on frontend since backend doesn't filter by type yet
        if (filter.type !== 'all') {
          filteredTransactions = filteredTransactions.filter(t => t.type === filter.type);
        }

        setTransactions(filteredTransactions);
        setLoading(false);
      } catch (err) {
        alert("Failed to fetch transaction history");
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [userId, filter]);

  const getTypeDisplay = (type) => {
    switch (type) {
      case 'deposit': return 'Deposit';
      case 'withdraw': return 'Withdrawal';
      case 'transfer_in': return 'Transfer In';
      case 'transfer_out': return 'Transfer Out';
      default: return type;
    }
  };

  const getAmountDisplay = (type, amount) => {
    const sign = (type === 'deposit' || type === 'transfer_in') ? '+' : '-';
    const color = (type === 'deposit' || type === 'transfer_in') ? 'green' : 'red';
    return (
      <span style={{ color }}>
        {sign}${Number(amount).toFixed(2)}
      </span>
    );
  };

  if (loading) return <p>Loading transactions...</p>;

  return (
    <div>
      <h3>Transaction History</h3>

      {/* Filter Controls */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ marginRight: '10px' }}>Filter by Account:</label>
          <select
            value={filter.account}
            onChange={(e) => setFilter({ ...filter, account: e.target.value })}
            style={{ marginRight: '20px' }}
          >
            <option value="all">All Accounts</option>
            <option value="savings">Savings</option>
            <option value="checking">Checking</option>
            <option value="other">Other</option>
          </select>

          <label style={{ marginRight: '10px' }}>Filter by Type:</label>
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="withdraw">Withdrawals</option>
            <option value="transfer_in">Transfers In</option>
            <option value="transfer_out">Transfers Out</option>
          </select>
        </div>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          Showing {transactions.length} transaction(s)
        </p>
      </div>

      {/* Transaction Table */}
      {transactions.length === 0 ? (
        <p>No transactions found for the selected filters.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#e9e9e9' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Date & Time</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Type</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Account</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Amount</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Category</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, idx) => (
              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {dayjs(t.date).format('YYYY-MM-DD HH:mm:ss')}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {getTypeDisplay(t.type)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textTransform: 'capitalize' }}>
                  {t.account}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {getAmountDisplay(t.type, t.amount)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {t.category || 'Uncategorized'}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>
                  {t.description || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}