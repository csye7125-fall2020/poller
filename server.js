const express = require("express");
const app = express();

const bodyParser = require("body-parser");
const http = require("http");

const db = require("./db/db-config");
db.sequelize.sync({ force: false }).then(() => {
  console.log("Synchronizing Database...");
});

app.use(bodyParser.json());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, parameterLimit: 50000 }));

const routes = require("./api/routes");
routes(app);

// Shouldn't be publically accessible
// const port = process.env.PORT || 3001;
// app.listen(port, function () {
//   console.log("Server started on port: " + port);
// });

