const {QueryTypes} = require('sequelize');
const kafka = require('kafka-node');
const config = require("../config/config");
const db = require("../db/db-config");
const logger_util = require("../util/logger_util");
const logger = logger_util.logger;

exports.health = (req, res) => {
    try {
        db.sequelize.query("SELECT 'MySQL up and running' as resp", {type: QueryTypes.SELECT})
            .then(succ => {
                if (succ) {
                    console.log("Db connection success.. DB Health OK");

                    const client = new kafka.KafkaClient({kafkaHost: config.kafka_host});

                    client.loadMetadataForTopics(["watch", "weather"], (err, resp) => {
                        if (err && err.message.includes("Request timed out")) {
                            logger.error("Request timed out while reading kafka topics");
                            return res.status(503).json({
                                health: "DOWN",
                                dbConnection: "success",
                                kafkaConnection: "fail",
                                status: "NOT READY",
                                cause: err.message
                            });
                        } else if (err) {
                            logger.error("Kafka is down");
                            return res.status(400).json({
                                health: "DOWN",
                                dbConnection: "success",
                                kafkaConnection: "fail",
                                status: "ERROR",
                                cause: err
                            });
                        }
                        logger.info("Poller Health is UP");
                        console.log(JSON.stringify(resp));
                        res.status(200).json({health: "UP"});
                    });
                }
            })
            .catch(err => {
                logger.error("Poller Health is DOWN");
                return res.status(400).json({
                    health: "DOWN",
                    dbConnection: "success",
                    kafkaConnection: "fail",
                    status: "ERROR",
                    cause: err
                });
            });
    } catch (e) {
        return res.status(400).json({health: "DOWN", status: "ERROR", cause: err});
    }
}
