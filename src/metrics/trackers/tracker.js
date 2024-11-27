class MetricsTracker {
  // private prefix: string;
  // private generator: MetricGenerator;
  // private metrics: Object;

  constructor(prefix, generator) {
    this.prefix = prefix;
    this.generator = generator;
    this.metrics = {};
  }

  /** Flushes any pending changes into the generator for consumption. */
  flush() {
    this._bufferMetrics(this.metrics);
  }

  _bufferMetrics(metricsObj) {
    this.generator.bufferMetric(this.prefix, metricsObj);
  }
}

module.exports = MetricsTracker;
