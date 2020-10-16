const kafka = require("kafka-node");
const bp = require("body-parser");
const config = require("../config/config");
const watchService = require("./WatchService");
const request = require('request');

var schedule = require("node-schedule");
const { watch } = require("fs");

const cronMinutes = process.env.cron || "1";
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
        const Producer = kafka.Producer;
        const client = new kafka.KafkaClient();
        const producer = new Producer(client);
        //   const kafka_producer_topic = "test";
        console.log("Kafka producer topic: " + config.kafka_producer_topic);



        // var zipcodes = watchService.getWatchesZipGrouped();
        // console.log("zip codes:" + zipcodes);
        // var watches = watchService.getAllWatches();
        // console.log("watches:" + watches);

        /* Testing start 
        let payloads = [
            {
                topic: config.kafka_producer_topic,
                messages: config.kafka_producer_topic,
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
         Testing end */

        watchService.getWatchesZipGrouped()
            .then(zipcodes => {
                console.log("zip codes:" + zipcodes);
                zipcodes.forEach((item) => {
                    var zipcode = item.zipcode
                    console.log("zip code:" + zipcode)

                    request('http://api.openweathermap.org/data/2.5/weather?zip=' + zipcode + ',us&appid=d21f9ac0bc41005e8c7f680bbf5fbd58&units=imperial', function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            // console.log("resp body" + body)

                            var mainData = body.main;

                            watchService.getAllWatches()
                                .then(watches => {
                                    // console.log("watches:" + JSON.stringify(watches));
                                    watches.forEach((watchitem) => {
                                        if (watchitem.zipcode == zipcode) {
                                            watchitem["main"] = mainData;
                                            let payloads = [
                                                {
                                                    topic: config.kafka_producer_topic,
                                                    messages: JSON.stringify(watchitem),
                                                },
                                            ];

                                            console.log("Payload:" + JSON.stringify(watchitem));

                                            producer.on("ready", function () {
                                                console.log("producer ready");
                                                let push_status = producer.send(payloads, (err, data) => {
                                                    console.log("producer sent");
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
                                        }
                                    });
                                });
                        }
                    });

                });
            });


    } catch (e) {
        console.log(e);
    }
}
