const express = require("express");
const router = express.Router();
var currentDate = new Date();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });

const mysqlConnection = require("../db");
var ACCESS_TOKEN_SECRET = "abcdefghijklmnopqrstuvwxyz";

router.post("/api/signup", (req, res) => {
  //console.log(req.body);
  let hash = bcrypt.hashSync(req.body.password, 10);
  const username = req.body.username;
  const password = hash;
  const email = req.body.email;
  const createdAt = currentDate;
  mysqlConnection.query(
    'SELECT email FROM user WHERE email ="' + email + '"',
    function (err, result) {
      if (err) {
        throw err;
      }
      var a = Object.keys(result).length;
      if (a > 0) {
        // res.json("email found");
        res.status(400).json("email found");
      } else {
        mysqlConnection.query(
          'SELECT username FROM user WHERE username ="' + username + '"',
          function (err, result) {
            var n = Object.keys(result).length;
            if (err) {
              throw err;
            }
            if (n > 0) {
              //res.json("username already exists");
              res.status(400).json("username already exists");
            } else {
              // res.json("username also not found");
              mysqlConnection.query(
                "INSERT INTO user (username, email, password, createdAt) VALUES (?,?,?,?)",
                [username, email, password, createdAt],
                (err, data) => {
                  if (err) {
                    console.log(err);
                  } else {
                    res.status(200).json({
                      code: 200,
                      message: "User registered",
                      user: data,
                    });
                  }
                }
              );
            }
          }
        );
      }

    }
  );
});

//user login
router.post("/api/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  mysqlConnection.query(
    'SELECT * FROM user WHERE username ="' + username + '"',
    function (err, result) {
      var n = Object.keys(result).length;
      if (err) {
        throw err;
      }
      if (n > 0) {
        console.log("username  exists");
        console.log(result);
        if (bcrypt.compareSync(password, result[0].password)) {
          console.log(result);
          const accessToken = jwt.sign(
            {
              username: username,
            },
            ACCESS_TOKEN_SECRET,
            {
              expiresIn: "1d",
            }
          );
          let response = {};
          response.accessToken = accessToken;
          response.result = result;
          res.status(200).json(response);
        } else {
          res.status(400).json("Invalid password");
        }
      } else {
        res.status(400).json("Invalid username");
      }
    }
  );
});

module.exports = router;
