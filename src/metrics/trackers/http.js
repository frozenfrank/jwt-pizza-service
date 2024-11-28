const MetricsTracker = require("./tracker.js");

class HttpMetricsTracker extends MetricsTracker {

  constructor(generator) {
    super("http", generator);
    this.metrics.total_requests = 0;
    this.metrics.results_success = 0;
    this.metrics.results_error = 0;
  }

  incrementRequests(method) {
    const method_field = "requests_" + method.toLowerCase();
    if (method_field === "total") return; // Disallow messing with the total
    this.metrics[method_field] ||= 0;
    this.metrics[method_field]++;
    this.metrics.total_requests++;
  }

  incrementResults(statusCode) {
    const status100 = Math.floor(statusCode/100) * 100;
    const result_field = "results_" + status100;

    this.metrics[result_field] ||= 0;
    this.metrics[result_field]++;

    if (status100 === 200) {
      this.metrics.results_success++;
    } else {
      this.metrics.results_error++;
    }
  }
}

module.exports = HttpMetricsTracker;
