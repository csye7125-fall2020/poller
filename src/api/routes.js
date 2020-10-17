"use strict";

const controller = require("./controller");

module.exports = function (app) {
  app.route("/about").get(controller.about);
  app.route("/weather/:zipcode").get(controller.getWeather);
};
