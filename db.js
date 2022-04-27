const mysql = require("mysql");

const config = {
  host: "huzku.cjqjqavd5tr4.us-east-2.rds.amazonaws.com",
  user: "huzku", //"hb",
  //password: "Mysqldatabase002", //"nmnmnmnm",
  password: "huzku2345", //"nmnmnmnm",
  database: "huzku",
  multipleStatements: true,
  };
module.exports = mysqlConnection = mysql.createConnection(config);
mysqlConnection.connect((err) => {
  if (!err) {
    console.log("Database Connection Established Successfully");
  } else {
    console.log("Connection Failed!" + JSON.stringify(err, undefined, 2));
  }
});