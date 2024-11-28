const config = require('../config.js').metrics;
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
  /** Higher levels of verbosity logs more things to the console.
   * * **SILENT** = 0
   * * **ERRORS** = 1
   * * **WARN** = 2
   * * **LOG** = 3
   * * **VERBOSE** = 4
   */
  VERBOSE = 3;

  constructor() {
    const generator = new MetricGenerator(config.source);
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

    this._initPeriodicMetricTrackerSend(30000);
  }

  // Required to use outside of the class
  // These publicly expose mechanisms to report additional behaviors.

  requestTracker(req, res, next) {
    this.trackers.Http.incrementRequests(req.method);
    this.trackers.User.trackActiveUser(req.user?.id);
    const start = new Date; // The next() function returns before the request is fully handled
    res.on('finish', () => {
      const end = new Date
      if (this.VERBOSE >= 3) console.log(`Request: ${req.method.padEnd(8)} Status: ${res.statusCode} (${end-start}ms) URL: ${req.originalUrl}`);
      this.trackers.Latency.logLatency("service", start, end);
      this.trackers.Http.incrementResults(res.statusCode);
    });
    next();
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
    return this.trackers.Latency.wrapLatency("factory", fn);
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
          if (this.VERBOSE >= 1) console.error('Failed to push metrics data to Grafana');
          if (this.VERBOSE >= 2) console.warn(promString);
        } else {
          if (this.VERBOSE >= 4) console.log(`Pushed stats:\n  ${promString.replaceAll("\n", "\n  ")}`);
        }
      })
      .catch((error) => {
        if (this.VERBOSE >= 1) console.error('Error pushing metrics:', error);
        if (this.VERBOSE >= 2) console.warn(`Dropped metrics due to error: ${promString}`);
      });
  }
}

const metrics = new Metrics();
module.exports = metrics;
