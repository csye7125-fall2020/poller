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
        //                     '"watch_id": "d290f1ee-6c54-4b01-90e6-d701748f0851",'+
        //                     '"user_id": "d290f1ee-6c54-4b01-90e6-d701748f0851", '+
        //                     '"watch_created": "2016-08-29T09:12:33.001Z", '+
        //                     '"watch_updated": "2016-08-29T09:12:33.001Z", '+
        //                     '"zipcode": "02115",'+
        //                     '"alerts": ['+
        //                         '{'+
        //                             '"alert_id": "d290f1ee-6c54-4b01-90e6-d701748f0851",'+
        //                             '"alert_created": "2016-08-29T09:12:33.001Z",'+
        //                             '"alert_updated": "2016-08-29T09:12:33.001Z",'+
        //                             '"field_type": "temp_min",'+
        //                             '"operator": "lt",'+
        //                             '"value": 40'+
        //                         '},'+
        //                         '{'+
        //                             '"alert_id": "d290f1ee-6c54-4b01-90e6-d701748f0852",'+
        //                             '"alert_created": "2016-08-29T09:12:33.001Z",'+
        //                             '"alert_updated": "2016-08-29T09:12:33.001Z",'+
        //                             '"field_type": "temp_max",'+
        //                             '"operator": "gt",'+
        //                             '"value": 80'+
        //                         '}'+
        //                     ']'+
        //                 '}';

        var watchJson = JSON.parse(message.value);
        console.log("watchjson id: " + watchJson.watch_id)

        if (!watchService.isWatchExist(watchJson.watch_id)) {
            watchService.addWatch(watchJson)
                .then(watch_data => {
                    watchService.addAlert(watchJson.alerts, watch_data.watch_id)
                        .then(alert_data => {
                            console.log("watch and alert saved successfully");
                        }).catch(e => console.log("error", e));
                }).catch(e => console.log("error", e));
            // })
            // .catch(error => {
            //     res.status(400).json({ response: error.message });
            // });
        } else {
            watchService.deleteAlerts(watchJson.watch_id);
            watchService.updateWatch(watchJson)
                .then(watch_data => {
                    watchService.addAlert(watchJson.alerts, watchJson.watch_id)
                        .then(alert_data => {
                            console.log("watch and alert saved successfully");
                        }).catch(e => console.log("error", e));
                }).catch(e => console.log("error", e));
        
        }
        
    });
    consumer.on("error", function (err) {
        console.log("error", err);
    });
} catch (e) {
    console.log(e);
}
