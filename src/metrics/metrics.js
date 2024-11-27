const config = require('../config.json').metrics;
const MetricGenerator = require('./generator.js');
const AuthMetricsTracker = require('./trackers/auth.js');
const HttpMetricsTracker = require('./trackers/http.js');
const LatencyMetricsTracker = require('./trackers/latency.js');
const SalesMetricsTracker = require('./trackers/sales.js');
const SystemMetricsTracker = require('./trackers/system.js');
const UserMetricsTracker = require('./trackers/users.js');

class Metrics {
  // private generator: MetricGenerator;
  // private trackers: Record<String, MetricsTracker>;
  // private trackersList: MetricsTracker[];
  // private periodicTimer: NodeJS.Timeout;

  constructor() {
    const generator = new MetricGenerator(config.metrics.source);
    this.generator = generator;
    this.trackers = {
      Http: new HttpMetricsTracker(generator),
      User: new UserMetricsTracker(generator),
      Auth: new AuthMetricsTracker(generator),
      System: new SystemMetricsTracker(generator),
      Sales: new SalesMetricsTracker(generator),
      Latency: new LatencyMetricsTracker(generator),
    };
    this.trackersList = Object.values(this.trackers);

    this._initPeriodicMetricTrackerSend(3000);
  }

  // Required to use outside of the class
  // These publicly expose mechanisms to report additional behaviors.

  requestTracker(req, res, next) {
    this.trackers.Http.incrementRequests(req.method);
    this.trackers.User.trackActiveUser(req.user?.id)
    res.on('finish', () => {
      console.log(`Request: ${req.method} ${req.url} - Status: ${res.statusCode}`);
      this.trackers.Http.incrementResults(res.statusCode);
    });
    this.trackers.Latency.logLatency("service", () => next());
  }

  logAuthAttempt(successful) {
    this.trackers.Auth.logAuthAttempt(successful);
  }

  logSaleSuccessful(revenue) {
    this.trackers.Sales.recordSale(revenue);
  }

  logSaleFailure() {
    this.trackers.Sales.recordFailure();
  }

  trackPizzaCreationLatency(fn) {
    this.trackers.Latency.logLatency("factory", fn);
  }

  // Internal helpers

  _initPeriodicMetricTrackerSend(period) {
    if (this.periodicTimer) {
      clearInterval(this.periodicTimer);
    }
    this.periodicTimer = setInterval(() => {
      try {
        this._sendMetricTrackersToGrafana();
      } catch (error) {
        console.log('Error sending metrics', error);
      }
    }, period);
    this.periodicTimer.unref();
  }
  _sendMetricTrackersToGrafana() {
    this.trackersList.map(t => t.flush());
    const bufferedPromString = this.generator.flush();
    this._doSendMetricsToGrafana(bufferedPromString);
  }
  sendMetricToGrafana(metricPrefix, metricsStr) {
    const metric = this._formatPromString(metricPrefix, metricsStr);
    this._doSendMetricsToGrafana(metric);
  }
  _doSendMetricsToGrafana(promString) {
    fetch(`${config.url}`, {
      method: 'post',
      body: promString,
      headers: { Authorization: `Bearer ${config.userId}:${config.apiKey}` },
    })
      .then((response) => {
        if (!response.ok) {
          console.error('Failed to push metrics data to Grafana');
        } else {
          console.log(`Pushed ${promString.replaceAll("\n", "\n  ")}`);
        }
      })
      .catch((error) => {
        console.error('Error pushing metrics:', error);
        console.warn(`Dropped metrics due to error: ${promString}`);
      });
  }
}

const metrics = new Metrics();
module.exports = metrics;
