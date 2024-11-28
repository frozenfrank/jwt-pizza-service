const MetricsTracker = require("./tracker.js");

class SalesMetricsTracker extends MetricsTracker {
  constructor(generator) {
    super("sales", generator);
    this.metrics.qty = 0;
    this.metrics.failed_requests = 0;
    this.metrics.revenue = 0;
  }

  recordSale(revenue) {
    this.metrics.qty++;
    this.metrics.revenue += revenue;
  }

  recordFailure() {
    this.metrics.failed_requests++;
  }
}

module.exports = SalesMetricsTracker;
