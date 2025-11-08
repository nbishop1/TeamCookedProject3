import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

export default function ChartBreakdown({ userId }) {
  const [categoryData, setCategoryData] = useState([]);
  const [typeData, setTypeData] = useState([]);
  const [activeChart, setActiveChart] = useState('category'); // 'category' or 'type'
  const [filter, setFilter] = useState({
    account: 'all',
    type: 'all'
  });

  useEffect(() => {
    fetchChartData();
  }, [userId, filter]);

  async function fetchChartData() {
    try {
      let url = `http://localhost:4000/accounts/${userId}/transactions/summary`;
      const params = new URLSearchParams();

      if (filter.account !== 'all') {
        params.append('account', filter.account);
      }
      if (filter.type !== 'all') {
        params.append('type', filter.type);
      }

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url);
      const data = await response.json();
      const summary = data.summary || [];

      // Format data for category chart
      const categoryChartData = summary.map(item => ({
        name: item._id || 'Uncategorized',
        value: Number(item.totalAmount),
        count: item.count
      }));

      setCategoryData(categoryChartData);

      // Get transaction types breakdown
      const typeResponse = await fetch(`http://localhost:4000/accounts/${userId}/transactions?limit=1000`);
      const typeData = await typeResponse.json();
      const transactions = typeData.transactions || [];

      // Group by transaction type
      const typeMap = {};
      transactions.forEach(t => {
        if (!typeMap[t.type]) {
          typeMap[t.type] = { total: 0, count: 0 };
        }
        typeMap[t.type].total += Number(t.amount);
        typeMap[t.type].count += 1;
      });

      const typeChartData = Object.keys(typeMap).map(type => ({
        name: getTypeDisplayName(type),
        value: typeMap[type].total,
        count: typeMap[type].count
      }));

      setTypeData(typeChartData);
    } catch (err) {
      console.error("Error fetching chart data:", err);
    }
  }

  const getTypeDisplayName = (type) => {
    switch (type) {
      case 'deposit': return 'Deposits';
      case 'withdraw': return 'Withdrawals';
      case 'transfer_in': return 'Transfers In';
      case 'transfer_out': return 'Transfers Out';
      default: return type;
    }
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A", "#3399AA", "#FF6B6B", "#4ECDC4"];

  const renderCustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <p><strong>{data.name}</strong></p>
          <p>Amount: ${Number(data.value).toFixed(2)}</p>
          <p>Transactions: {data.count}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h3>Transaction Analysis</h3>

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
            style={{ marginRight: '20px' }}
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposits Only</option>
            <option value="withdraw">Withdrawals Only</option>
            <option value="transfer_in">Transfers In Only</option>
            <option value="transfer_out">Transfers Out Only</option>
          </select>
        </div>

        {/* Chart Type Toggle */}
        <div>
          <label style={{ marginRight: '10px' }}>View:</label>
          <button
            onClick={() => setActiveChart('category')}
            style={{
              marginRight: '10px',
              backgroundColor: activeChart === 'category' ? '#007bff' : '#f8f9fa',
              color: activeChart === 'category' ? 'white' : 'black',
              border: '1px solid #dee2e6',
              padding: '5px 10px',
              borderRadius: '3px'
            }}
          >
            By Category
          </button>
          <button
            onClick={() => setActiveChart('type')}
            style={{
              backgroundColor: activeChart === 'type' ? '#007bff' : '#f8f9fa',
              color: activeChart === 'type' ? 'white' : 'black',
              border: '1px solid #dee2e6',
              padding: '5px 10px',
              borderRadius: '3px'
            }}
          >
            By Transaction Type
          </button>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {activeChart === 'category' && categoryData.length > 0 && (
          <div>
            <h4>Spending by Category</h4>
            <PieChart width={400} height={400}>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                label={({ name, value }) => `${name}: $${Number(value).toFixed(2)}`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={renderCustomTooltip} />
              <Legend />
            </PieChart>
          </div>
        )}

        {activeChart === 'type' && typeData.length > 0 && (
          <div>
            <h4>Activity by Transaction Type</h4>
            <ResponsiveContainer width={500} height={400}>
              <BarChart data={typeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={renderCustomTooltip} />
                <Bar dataKey="value" fill="#8884d8">
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {((activeChart === 'category' && categoryData.length === 0) ||
          (activeChart === 'type' && typeData.length === 0)) && (
            <p>No transaction data available for the selected filters.</p>
          )}
      </div>
    </div>
  );
}