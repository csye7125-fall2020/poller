module.exports = {
    kafka_consumer_topic: "watch",
    kafka_producer_topic: "weather",
    kafka_server: "localhost:2181",
    kafka_host: process.env.KAFKA_HOST || 'kafka:9092'
};
