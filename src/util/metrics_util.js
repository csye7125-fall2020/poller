const client = require("prom-client");
const register = new client.Registry();

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register });

register.setDefaultLabels({
    app: 'poller'
});

module.exports = {
    histogram: new client.Histogram({
        name: 'poller_timed_kafka_calls',
        help: 'The time taken to process database queries'
    })
}
