const kafka = require("kafka-node");
const config = require("../config/config");
const watchService = require("./WatchService");
const request = require('request');
const client = require('prom-client');
const schedule = require("node-schedule");

const logger_util = require("../util/logger_util");
const metrics_util = require("../util/metrics_util");

const logger = logger_util.logger;
const histogram = metrics_util.histogram;

const producedCounter = new client.Counter({
    name: 'producer_count_produced_messages',
    help: 'The total number of messages produced'
});

const cronMinutes = process.env.cronminutes || "1";
const cronExpression = "*/" + cronMinutes + " * * * *";
const j = schedule.scheduleJob(cronExpression, function () {
    console.log(
        "Scheduling job for getting weather information every " +
        cronMinutes +
        " minutes"
    );
    kafkaProducer("");
});

kafkaProducer("");

function kafkaProducer(message) {
    const end = histogram.startTimer();

    try {
        watchService.getWatchesZipGrouped()
            .then(zipcodes => {
                console.log("zip codes:" + zipcodes);
                zipcodes.forEach((item) => {
                    const zipcode = item.zipcode;
                    console.log("zip code:" + zipcode)

                    request('http://api.openweathermap.org/data/2.5/weather?zip=' + zipcode + ',us&appid=d21f9ac0bc41005e8c7f680bbf5fbd58&units=imperial', function (error, response, body) {
                        if (!error && response.statusCode === 200) {

                            const mainData = JSON.parse(response.body).main;

                            watchService.getAllWatches()
                                .then(watches => {
                                    watches.forEach((watchitem) => {
                                        if (watchitem.zipcode === zipcode) {
                                            const watch = watchitem.toJSON();
                                            watch["main"] = mainData;

                                            let payloads = [
                                                {
                                                    topic: config.kafka_producer_topic,
                                                    messages: JSON.stringify(watch),
                                                },
                                            ];

                                            const Producer = kafka.Producer;
                                            const client = new kafka.KafkaClient({kafkaHost: config.kafka_host});
                                            const options = {
                                                // Configuration for when to consider a message as acknowledged, default 1
                                                requireAcks: 1,
                                                // The amount of time in milliseconds to wait for all acks before considered, default 100ms
                                                ackTimeoutMs: 100,
                                                // Partitioner type (default = 0, random = 1, cyclic = 2, keyed = 3, custom = 4), default 0
                                                // random = 1 actually works for sending on different partitions
                                                partitionerType: 1
                                            };
                                            const producer = new Producer(client, options);
                                            console.log("Payload:" + JSON.stringify(watch));
                                            try {
                                                const sec = end();
                                                console.log("Kafka response time for Producer: ", sec);

                                                producer.on("ready", function () {
                                                    // console.log("producer ready");
                                                    let push_status = producer.send(payloads, (err, data) => {
                                                        // console.log("producer sent");
                                                        if (err) {
                                                            console.error(
                                                                "[kafka-producer -> " +
                                                                config.kafka_producer_topic +
                                                                "]: broker update failed"
                                                            );
                                                        } else {
                                                            producedCounter.inc();
                                                            console.log(
                                                                "[kafka-producer -> " +
                                                                config.kafka_producer_topic +
                                                                "]: broker update success"
                                                            );
                                                            console.log('sent data -> {"topic":{"partition":offset}}: ' + JSON.stringify(data));
                                                        }
                                                    });
                                                });
                                            } catch (e) {
                                                console.error(e);
                                            }

                                            producer.on("error", function (err) {
                                                console.error("Error in Producer", err);
                                                console.error(
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
        console.error("Exception in Kafka Producer", e);
    }
}
