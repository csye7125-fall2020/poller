const kafka = require("kafka-node");
const config = require("../config/config");
const watchService = require("./WatchService");
const client = require('prom-client');
const logger_util = require("../util/logger_util");
const metrics_util = require("../util/metrics_util");

const logger = logger_util.logger;
const histogram = metrics_util.histogram;

const consumedCounter = new client.Counter({
    name: 'poller_count_consumed_messages',
    help: 'The total number of messages consumed'
});

try {
    const end = histogram.startTimer();

    const options = {
        kafkaHost: config.kafka_host,
        groupId: 'WatchGroup',
        sessionTimeout: 15000,
        protocol: ['roundrobin'],
        fromOffset: 'earliest' // equivalent of auto.offset.reset valid values are 'none', 'latest', 'earliest'
    };
    const consumerGroup = new kafka.ConsumerGroup(options, config.kafka_consumer_topic);

    consumerGroup.on("message", async function (message) {
        consumedCounter.inc();

        const sec = end();
        console.log("Consumer response time for Consumer: ", sec);

        console.log("kafka-> ", message.value);
        console.log(
            '%s read msg Topic="%s" Partition=%s Offset=%d',
            this.client.clientId,
            message.topic,
            message.partition,
            message.offset
        );

        const watchJson = JSON.parse(message.value);
        console.log("watchJson id: " + watchJson.watchId)

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
                } else {
                    watchService.deleteAlerts(watchJson.watchId);
                    if (watchJson.isDeleted === true) {
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
    consumerGroup.on("error", function (err) {
        console.error("Error in Kafka Consumer", err.message);
    });
} catch (e) {
    console.error("Exception in Kafka Consumer", e.message);
}
