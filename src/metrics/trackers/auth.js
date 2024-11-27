const MetricsTracker = require("./tracker.js");

class AuthMetricsTracker extends MetricsTracker {
  constructor(generator) {
    super("auth", generator);
    this.metrics.successful = 0;
    this.metrics.failed = 0;
  }

  logAuthAttempt(successful) {
    if (successful) {
      this.metrics.successful++;
    } else {
      this.metrics.failed++;
    }
  }
}

module.exports = AuthMetricsTracker;
