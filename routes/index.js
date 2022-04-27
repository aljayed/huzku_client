const express = require("express");
const router = express.Router();
var currentDate = new Date();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const DIR = "./public/images";
const dotenv = require("dotenv");
const mysqlConnection = require('../db');
dotenv.config({ path: "./config/config.env" });
const nodemailer = require("nodemailer");
var forgotpasswordvalcode = Math.floor(1000 + Math.random() * 9000);

var ACCESS_TOKEN_SECRET =
  "abcdefghijklmnopqrstuvwxyz";
  module.exports.authenticateToken = function (req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) {
      return res.sendStatus(401);
    }
    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      console.log('hello');
      req.user = user;
      next();
    });
  };
  

//storing image on server
const filestorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "--" + file.originalname);
  },
});

const upload = multer({
  storage: filestorageEngine,
});
router.post(
  "/api/upload_profile_image/:username",
  upload.single("image"),
  (req, res) => {
    console.log(req.file);
    console.log("path name");
    console.log(req.file.filename);
    mysqlConnection.query(
      'UPDATE huzku.user SET imagepath = "' +
        req.file.filename +
        '" WHERE username= "' +
        req.params.username +
        '";',
      (err, data) => {
        if (err) {
          console.log(err);
        } else {
          console.log(data);
          res.status(200).json({
            code: 200,
            message: "User image uploaded",
            user: data,
          });
        }
      }
    );
  }
);

//delete picture
router.post("/api/delete_profile_image/:username", (req, res) => {
  mysqlConnection.query(
    'UPDATE huzku.user SET imagepath = null WHERE username= "' +
      req.params.username +
      '";',
    (err, data) => {
      if (err) {
        console.log(err);
      } else {
        console.log(data);
        res.status(200).json({
          code: 200,
          message: "User image deleted",
          user: data,
        });
      }
    }
  );
  //res.send("File upload success");
});



router.post("/api/storefcmtoken/:userid", (req, res) => {
  const fcmtoken = req.body.fcmtoken;
  console.log(req.body);
  mysqlConnection.query(
    'UPDATE huzku.user SET firebase_cloudmsg_fcmtoken = "' +
      fcmtoken +
      '" WHERE userid= "' +
      req.params.userid +
      '";',
    (err, result) => {
      if (err) throw err;
      else {

        res.status(200).json({
          code: 200,
          message: "Fcm token added successfully",
          user: result,
        });
      }
    }
  );
});

//get user details otp
router.get("/api/userprofile/:username",(req, res) => {
  const username = req.params.username;
  console.log('came here');
  mysqlConnection.query(
    'Select * from huzku.user WHERE username = "' + username + '";',
    (err, data) => {
      if (err) {
        console.log(err);
      } else {
        console.log(JSON.stringify(data));
        res.status(200).json({
          code: 200,
          message: "User Details are",
          user: data,
        });
      }
    }
  );
});

//edit user profile
router.put("/api/edituserprofile/:username", (req, res) => {
  const bio = req.body.bio;
  mysqlConnection.query(
    'UPDATE huzku.user SET bio = "' +
      bio +
      '" WHERE username= "' +
      req.params.username +
      '";',
    (err, data) => {
      if (err) {
        console.log(err);
      } else {
        console.log(data);
        res.status(200).json({
          code: 200,
          message: "User updated",
          user: data,
        });
      }
    }
  );
});

//search user
router.get("/api/searchuser", (req, res) => {
  const username = req.body.username;
  const percent = "%";
  mysqlConnection.query(
    'Select * from huzku.user WHERE username LIKE "' +
      username +
      '"  "' +
      percent +
      '" ;',
    (err, data) => {
      if (err) {
        console.log(err);
      }
      var a = Object.keys(data).length;
      if (a == 0) {
        // res.json("email found");
        res.status(400).json("No user found");
      } else {
        console.log(data);
        res.status(200).json({
          code: 200,
          message: "User found",
          user: data,
        });
      }
    }
  );
});

module.exports.router = router;
