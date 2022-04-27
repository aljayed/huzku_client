const express = require("express");
const forgot_password_router = express.Router();
const bcrypt = require("bcryptjs");
const multer = require("multer");
const DIR = "./public/images";
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
const nodemailer = require("nodemailer");
const mysqlConnection = require('../db');
var forgotpasswordvalcode = Math.floor(1000 + Math.random() * 9000);


//Send OTP to email by NodeMailer
let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    service: "gmail",
    auth: {
      user: "huzkuforget@gmail.com",
      pass: "PoopBrain69!!",
    },
  });
  
  forgot_password_router.post("/api/user/sendemailotp", (req, res) => {
    console.log(forgotpasswordvalcode);
    const email = req.body.email;
    mysqlConnection.query(
      'Select * from huzku.user WHERE email = "' + email + '";',
      (err, data) => {
        if (err) {
          throw err;
        }
        var a = Object.keys(data).length;
        if (a == 0) {
          res.status(400).json("Email not found");
        } else {
          
          transporter.sendMail(
            {
              from: '"Huzku" <poolyourc@gmail.com>', // sender address
              to: req.body.email, // list of receivers
              subject: "Reset Password ✔", // Subject line
              text: "Reset Password code", // plain text body
              html:
                "<b>To reset your password, the verification code is " +
                forgotpasswordvalcode +
                "</b>", // html body
            },
            function (error, info) {
              if (error) {
                res.send(error);
              } else {
                res.status(200).json({
                  code: 200,
                  message: "Email sent: " + info.response,
                  user: data,
                });
              }
            }
          );
        }
      }
    );
  });

  forgot_password_router.post("/api/user/verifyemailcodetoresetpasssword", (req, res) => {
    const code = req.body.code;
    if (code == forgotpasswordvalcode) {
      res.status(200).json({
        code: 200,
        message: "Valid Code",
      });
    } else {
      
      res.status(400).json("Invalid Code");
    }
  });

  forgot_password_router.post("/api/user/resetpassword/:email", (req, res) => {
    const email = req.params.email;
    let hash = bcrypt.hashSync(req.body.password, 10);
    const password = hash;
    mysqlConnection.query(
      'UPDATE huzku.user SET password = "' +
        password +
        '" WHERE email= "' +
        email +
        '";',
      (err, data) => {
        if (err) {
          console.log(err);
        } else {
          console.log(data);
          res.status(200).json({
            code: 200,
            message: "Password Updated",
            user: data,
          });
        }
      }
    );
  });
  

  module.exports = forgot_password_router;