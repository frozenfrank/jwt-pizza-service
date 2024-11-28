const MetricsTracker = require("./tracker.js");

class LatencyMetricsTracker extends MetricsTracker {

  constructor(generator) {
    super("lat", generator);
  }

  async wrapLatency(metricName, fn) {
    const start = new Date();
    try {
      return await fn();
    } catch (error) {
      const metricNameStr = metricName+"_failures";
      this.metrics[metricNameStr] ||= 0;
      this.metrics[metricNameStr]++;
      throw error;
    } finally {
      this.logLatency(metricName, start);
    }
  }

  logLatency(metricName, start, end = new Date) {
    const latency = (end - start);
    this._bufferMetrics({[metricName]: latency});
  }
}

module.exports = LatencyMetricsTracker;
