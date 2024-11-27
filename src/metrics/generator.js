const {serializeMetrics, nowString} = require('./metrics-helper.js');

class MetricGenerator {
  // private buffer: (Partial<PizzaServiceMetrics> & {prefix: string, now: string})[];
  // private metricsSource: string;

  constructor(metricsSource) {
    this.buffer = [];
    this.metricsSource = metricsSource;
  }

  bufferMetric(prefix, metricsObj) {
    if (!prefix) {
      console.warn("Cannot buffer metric without a prefix");
      return;
    }
    if (!metricsObj || !Object.entries(metricsObj).length) {
      return; // No metrics
    }
    this.buffer.push({...metricsObj, prefix, now: nowString()});
  }

  formatPromString(prefix, metricsStr, now) {
    return `${prefix},source=${this.metricsSource} ${metricsStr} ${now || nowString()}`;
  }

  flush() {
    // Pull items from the buffer in a single operation to maximize thread safety.
    const buffered = this.buffer.splice(0, this.buffer.length);
    return buffered.map(met => {
      const {prefix, now, metrics} = met;
      return this.formatPromString(prefix, serializeMetrics(metrics), now);
    }).join("\n");
  }
}

module.exports = MetricGenerator;
