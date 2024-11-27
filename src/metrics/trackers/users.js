const MetricsTracker = require("./tracker.js");

class UserMetricsTracker extends MetricsTracker {
  // private activeUsers_hour: Set;
  // private activeUsers_day: Set;
  // private activeUsers_week: Set;
  // private lastFlush = new Date();

  constructor(generator) {
    super("users", generator);
    this.activeUsers_hour = new Set();
    this.activeUsers_day = new Set();
    this.activeUsers_week = new Set();
    this.lastFlush = new Date();
  }

  trackActiveUser(userIdentifier) {
    this.activeUsers_hour.add(userIdentifier);
    this.activeUsers_day.add(userIdentifier);
    this.activeUsers_week.add(userIdentifier);
  }

  /* override */ flush() {
    const usersMetrics /*: UserMetrics */ = {
      active_hour: this.activeUsers_hour.size(),
      active_day: this.activeUsers_day.size(),
      active_week: this.activeUsers_week.size(),
    };
    this.generator.bufferMetric(this.prefix, usersMetrics);

    // Reset the sets according to their schedules
    const now = new Date;
    if (now.getHours() != this.lastFlush.getHours()) {
      this.activeUsers_hour.clear();
      if (now.getDate() != this.lastFlush.getDate()) {
        this.activeUsers_day.clear();
        if (now.getDay() === 0) { // Reset the week set at the beginning of Sunday morning (just after midnight)
          this.activeUsers_week.clear();
        }
      }
      this.lastFlush = now;
    }
  }
}

module.exports = UserMetricsTracker;
