const { readAuthToken } = require("../../routes/authHelper");

class Logger {
  constructor(config) {
    this.config = config;
  }

  httpLogger = (req, res, next) => {
    const start = new Date;
    let send = res.send;
    res.send = (resBody) => {
      const end = new Date;
      const logData = {
        authorized: !!req.headers.authorization,
        path: req.originalUrl,
        ip: req.ip,
        method: req.method,
        latency: end - start,
        statusCode: res.statusCode,
        sessionId: readAuthToken(req),
        reqBody: JSON.stringify(req.body),
        resBody: JSON.stringify(resBody),
      };
      const level = this.statusToLogLevel(res.statusCode);
      this.log(level, 'http', logData);
      res.send = send;
      return res.send(resBody);
    };
    next();
  };

  dbLogger(query) {
    this.log('info', 'db', query);
  }

  factoryLogger(orderInfo) {
    this.log('info', 'factory', orderInfo);
  }

  unhandledErrorLogger(err) {
    this.log('error', 'unhandledError', { message: err.message, status: err.statusCode });
  }

  log(level, type, logData) {
    const labels = { component: this.config.logging.source, level: level, type: type };
    const values = [this.nowString(), this.sanitize(logData)];
    const logEvent = { streams: [{ stream: labels, values: [values] }] };

    this.sendLogToGrafana(logEvent);
  }

  statusToLogLevel(statusCode) {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    return 'info';
  }

  nowString() {
    return (Math.floor(Date.now()) * 1000000).toString();
  }

  sanitize(logData) {
    logData = JSON.stringify(logData);
    logData = logData.replace(/\\"password\\":\s*\\"[^"]*\\"/g, '\\"password\\": \\"*****\\"');
    logData = logData.replace(/password=\s*\\"[^"]*\\"/g, 'password= \\"*****\\"');
    logData = logData.replace(/\\password\\=\s*\\"[^"]*\\"/g, '\\"password\\"= \\"*****\\"');
    return logData;
  }

  async sendLogToGrafana(event) {
    // Log to Grafana
    const eventStr = JSON.stringify(event);
    let success = false;
    try {
      const res = await fetch(`${this.config.logging.url}`, {
        method: 'post',
        body: eventStr,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.logging.userId}:${this.config.logging.apiKey}`,
        },
      });
      if (!res.ok) {
        console.error('Failed to send log to Grafana. Result body:');
        const resultBody = await res.text();
        console.error({ ...res, body: resultBody });
      } else {
        success = true;
      }
    } catch (error) {
      console.error('Error sending log to Grafana:');
      console.error(error);
    } finally {
      if (!success) {
        console.warn("Dropped event:", eventStr);
      }
    }
  }
}
module.exports = Logger;
