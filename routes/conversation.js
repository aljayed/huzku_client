const express = require("express");
const conversationsrouter = express.Router();
var currentDate = new Date();

const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });

const mysqlConnection = require("../db");
const multer = require("multer");
const DIR = "./public/conversation_images";
const fs = require("fs");

const filestorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    console.log('file name is '+file.originalname);
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: filestorageEngine,
});

// upload conversation image on server

conversationsrouter.post(
  "/uploadimageonserver",
  upload.single("image"),
  (req, res) => {
    const image = req.body.image;
    res.json({
      code: 200,
      fileName: image,
    });
  }
);

//create Conversation

conversationsrouter.post("/createconversation", (req, res) => {
  const myId = req.body.myid;
  const secondUserId = req.body.secondUserId;
  const message = req.body.message;
  const lastmessage = req.body.message;
  lastmessagetype = req.body.messagetype;

  console.log(myId + "sdasadsda" + secondUserId);
  mysqlConnection.query(
    " INSERT into conversations (firstuser_id, seconduser_id, lastmessage,lastmessage_type) VALUES (?,?,?,?)",
    [myId, secondUserId, lastmessage, lastmessagetype],
    (err, result) => {
      if (err) throw err;
      else {
        const newConversationId = result["insertId"];

        // mysqlConnection.query(
        //   " INSERT into conversation_messages (conversation_id, sender_id, message,) VALUES (?,?,?)",
        //   [newConversationId, myId, message],
        //   (err, messageresult) => {
        //     if (err) throw err;
        // else {
        res.status(200).json({
          code: 200,
          message: "Conversation created and message added",
          conversation: result,
        });
        // }
        //}
        //);
      }
    }
  );
});

//get user single conversation

conversationsrouter.get("/getuserconversation", (req, res) => {
  const myid = req.body.myid;
  const secondUserId = req.body.secondUserId;

  //mysqlConnection.query("SELECT conversation_id from conversation WHERE firstuser_id ="' + myid + '" ",)
  mysqlConnection.query(
    'SELECT conversation_id from conversations WHERE firstuser_id= "' +
      myid +
      '" AND seconduser_id= "' +
      secondUserId +
      '" OR firstuser_id= "' +
      secondUserId +
      '" AND seconduser_id= "' +
      myid +
      '" ;',
    (err, result) => {
      var a = Object.keys(result).length;

      if (err) throw err;
      else if (a > 0) {
        const conversation_id = result[0].conversation_id;
        console.log(result[0].conversation_id);
        console.log("Conversation exists in api call");
        // res.json({
        //   code: 200,
        //   result: result,
        // });
        mysqlConnection.query(
          'SELECT * from conversation_messages where conversation_id= "' +
            conversation_id +
            '"',
          (err, conversation_detail) => {
            if (err) throw err;
            else {
              res.status(200).json({
                code: 200,
                text: "Conversation Details is ",
                Conversation_id: conversation_id,
                ConversationDetail: conversation_detail,
              });
            }
          }
        );
      } else {
        res.status(400).json({
          code: 400,
          text: "Conversation doesn't exist",
        });
      }
    }
  );
});

// get inbox xoncersations of user

conversationsrouter.get("/getinboxconversation", (req, res) => {
  const userid = req.body.userid;
  mysqlConnection.query(
    `select conversations.conversation_id as conversation_id, conversations.firstuser_id as firstuser_id,conversations.seconduser_id as seconduser_id, conversations.lastmessage as lastmessage,  conversations.lastmessage_type as lastmessage_type, conversations.lastmessage_time as lastmessage_time, u1.userid as u1_user_id, u1.username as u1_username, u1.imagepath as u1_imagepath, u2.userid as u2_user_id, u2.username as u2_username, u2.imagepath as u2_imagepath from conversations left outer join user u1 on conversations.firstuser_id  = u1.userid left outer join user u2 on conversations.seconduser_id = u2.userid where conversations.firstuser_id= ${userid}
      or conversations.seconduser_id=${userid} order by conversations.lastmessage_time desc;`,
    (err, coversations_result) => {
      if (err) throw err;
      else {
        res.status(200).json({
          code: 200,
          conversations: coversations_result,
        });
      }
    }
  );
});

module.exports.conversationsrouter = conversationsrouter;
