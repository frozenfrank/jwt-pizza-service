const MetricsTracker = require("./tracker.js");

class LatencyMetricsTracker extends MetricsTracker {

  constructor(generator) {
    super("lat", generator);
    this.metrics.lat_failed_requests = 0;
  }

  logLatency(metricName, fn) {
    const start = new Date();
    try {
      fn();
    } catch (error) {
      this.metrics.lat_failed_requests++;
      throw error;
    } finally {
      const end = new Date();
      const latency = (start - end);
      this._bufferMetrics({[metricName]: latency});
    }
  }
}

module.exports = LatencyMetricsTracker;
