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
        // var watchJson = '{' +
        //     '"watchId": "d290f1ee-6c54-4b01-90e6-d701748f0851",' +
        //     '"userId": "d290f1ee-6c54-4b01-90e6-d701748f0851",' +
        //     '"zipcode": "02115",' +
        //     '"createdAt": "2020-10-16T08:01:00.000Z",' +
        //     '"updatedAt": "2020-10-16T10:07:15.000Z",' +
        //     '"alerts": [' +
        //     '{' +
        //     '"alertId": "d290f1ee-6c54-4b01-90e6-d701748f0851",' +
        //     '"fieldType": "temp_min",' +
        //     '"operator": "lt",' +
        //     '"value": 40,' +
        //     '"createdAt": "2020-10-16T10:07:15.000Z",' +
        //     '"updatedAt": "2020-10-16T10:07:15.000Z",' +
        //     '"watchId": "d290f1ee-6c54-4b01-90e6-d701748f0851"' +
        //     '},' +
        //     '{' +
        //     '"alertId": "d290f1ee-6c54-4b01-90e6-d701748f0852",' +
        //     '"fieldType": "temp_max",' +
        //     '"operator": "gt",' +
        //     '"value": 80,' +
        //     '"createdAt": "2020-10-16T10:07:15.000Z",' +
        //     '"updatedAt": "2020-10-16T10:07:15.000Z",' +
        //     '"watchId": "d290f1ee-6c54-4b01-90e6-d701748f0851"' +
        //     '}' +
        //     '],' +
        //     '"main": {' +
        //     '"temp": 52.39,' +
        //     '"feels_like": 48.06,' +
        //     '"temp_min": 51.01,' +
        //     '"temp_max": 54,' +
        //     '"pressure": 1019,' +
        //     '"humidity": 93' +
        //     '}' +
        //     '}';

        var watchJson = JSON.parse(message.value);
        console.log("watchjson id: " + watchJson.watchId)



        if (!watchService.isWatchExist(watchJson.watchId)) {
            watchService.addWatch(watchJson)
                .then(watch_data => {
                    watchService.addAlert(watchJson.alerts, watch_data.watchId)
                        .then(alert_data => {
                            alertJson = alert_data.toJSON();                
                            console.log("alert_data: " + JSON.stringify(alertJson));
                            // console.log("watch and alert saved successfully");
                        }).catch(e => console.log("error", e));
                }).catch(e => console.log("error", e));
            // })
            // .catch(error => {
            //     res.status(400).json({ response: error.message });
            // });
        } else {

            var existingWatch = watchService.getWatch(watchJson.watchId);
            if (watchJson.updatedAt > existingWatch.updatedAt) {
                watchService.updateWatch(watchJson)
                    .then(watch_data => {
                        // watchService.addAlert(watchJson.alerts, watchJson.watchId)
                        //     .then(alert_data => {
                        //         console.log("watch and alert saved successfully");
                        //     }).catch(e => console.log("error", e));
                    }).catch(e => console.log("error", e));
            }

            // watchJson.alerts.forEach((alert) => {

            // });
            for (var i = 0; i < watchJson.alerts.length; i++){
                // iterate for each alert. compare and update. Alerts not contained in
                
            }

            watchService.deleteAlerts(watchJson.watchId);
            
        
        }
        
    });
    consumer.on("error", function (err) {
        console.log("error", err);
    });
} catch (e) {
    console.log(e);
}
