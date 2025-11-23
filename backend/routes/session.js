const express = require("express");
const routes = express.Router();

routes.route("/sessionSet/:id").get(async function (req, res) {
  console.log("In /sessionSet, session is: " + JSON.stringify(req.session));
  let status = "";
  if(!req.session.userId) {
    req.session.userId = req.params.id;
    status = "Session set";
    console.log(status + JSON.stringify(req.session.userId));
  } else {
    status = "Session already existed";
    console.log(status + JSON.stringify(req.session.userId));
  }
  const resultObj = { status: status, userId: req.session.userId};

  res.json(resultObj);
});

routes.route("/sessionGet").get(async function (req, res) {
  console.log("In /sessionGet, session is: " + JSON.stringify(req.session));
  let status = "";
  if(!req.session.userId) {
    status = "No Session Set";
    console.log(status + JSON.stringify(req.session.userId));
  } else {
    status = "Session username is: " + req.session.userId;
    console.log(status + JSON.stringify(req.session.userId));
  }
  const resultObj = { status: status, userId: req.session.userId, };

  res.json(resultObj);
});

routes.route("/sessionDelete").get(async function (req, res) {
  console.log("In /sessionDelete, session is: " + JSON.stringify(req.session));
  req.session.destroy();
  let status = "No Session Set";
  
  const resultObj = { status: status };

  res.json(resultObj);
});

module.exports = routes;