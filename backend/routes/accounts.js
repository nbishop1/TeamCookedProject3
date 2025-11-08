const express = require("express");

// accountRoutes is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /record.
const accountRoutes = express.Router();

// This will help us connect to the database
const dbo = require("../db/conn");

// This helps convert the id from string to ObjectId for the _id.
const ObjectId = require("mongodb").ObjectId;

// used for hashing
const crypto = require("crypto");

// This section will help you get a single account by id
accountRoutes.route("/accounts/:id").get(async (req, res) => {
  try {
    let db_connect = dbo.getDb();
    let myquery = { _id: new ObjectId(req.params.id) };
    const result = await db_connect.collection("accounts").findOne(myquery);
    res.json(result);
  } catch (err) {
    throw err;
  }
});

// This section checks to see if the user provided the correct username and password for an account in the system.
accountRoutes.route("/accounts/login").post(async (req, res) => {
  try {
    let db_connect = dbo.getDb();
    const result = await db_connect
      .collection("accounts")
      .findOne({ username: req.body.username });
    if (result) {
      const saltPassword = result.salt + req.body.password;
      const hashPassword = hashingPassword(saltPassword);
      if (hashPassword === result.password) {
        savMoney = result.savings;
        cheMoney = result.checking;
        othMoney = result.other;
        othName = result.otherName;
        res.json(result);
      } else {
        res.status(400).json({ message: "Incorrect password" }); // help with debugging
      }
    } else {
      res.json(result);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" }); // help with debugging
  }
});

// This section will help you create a new Account.
accountRoutes.route("/accounts/add").post(async (req, res) => {
  try {
    let db_connect = dbo.getDb();
    const salt = generateSalt();
    const saltPassword = salt + req.body.password;
    const hashPassword = hashingPassword(saltPassword);
    let myobj = {
      username: req.body.username,
      password: hashPassword,
      salt: salt,
      savings: 0.0,
      checking: 0.0,
      other: 0.0,
      otherName: "other",
    };
    const result = await db_connect.collection("accounts").insertOne(myobj);

    const newAccount = {
      _id: result.insertedId,
      username: myobj.username,
      password: myobj.password,
      savings: myobj.savings,
      checking: myobj.checking,
      other: myobj.other,
      otherName: myobj.otherName,
    };
    res.json(newAccount);
  } catch (err) {
    throw err;
  }
});

// This section checks to see if the user provided a username already in use.
accountRoutes.route("/accounts/exists").post(async (req, res) => {
  try {
    let db_connect = dbo.getDb();
    const result = await db_connect
      .collection("accounts")
      .findOne({ username: req.body.username });
    if (result) {
      res.json({ message: "username already in use", status: 1 });
    } else {
      res.json({ message: "username not in use", status: 0 });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" }); // help with debugging
  }
});

// This section will help you deposit to an Account.
accountRoutes.route("/deposit/:id").post(async (req, res) => {
  try {
    const db_connect = dbo.getDb();
    const accountData = { _id: new ObjectId(req.params.id) };

    const account = await db_connect
      .collection("accounts")
      .findOne(accountData);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    let savMoney = account.savings;
    let cheMoney = account.checking;
    let othMoney = account.other;

    let newAccountData = {
      savings: savMoney + req.body.savings,
      checking: cheMoney + req.body.checking,
      other: othMoney + req.body.other,
    };

    const updatedAccount = { $set: newAccountData };

    const result = await db_connect
      .collection("accounts")
      .updateOne(accountData, updatedAccount);

    // Log transactions for each account that received a deposit
    if (req.body.savings > 0) {
      await logTransaction(db_connect, req.params.id, 'deposit', 'savings', req.body.savings, req.body.category);
    }
    if (req.body.checking > 0) {
      await logTransaction(db_connect, req.params.id, 'deposit', 'checking', req.body.checking, req.body.category);
    }
    if (req.body.other > 0) {
      await logTransaction(db_connect, req.params.id, 'deposit', 'other', req.body.other, req.body.category);
    }

    res.json(newAccountData);
  } catch (err) {
    throw err;
  }
});

// This section will help you withdraw an Account.
accountRoutes.route("/withdraw/:id").post(async (req, res) => {
  try {
    const db_connect = dbo.getDb();
    const accountData = { _id: new ObjectId(req.params.id) };

    const account = await db_connect
      .collection("accounts")
      .findOne(accountData);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    let savMoney = account.savings;
    let cheMoney = account.checking;
    let othMoney = account.other;
    let othName = account.otherName;

    if (savMoney - req.body.savings < 0.0) {
      return res
        .status(400)
        .json({ errorMessage: "Savings can't be below $0" });
    }
    if (cheMoney - req.body.checking < 0.0) {
      return res
        .status(400)
        .json({ errorMessage: "Checking can't be below $0" });
    }
    if (othMoney - req.body.other < 0.0) {
      const eMessage = othName + " can't be below $0";
      return res.status(400).json({ errorMessage: eMessage });
    }

    let newAccountData = {
      savings: savMoney - req.body.savings,
      checking: cheMoney - req.body.checking,
      other: othMoney - req.body.other,
    };

    const updatedAccount = { $set: newAccountData };

    const result = await db_connect
      .collection("accounts")
      .updateOne(accountData, updatedAccount);

    // Log transactions for each account that had a withdrawal
    if (req.body.savings > 0) {
      await logTransaction(db_connect, req.params.id, 'withdraw', 'savings', req.body.savings, req.body.category);
    }
    if (req.body.checking > 0) {
      await logTransaction(db_connect, req.params.id, 'withdraw', 'checking', req.body.checking, req.body.category);
    }
    if (req.body.other > 0) {
      await logTransaction(db_connect, req.params.id, 'withdraw', 'other', req.body.other, req.body.category);
    }

    res.json(newAccountData);
  } catch (err) {
    throw err;
  }
});

// This section will help you transfer money between accounts
accountRoutes.route("/accounts/transfer/:id").post(async (req, res) => {
  try {
    const db_connect = dbo.getDb();
    const sourceUserId = req.params.id;
    const { targetUserId, sourceAccount, targetAccount, amount, category } = req.body;

    // Validate input
    if (!targetUserId || !sourceAccount || !targetAccount || amount <= 0) {
      return res.status(400).json({ errorMessage: "Invalid transfer data" });
    }

    // Get source account
    const sourceUser = await db_connect
      .collection("accounts")
      .findOne({ _id: new ObjectId(sourceUserId) });

    if (!sourceUser) {
      return res.status(404).json({ errorMessage: "Source account not found" });
    }

    // Get target account
    const targetUser = await db_connect
      .collection("accounts")
      .findOne({ _id: new ObjectId(targetUserId) });

    if (!targetUser) {
      return res.status(404).json({ errorMessage: "Target account not found" });
    }

    // Check if source account has enough funds
    const sourceBalance = sourceUser[sourceAccount];
    if (sourceBalance < amount) {
      const accountName = sourceAccount === 'other' ? sourceUser.otherName : sourceAccount;
      return res.status(400).json({
        errorMessage: `Insufficient funds in ${accountName} account. Available: $${sourceBalance.toFixed(2)}`
      });
    }

    // Perform the transfer
    const updatedSourceUser = {
      ...sourceUser,
      [sourceAccount]: sourceBalance - amount
    };

    const updatedTargetUser = {
      ...targetUser,
      [targetAccount]: targetUser[targetAccount] + amount
    };

    // Update source account
    await db_connect
      .collection("accounts")
      .updateOne(
        { _id: new ObjectId(sourceUserId) },
        { $set: { [sourceAccount]: updatedSourceUser[sourceAccount] } }
      );

    // Update target account (only if different from source)
    if (sourceUserId !== targetUserId) {
      await db_connect
        .collection("accounts")
        .updateOne(
          { _id: new ObjectId(targetUserId) },
          { $set: { [targetAccount]: updatedTargetUser[targetAccount] } }
        );
    } else {
      // Internal transfer - update both accounts in one operation
      await db_connect
        .collection("accounts")
        .updateOne(
          { _id: new ObjectId(sourceUserId) },
          { $set: { [targetAccount]: updatedTargetUser[targetAccount] } }
        );
    }

    // Log transfer transactions (include counterparty username for readability)
    const transferDescription = sourceUserId === targetUserId
      ? `Internal transfer from ${sourceAccount} to ${targetAccount}`
      : `Transfer to user ${targetUser.username}`;

    const receiveDescription = sourceUserId === targetUserId
      ? `Internal transfer from ${sourceAccount} to ${targetAccount}`
      : `Transfer from user ${sourceUser.username}`;

    // Log outgoing transfer for source user (counterparty is targetUser.username)
    await logTransaction(db_connect, sourceUserId, 'transfer_out', sourceAccount, amount, category, transferDescription, targetUser.username);

    // Log incoming transfer for target user (counterparty is sourceUser.username)
    await logTransaction(db_connect, targetUserId, 'transfer_in', targetAccount, amount, category, receiveDescription, sourceUser.username);

    // Return updated source user data (for frontend state update)
    const finalSourceUser = await db_connect
      .collection("accounts")
      .findOne({ _id: new ObjectId(sourceUserId) });

    res.json({
      savings: finalSourceUser.savings,
      checking: finalSourceUser.checking,
      other: finalSourceUser.other,
      otherName: finalSourceUser.otherName
    });

  } catch (err) {
    console.error("Transfer error:", err);
    res.status(500).json({ errorMessage: "Transfer failed. Please try again." });
  }
});

// Get all transactions for a user
accountRoutes.route("/accounts/:id/transactions").get(async (req, res) => {
  try {
    const db_connect = dbo.getDb();
    const userId = req.params.id;
    const { account, limit = 50 } = req.query;

    let query = { userId: new ObjectId(userId) };

    // Filter by specific account if provided
    if (account && ['savings', 'checking', 'other'].includes(account)) {
      query.account = account;
    }

    const transactions = await db_connect
      .collection("transactions")
      .find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .toArray();

    res.json({ transactions });
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ errorMessage: "Failed to fetch transactions" });
  }
});

// Get transaction summary by category for charts
accountRoutes.route("/accounts/:id/transactions/summary").get(async (req, res) => {
  try {
    const db_connect = dbo.getDb();
    const userId = req.params.id;
    const { type, account } = req.query;

    let matchQuery = { userId: new ObjectId(userId) };

    // Filter by transaction type if provided
    if (type && ['deposit', 'withdraw', 'transfer_in', 'transfer_out'].includes(type)) {
      matchQuery.type = type;
    }

    // Filter by account if provided
    if (account && ['savings', 'checking', 'other'].includes(account)) {
      matchQuery.account = account;
    }

    const summary = await db_connect
      .collection("transactions")
      .aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: "$category",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } }
      ])
      .toArray();

    res.json({ summary });
  } catch (err) {
    console.error("Error fetching transaction summary:", err);
    res.status(500).json({ errorMessage: "Failed to fetch transaction summary" });
  }
});

// This section will help you rename the other Account.
accountRoutes.route("/newName/:id").post(async (req, res) => {
  try {
    let db_connect = dbo.getDb();
    let accountData = { _id: new ObjectId(req.params.id) };

    if (req.body.otherName) {
      let othName = req.body.otherName;
      let newAccountName = {
        otherName: othName,
      };

      const updatedAccount = { $set: newAccountName };

      const result = await db_connect
        .collection("accounts")
        .updateOne(accountData, updatedAccount);

      res.json(newAccountName);
    } else {
      res.status(400).json({ errorMessage: "Please enter in a new name for 'other' account." });
    }
  } catch (err) {
    throw err;
  }
});

function hashingPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}
function generateSalt(length = 16) {
  return crypto.randomBytes(length).toString("hex");
}

// Helper function to log transactions (optionally include counterparty username)
async function logTransaction(db, userId, type, account, amount, category, description = "", counterparty = null) {
  const transaction = {
    userId: new ObjectId(userId),
    type: type, // 'deposit', 'withdraw', 'transfer_in', 'transfer_out'
    account: account, // 'savings', 'checking', 'other'
    amount: Number(amount),
    category: category || 'uncategorized',
    description: description,
    counterpartyUsername: counterparty || null,
    date: new Date(),
    timestamp: new Date().toISOString()
  };

  await db.collection("transactions").insertOne(transaction);
}

module.exports = accountRoutes;
