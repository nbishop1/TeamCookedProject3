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

    res.json(newAccountData);
  } catch (err) {
    throw err;
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

module.exports = accountRoutes;
