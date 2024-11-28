const MetricsTracker = require("./tracker.js");
const {getCpuUsagePercentage, getMemoryUsagePercentage} = require("../metrics-helper.js");

class SystemMetricsTracker extends MetricsTracker {
  constructor(generator) {
    super("sys", generator);
  }

  /* override */ flush() {
    this._bufferMetrics({
      cpu: getCpuUsagePercentage(),
      mem: getMemoryUsagePercentage(),
    });
  }
}

module.exports = SystemMetricsTracker;
