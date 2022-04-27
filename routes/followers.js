const express = require("express");
const followersrouter = express.Router();
var currentDate = new Date();

const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
//var mysqlConnection = require("../app");
const mysqlConnection = require("../db");
var admin = require("firebase-admin");
var serviceAccount = require("../huzku-3221-firebase-adminsdk-esa2h-f26976c812.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//get user details from id

followersrouter.get("/getuserbyid", (req, res) => {
  const id = req.body.userid;
  mysqlConnection.query(
    'SELECT * from user where id = "' + id + '" ',
    (err, result) => {
      if (err) {
        throw err;
      }
      var a = Object.keys(result).length;
      if (a == 1) {
        res.status(200).json({
          code: 200,
          message: "User found",
          user: result,
        });
      } else {
        res.status(400).json({ message: "No user found" });
      }
    }
  );
});

//follow user
followersrouter.post("/followotheruser", (req, res) => {
  const followeruser_id = req.body.followeruserid;
  const followingtouser_id = req.body.followingtouserid;
  mysqlConnection.query(
    "INSERT into followers (followeruser_id, following_to_user_id) VALUES (?,?)",
    [followeruser_id, followingtouser_id],
    (err, result) => {
      if (err) {
        throw err;
      } else {
        // res.status(200).json({
        //   code: 200,
        //   message: "Followed successfull",
        //   user: result,
        // });
        console.log("adding in follower followings ");
        mysqlConnection.query(
          'UPDATE huzku.user SET nooffollowings = nooffollowings + 1  WHERE userid= "' +
            followeruser_id +
            '";',
          (err, result) => {
            if (err) {
              throw err;
            } else {
              console.log("adding in following to ");
              mysqlConnection.query(
                'UPDATE huzku.user SET nooffollowers = nooffollowers + 1  WHERE userid= "' +
                  followingtouser_id +
                  '";',
                (err, myresult) => {
                  if (err) {
                    throw err;
                  } else {
                    // res.status(200).json({
                    //   code: 200,
                    //   message:
                    //     "Followed and incremented follower/following successfull",
                    //   user: result,
                    // });
                    mysqlConnection.query(
                      'SELECT username from user where userid = "' +
                        followeruser_id +
                        '" ',
                      (err, result) => {
                        if (err) {
                          throw err;
                        }
                        var a = Object.keys(result).length;
                        if (a == 1) {
                          mysqlConnection.query(
                            'Select firebase_cloudmsg_fcmtoken from huzku.user where userid= "' +
                              followeruser_id +
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
                                      " has started following you ",
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
                                res.status(200).json({
                                  code: 200,
                                  message: "User found",
                                  user: result,
                                });
                              }
                            }
                          );
                        } else {
                          res.status(400).json({ message: "No user found" });
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
});

// Unfollow user
followersrouter.post("/unfollowuser", (req, res) => {
  const followeruser_id = req.body.followeruserid;
  const followingtouser_id = req.body.followingtouserid;
  mysqlConnection.query(
    'DELETE from followers where followeruser_id = "' +
      followeruser_id +
      '" and following_to_user_id =  "' +
      followingtouser_id +
      '"',
    (err, result) => {
      if (err) {
        throw err;
      } else {
        console.log("removed from following table");
        // res.status(200).json({
        //   code: 200,
        //   message: "Unfollowed successfully",
        //   data: result,
        // });
        mysqlConnection.query(
          'UPDATE huzku.user SET nooffollowings = nooffollowings - 1  WHERE userid= "' +
            followeruser_id +
            '";',
          (err, result) => {
            var n = Object.keys(result).length;
            if (err) {
              throw err;
            } else {
              console.log("removed in following to ");
              mysqlConnection.query(
                'UPDATE huzku.user SET nooffollowers = nooffollowers - 1  WHERE userid= "' +
                  followingtouser_id +
                  '";',
                (err, result) => {
                  if (err) {
                    throw err;
                  } else {
                    res.status(200).json({
                      code: 200,
                      message:
                        "UnFollowed and decremented follower/following successfull",
                      user: result,
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

//user followers
followersrouter.get("/showuserfollowers", (req, res) => {
  const user_id = req.body.user_id;
  mysqlConnection.query(
    // 'SELECT followeruser_id FROM followers WHERE following_to_user_id ="' +
    //   user_id +
    //   '"',
    'SELECT followeruser_id, username, email, bio, imagepath, nooffollowers, nooffollowings,noofposts FROM huzku.followers inner join user on followers.followeruser_id = user.userid where following_to_user_id="' +
      user_id +
      '";',
    (err, result) => {
      if (err) {
        throw err;
      }
      var n = Object.keys(result).length;
      if (n == 0) {
        //res.json("username already exists");
        res.status(200).json({
          code: 200,
          message: "No followers",
          user: result,
        });
      } else {
        res.status(200).json({
          code: 200,
          message: "User followers",
          user: result,
        });
      }
    }
  );
});

//user followings
followersrouter.get("/showuserfollowings", (req, res) => {
  const user_id = req.body.user_id;
  mysqlConnection.query(
    // 'SELECT following_to_user_id FROM followers WHERE followeruser_id ="' +
    //   user_id +
    //   '"',
    'SELECT following_to_user_id, username, email, bio, imagepath, nooffollowers, nooffollowings,noofposts FROM huzku.followers inner join user on followers.following_to_user_id = user.userid where followeruser_id="' +
      user_id +
      '";',
    (err, result) => {
      if (err) {
        throw err;
      }
      var n = Object.keys(result).length;
      if (n == 0) {
        //res.json("username already exists");
        res.status(200).json({
          code: 200,
          message: "No followings",
          user: result,
        });
      } else {
        res.status(200).json({
          code: 200,
          message: "User followings",
          user: result,
        });
      }
    }
  );
});

//count user followers
followersrouter.get("/countuserfollowers", (req, res) => {
  const userid = req.body.user_id;
  mysqlConnection.query(
    'SELECT COUNT(*) FROM followers WHERE following_to_user_id ="' +
      userid +
      '"',
    (err, result) => {
      if (err) throw err;
      else {
        res.status(200).json({
          code: 200,
          message: "User followings",
          user: result,
        });
      }
    }
  );
});

//check a user follows other user
followersrouter.get("/checkuserfollowsotheruser", (req, res) => {
  const followeruserid = req.body.followeruserid;
  const followingtouserid = req.body.followingtouserid;
  mysqlConnection.query(
    'SELECT COUNT(*) FROM followers WHERE following_to_user_id ="' +
      followingtouserid +
      '" and followeruser_id ="' +
      followeruserid +
      '"',
    (err, result) => {
      if (err) throw err;
      else {
        res.status(200).json({
          code: 200,
          message: "User followings",
          user: result,
        });
      }
    }
  );
});

module.exports.followersrouter = followersrouter;
