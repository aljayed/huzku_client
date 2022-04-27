const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const app = express();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Socket } = require("socket.io");
const { authenticateToken, router } = require("./routes/index");
const { forgot_password_router } = require("./routes/forgot_password");
const { followersrouter } = require("./routes/followers");
const { postsrouter } = require("./routes/posts");
const { conversationsrouter } = require("./routes/conversation");
const mysqlConnection = require("./db");
const cors = require("cors");
app.use(cors());
app.use(bodyParser.json());

var admin = require("firebase-admin");

//Load Config
dotenv.config({ path: "./config/config.env" });

app.get("/", (req, res) => {
  res.send("Hello");
});
app.use(express.static("public"));
console.log("MIDDLEWARE", authenticateToken);
app.use("/user", require("./routes/loginsignup"));
app.use("/forgotpassword", require("./routes/forgot_password"));
app.use("/", authenticateToken, router);
app.use("/userfollow", authenticateToken, followersrouter);
app.use("/userposts", authenticateToken, postsrouter);
app.use("/userconversations", conversationsrouter);

server = app.listen(process.env.PORT, () => console.log("Server Started"));
const io = require("socket.io")(server);

io.on("connection", function (socket) {
  console.log("printing socket details");
  console.log("socket connect...", socket.id);
  let conversationExists = socket.handshake.query["conversationExists"];
  let convo_id = socket.handshake.query["frontendconvoid"];
  let myid = socket.handshake.query["myid"];
  let secondUserID = socket.handshake.query["secondUserId"];
  

  socket.on("typing", function name(data) {
    console.log(data);
    io.to(convo_id).emit("typing", data);
  });

  socket.on("message", function name(data) {
    var msg = {
      // conversation_id: data.conversationId,
      senderId: data.senderId,
      messageType: data.messageType,
      message: data.message,
      //timestamp: data.timestamp,
    };
    console.log("going in if condition----" + convo_id);
    if (convo_id == "null") {
      console.log("in if creatingg conversation");

      mysqlConnection.query(
        " INSERT into conversations (firstuser_id, seconduser_id, lastmessage,lastmessage_type) VALUES (?,?,?,?)",
        [myid, secondUserID, msg.message, msg.messageType],
        (err, result) => {
          if (err) throw err;
          else {
            console.log("new conversation created");
            convo_id = result["insertId"];
            socket.join(convo_id);

            console.log("conversation exists:  " + conversationExists);
            console.log(convo_id);
            console.log("myid is " + myid);
            console.log("second userid " + secondUserID);
            console.log("data in message object ---");

            console.log(data);
            console.log(convo_id);
            io.to(convo_id).emit("message", data);
            

            mysqlConnection.query(
              "UPDATE huzku.conversations SET conversations.lastmessage= '" +
                msg.message +
                "', lastmessage_type= '" +
                msg.messageType +
                "'  WHERE conversation_id = '" +
                convo_id +
                "' ;",
              (err, result) => {
                if (err) {
                  throw err;
                } else {
                  mysqlConnection.query(
                    " INSERT into conversation_messages (conversation_id, sender_id, messagetype, message) VALUES (?,?,?,?)",
                    [convo_id, myid, msg.messageType, msg.message],
                    (err, messageresult) => {
                      if (err) throw err;
                      else {
                        const msgId = messageresult["insertId"];
                        mysqlConnection.query(
                          'SELECT * from conversation_messages where message_id= "' +
                            msgId +
                            '"',
                          (err, messageRow) => {
                            if (err) throw err;
                            else {
                              console.log("message added in convo");
                              console.log(messageRow);
                              socket.emit("newmessage", messageRow);
                              //send notification to reciever
                        mysqlConnection.query(
                          'SELECT username from user where userid = "' +
                            myid +
                            '" ',
                          (err, result) => {
                            if (err) {
                              throw err;
                            }
                            var a = Object.keys(result).length;
                            if (a == 1) {
                              mysqlConnection.query(
                                'Select firebase_cloudmsg_fcmtoken from huzku.user where userid= "' +
                                  secondUserID +
                                  '"',
                                (err, data) => {
                                  if (err) throw err;

                                  var b = Object.keys(data).length;
                                  if (b == 1) {
                                    var usertoken =
                                      data[0]["firebase_cloudmsg_fcmtoken"];
                                    const message = {
                                      notification: {
                                        title: "Huzku",
                                        body:
                                          result[0]["username"] +
                                          " sent you a new message ",
                                      },
                                      token: usertoken,
                                    };

                                    // Send a message to the device corresponding to the provided
                                    // registration token.
                                    const Messaging = admin
                                      .messaging()
                                      .send(message)
                                      .then((response) => {
                                        // Response is a message ID string.
                                        console.log(
                                          "Successfully sent message:",
                                          response
                                        );
                                      })
                                      .catch((error) => {
                                        console.log(
                                          "Error sending message:",
                                          error
                                        );
                                      });
                                  }
                                }
                              );
                            } else {
                              // res
                              //   .status(400)
                              //   .json({ message: "No user found" });
                            }
                          }
                        );
                            }
                          }
                        );
                      }
                    }
                  );
                }
              }
            );
          }
        }
      );
    } else {
      socket.join(convo_id);

      console.log("conversation exists:  " + conversationExists);
      console.log(convo_id);
      console.log("myid is " + myid);
      console.log("second userid " + secondUserID);
      console.log("data in message object ---");

      console.log(data);
      console.log(convo_id);
      io.to(convo_id).emit("message", data);

      mysqlConnection.query(
        "UPDATE huzku.conversations SET conversations.lastmessage= '" +
          msg.message +
          "', lastmessage_type= '" +
          msg.messageType +
          "'  WHERE conversation_id = '" +
          convo_id +
          "' ;",
        (err, result) => {
          if (err) {
            throw err;
          } else {
            mysqlConnection.query(
              " INSERT into conversation_messages (conversation_id, sender_id, messagetype,message) VALUES (?,?,?,?)",
              [convo_id, myid, msg.messageType, msg.message],
              (err, messageresult) => {
                if (err) throw err;
                else {
                  const msgId = messageresult["insertId"];
                  mysqlConnection.query(
                    'SELECT * from conversation_messages where message_id= "' +
                      msgId +
                      '"',
                    (err, messageRow) => {
                      if (err) throw err;
                      else {
                        console.log("message added in convo");
                        console.log(messageRow);
                        socket.emit("newmessage", messageRow);
                        //send notification to reciever
                        mysqlConnection.query(
                          'SELECT username from user where userid = "' +
                            myid +
                            '" ',
                          (err, result) => {
                            if (err) {
                              throw err;
                            }
                            var a = Object.keys(result).length;
                            if (a == 1) {
                              mysqlConnection.query(
                                'Select firebase_cloudmsg_fcmtoken from huzku.user where userid= "' +
                                  secondUserID +
                                  '"',
                                (err, data) => {
                                  if (err) throw err;

                                  var b = Object.keys(data).length;
                                  if (b == 1) {
                                    var usertoken =
                                      data[0]["firebase_cloudmsg_fcmtoken"];
                                    const message = {
                                      notification: {
                                        title: "Huzku",
                                        body:
                                          result[0]["username"] +
                                          " sent you a new message ",
                                      },
                                      token: usertoken,
                                    };

                                    // Send a message to the device corresponding to the provided
                                    // registration token.
                                    const Messaging = admin
                                      .messaging()
                                      .send(message)
                                      .then((response) => {
                                        // Response is a message ID string.
                                        console.log(
                                          "Successfully sent message:",
                                          response
                                        );
                                      })
                                      .catch((error) => {
                                        console.log(
                                          "Error sending message:",
                                          error
                                        );
                                      });
                                    // res.status(200).json({
                                    //   code: 200,
                                    //   message: "User found",
                                    //   user: result,
                                    // });
                                  }
                                }
                              );
                            } else {
                              res
                                .status(400)
                                .json({ message: "No user found" });
                            }
                          }
                        );
                      }
                    }
                  );
                }
              }
            );
          }
        }
      );
    }

    
  });
  socket.on("connect", function () {});

  socket.on("disconnect", function () {
    console.log("socket disconnect...", socket.id);
    //handleDisconnect()
  });

  socket.on("error", function (err) {
    console.log("received error from socket:", socket.id);
    console.log(err);
  });
});
