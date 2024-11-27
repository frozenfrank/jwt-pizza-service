const MetricsTracker = require("./tracker.js");

class LatencyMetricsTracker extends MetricsTracker {

  constructor(generator) {
    super("lat", generator);
  }

  logLatency(metricName, fn) {
    const start = new Date();
    try {
      fn();
    } catch (error) {
      const metricNameStr = metricName+"_failures";
      this.metrics[metricNameStr] ||= 0;
      this.metrics[metricNameStr]++;
      throw error;
    } finally {
      const end = new Date();
      const latency = (start - end);
      this._bufferMetrics({[metricName]: latency});
    }
  }
}

module.exports = LatencyMetricsTracker;
