const kafka = require("kafka-node");
const bp = require("body-parser");
const config = require("../config/config");
const watchService = require("./WatchService");
const request = require('request');

var schedule = require("node-schedule");
const { watch } = require("fs");

const cronMinutes = process.env.cronminutes || "1";
const cronExpression = "*/" + cronMinutes + " * * * *";
var j = schedule.scheduleJob(cronExpression, function () {
    console.log(
        "Scheduling job for getting weather information every " +
        cronMinutes +
        " minutes"
    );
    kafkaProducer("");
});

kafkaProducer("");

function kafkaProducer(message) {
    try {
        /* Testing start */
        const Producer = kafka.Producer;
        const client = new kafka.KafkaClient();
        const producer = new Producer(client);
        console.log("Kafka producer topic: " + config.kafka_producer_topic);

        // Test JSON
        var watchJson = '{'+
                            '"watchId": "d290f1ee-6c54-4b01-90e6-d701748f0851",' +
                            '"userId": "d290f1ee-6c54-4b01-90e6-d701748f0851",' +
                            '"zipcode": "02115",' +
                            '"createdAt": "2020-10-16T08:01:00.000Z",' +
                            '"updatedAt": "2020-10-16T10:07:15.000Z",' +
                            '"alerts": [' +
                                '{' +
                                '"alertId": "d290f1ee-6c54-4b01-90e6-d701748f0851",' +
                                '"fieldType": "temp_min",' +
                                '"operator": "lt",' +
                                '"value": 40,' +
                                '"createdAt": "2020-10-16T10:07:15.000Z",' +
                                '"updatedAt": "2020-10-16T10:07:15.000Z",' +
                                '"watchId": "d290f1ee-6c54-4b01-90e6-d701748f0851"' +
                                '},' +
                                '{' +
                                '"alertId": "d290f1ee-6c54-4b01-90e6-d701748f0852",' +
                                '"fieldType": "temp_max",' +
                                '"operator": "gt",' +
                                '"value": 80,' +
                                '"createdAt": "2020-10-16T10:07:15.000Z",' +
                                '"updatedAt": "2020-10-16T10:07:15.000Z",' +
                                '"watchId": "d290f1ee-6c54-4b01-90e6-d701748f0851"' +
                                '}' +
                            '],' +
                            '"main": {' +
                                '"temp": 52.39,' +
                                '"feels_like": 48.06,' +
                                '"temp_min": 51.01,' +
                                '"temp_max": 54,' +
                                '"pressure": 1019,' +
                                '"humidity": 93' +
                            '}' +
                        '}';
    let payloads = [
        {
            topic: config.kafka_producer_topic,
            messages: watchJson,
        },
    ];

    producer.on("ready", async function () {
        let push_status = producer.send(payloads, (err, data) => {
            if (err) {
                console.log(
                    "[kafka-producer -> " +
                    config.kafka_producer_topic +
                    "]: broker update failed"
                );
            } else {
                console.log(
                    "[kafka-producer -> " +
                    config.kafka_producer_topic +
                    "]: broker update success"
                );
            }
        });
    });

    producer.on("error", function (err) {
        console.log(err);
        console.log(
            "[kafka-producer -> " +
            config.kafka_producer_topic +
            "]: connection errored"
        );
        throw err;
    });
    /* Testing end */




} catch (e) {
    console.log(e);
}
}
