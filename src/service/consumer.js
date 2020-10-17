const kafka = require("kafka-node");
const bp = require("body-parser");
const config = require("../config/config");
const userService = require("./UserService");
const watchService = require("./WatchService");

const db = require("../db/db-config");
db.sequelize.sync({ force: false }).then(() => {
    console.log("Synchronizing Database...");
});

try {
    const Consumer = kafka.Consumer;
    const client = new kafka.KafkaClient();
    let consumer = new Consumer(
        client,
        [{ topic: config.kafka_consumer_topic, partition: 0 }],
        {
            autoCommit: true,
            fetchMaxWaitMs: 1000,
            fetchMaxBytes: 1024 * 1024,
            encoding: "utf8",
            fromOffset: false,
        }
    );
    consumer.on("message", async function (message) {
        // console.log("here");
        console.log("kafka-> ", message.value);

        // Test JSON
        // var watchJson = '{'+
        //                     '"watchId": "d290f1ee-6c54-4b01-90e6-d701748f0851",'+
        //                     '"userId": "d290f1ee-6c54-4b01-90e6-d701748f0851", '+
        //                     '"createdAt": "2016-08-29T09:12:33.001Z", '+
        //                     '"updatedAt": "2016-08-29T09:12:33.001Z", '+
        //                     '"zipcode": "02115",'+
        //                     '"alerts": ['+
        //                         '{'+
        //                             '"alertId": "d290f1ee-6c54-4b01-90e6-d701748f0851",'+
        //                             '"createdAt": "2016-08-29T09:12:33.001Z",'+
        //                             '"updatedAt": "2016-08-29T09:12:33.001Z",'+
        //                             '"fieldType": "temp_min",'+
        //                             '"operator": "lt",'+
        //                             '"value": 40'+
        //                         '},'+
        //                         '{'+
        //                             '"alertId": "d290f1ee-6c54-4b01-90e6-d701748f0852",'+
        //                             '"createdAt": "2016-08-29T09:12:33.001Z",'+
        //                             '"updatedAt": "2016-08-29T09:12:33.001Z",'+
        //                             '"fieldType": "temp_max",'+
        //                             '"operator": "gt",'+
        //                             '"value": 80'+
        //                         '}'+
        //                     ']'+
        //                 '}';

        var watchJson = JSON.parse(message.value);
        console.log("watchjson id: " + watchJson.watchId)

        watchService.isWatchExist(watchJson.watchId)
            .then(existingWatchCount => {
                if (existingWatchCount <= 0) {
                    watchService.addWatch(watchJson)
                        .then(watch_data => {
                            watchService.addAlert(watchJson.alerts, watch_data.watchId)
                                .then(alert_data => {
                                    console.log("watch and alert saved successfully");
                                }).catch(e => console.log("error", e));
                        }).catch(e => console.log("error", e));
                    // })
                    // .catch(error => {
                    //     res.status(400).json({ response: error.message });
                    // });
                } else {
                    watchService.deleteAlerts(watchJson.watchId);
                    if (watchJson.isDeleted == true) {
                        watchService.deleteWatch(watchJson.watchId)
                            .then(watch_data => {
                                console.log("watch and alert deleted successfully");
                            }).catch(e => console.log("error", e));
                    } else {
                        watchService.updateWatch(watchJson)
                            .then(watch_data => {
                                watchService.addAlert(watchJson.alerts, watchJson.watchId)
                                    .then(alert_data => {
                                        console.log("watch and alert updated successfully");
                                    }).catch(e => console.log("error", e));
                            }).catch(e => console.log("error", e));
                    }

                }
            });
        
        
    });
    consumer.on("error", function (err) {
        console.log("error", err);
    });
} catch (e) {
    console.log(e);
}
