"use strict";
const db = require("../db/db-config");
const Watch = db.watch;
const Alert = db.alert;
const uuid = require('uuid');

exports.addWatch = (watch) => {
    return Watch.create({
        watchId: watch.watchId,
        userId: watch.userId,
        zipcode: watch.zipcode
    });
}

exports.addAlert = (alerts, watchId) => {
    for (let i in alerts) {
        alerts[i]["watchId"] = watchId;
    }
    return Alert.bulkCreate(alerts);
}

exports.isWatchExist = function (watchId) {
    return Watch.count({ where: { watchId: watchId } })
        .then(count => {
            if (count != 0) {
                return true;
            }
            return false;
        });
}

exports.updateWatch = (watch) => {
    return Watch.update(watch, {
        where: {
            watchId: watch.watchId
        }
    });
}

exports.updateAlert = (alert) => {
    return Alert.update(alert, {
        where: {
            alertId: alert.alertId
        }
    });
}

exports.deleteWatch = (watchId) => {
    return Watch.destroy({
        where: {
            watchId: watchId
        }
    });
}

exports.deleteAlerts = (watchId) => {
    return Alert.destroy({
        where: {
            watchId: watchId
        }
    });
}

exports.getWatchesZipGrouped = function () {
    return Watch.findAll(
        { attributes: ['zipcode'] },
        { group: ['zipcode'] }
    );
}

exports.getAllWatches = function () {
    return Watch.findAll(
        { raw: true, nest: true }
    );
}