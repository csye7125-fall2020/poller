const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const client = require("prom-client");

const db = require("./db/db-config");
db.sequelize.sync({ force: false }).then(() => {
  console.log("Synchronizing Database...");
});

app.use(bodyParser.json());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, parameterLimit: 50000 }));

const routes = require("./api/routes");
routes(app);

app.get('/metrics', (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(client.register.metrics())
});

// Publicly accessible to Run health apis
const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server started on port: " + port);
});

