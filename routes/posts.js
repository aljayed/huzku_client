const express = require("express");
const postsrouter = express.Router();
var currentDate = new Date();
const multer = require("multer");
const DIR = "./public/postimages";
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
// var mysqlConnection = require("../app");
const mysqlConnection = require('../db');
const fs = require("fs");

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

postsrouter.post("/uploadpost", upload.single("image"), (req, res) => {
  const imagepath = req.file.filename;
  const userid = req.body.userid;
  const username = req.body.username;
  const title = req.body.title;
  const caption = req.body.caption;
  const location = req.body.location;
  const date = req.body.date;

  mysqlConnection.query(
    "INSERT INTO post (userid,username, imagepath, title, caption, location, date) VALUES (?,?,?,?,?,?,?)",
    [userid, username, imagepath, title, caption, location, date],
    (err, data) => {
      if (err) {
        console.log(err);
      } else {
        mysqlConnection.query(
          'UPDATE huzku.user SET noofposts = noofposts + 1  WHERE userid= "' +
            userid +
            '";',
          (err, result) => {
            if (err) {
              throw err;
            } else {
              res.status(200).json({
                code: 200,
                message: "No of post incremented in user successfull",
                postdata: data,
                incrementpostdata: result,
              });
            }
          }
        );
      }
    }
  );
});

postsrouter.post("/editpost/:postid", (req, res) => {
  mysqlConnection.query(
    "UPDATE huzku.post SET ? WHERE postid = ? ;",
    [req.body, req.params.postid],
    (err, result) => {
      if (err) {
        throw err;
      } else {
        res.status(200).json({
          code: 200,
          message: "Post edited successfull",
          postdata: result,
        });
      }
    }
  );
});

//show all posts of user

postsrouter.get("/showusersallposts", (req, res) => {
  const userid = req.body.userid;
  mysqlConnection.query(
    'SELECT * from huzku.post WHERE userid= "' + userid + '" order by huzku.post.createdAt DESC;',
    (err, result) => {
      if (err) throw err;
      else {
        var n = Object.keys(result).length;
        console.log(result);
        for (let i = 0; i < n; i++) {
          const date=result[i].createdAt;
          console.log(date);
        }
        res.status(200).json({
          code: 200,
          message: "User posts are",
          posts: result,
        });
      }
    }
  );
});

postsrouter.post("/deletepost", (req, res) => {
  const postid = req.body.postid;
  mysqlConnection.query(
    'SELECT imagepath, userid from huzku.post WHERE postid= "' + postid + '";',
    (err, result) => {
      if (err) throw err;
      else {
        //   const imagename = result[0].imagepath;
        //  // console.log(imagename[0].imagepath);
        //  console.log(imagename);
        //   res.status(200).json({
        //     code: 200,
        //     message: "User Post Deleted",
        //     posts: result,
        //   });
        const imagename = result[0].imagepath;
        const userid = result[0].userid;
        mysqlConnection.query(
          'DELETE from huzku.post WHERE postid= "' + postid + '";',
          (err, data) => {
            if (err) throw err;
            else {
              console.log("deleting image");
              fs.unlinkSync("./public/postimages/" + imagename);
              // res.status(200).json({
              //   code: 200,
              //   message: "User Post Deleted",
              //   post: newresult,
              // });
              mysqlConnection.query(
                'UPDATE huzku.user SET noofposts = noofposts - 1  WHERE userid= "' +
                  userid +
                  '";',
                (err, result) => {
                  if (err) {
                    throw err;
                  } else {
                    res.status(200).json({
                      code: 200,
                      message: "No of post decremented in user ",
                      postdata: data,
                      incrementpostdata: result,
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

postsrouter.get("/getnewsfeed", (req, res) => {
  const myuserid = req.body.userid;
  mysqlConnection.query(
    'SELECT * FROM huzku.post where userid in (SELECT following_to_user_id from huzku.followers WHERE followeruser_id="' +
      myuserid +
      '") order by huzku.post.createdAt DESC;',
    (err, result) => {
      if (err) throw err;
      else {
        console.log(result);
        var n = Object.keys(result).length;
        console.log(result);
        for (let i = 0; i < n; i++) {
          const date=result[i].createdAt;
          
          var d = new Date(date);
          //console.log(date);
          console.log(d.toString());
        }
        
        res.status(200).json({
          code:200,
          message:"Posts are",
          data:result
        });
      }
    }
  );
});

module.exports.postsrouter = postsrouter;
