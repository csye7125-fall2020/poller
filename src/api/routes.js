"use strict";

module.exports = function (app) {
  const controller = require("./controller");
  const healthCtrl = require("../controller/HealthCtrl");

  app.route("/about").get(controller.about);
  app.route("/weather/:zipcode").get(controller.getWeather);
  app.get("/health", healthCtrl.health);
};
