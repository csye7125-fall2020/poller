"use strict";
const db = require("../db/db-config");
const Watch = db.watch;
const Alert = db.alert;
const uuid = require('uuid');

exports.addWatch = (watch) => {
    return Watch.create({
        watch_id: watch.watch_id,
        user_id: watch.user_id,
        zipcode: watch.zipcode
    });
}

exports.addAlert = (alerts, watch_id) => {
    for (let i in alerts) {
        alerts[i]["watch_id"] = watch_id;
    }
    return Alert.bulkCreate(alerts);
}

exports.isWatchExist = function (watch_id) {
    // return Watch.findAll({
    //     where: {
    //         watch_id: watch_id
    //     }
    // });
    return Watch.count({ where: { watch_id: watch_id } })
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
            watch_id: watch.watch_id
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

exports.deleteAlerts = (watch_id) => {
    return Alert.destroy({
        where: {
            watch_id: watch_id
        }
    });
}

exports.getWatchesZipGrouped = function () {
    return Watch.findAll({
        attributes: ['zipcode']
    },
                            { group : ['zipcode'] });
}

exports.getAllWatches = function () {
    return Watch.findAll(
        { plain: true, raw: true, nest: true }
    );
}