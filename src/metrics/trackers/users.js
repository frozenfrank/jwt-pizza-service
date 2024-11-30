const MetricsTracker = require("./tracker.js");

class ActiveIdMetricsTracker extends MetricsTracker {
  // private active_minute: Set;
  // private active_hour: Set;
  // private active_day: Set;
  // private active_week: Set;
  // private lastFlush = new Date();

  constructor(prefix, generator) {
    super(prefix, generator);
    this.metrics.unauthenticated_requests = 0;

    this.active_minute = new Set();
    this.active_hour = new Set();
    this.active_day = new Set();
    this.active_week = new Set();
    this.lastFlush = new Date();
  }

  trackActiveId(id) {
    if (!id) {
      this.metrics.unauthenticated_requests++;
      return;
    }
    this.active_minute.add(id);
    this.active_hour.add(id);
    this.active_day.add(id);
    this.active_week.add(id);
  }

  /* override */ flush() {
    this.metrics.active_minute = this.active_minute.size;
    this.metrics.active_hour = this.active_hour.size;
    this.metrics.active_day = this.active_day.size;
    this.metrics.active_week = this.active_week.size;
    super.flush();

    // Reset the sets according to their schedules
    const now = new Date;
    if (now.getMinutes() != this.lastFlush.getMinutes()) {
      this.active_minute.clear();
      if (now.getHours() != this.lastFlush.getHours()) {
        this.active_hour.clear();
        if (now.getDate() != this.lastFlush.getDate()) {
          this.active_day.clear();
          if (now.getDay() === 0) { // Reset the week set at the beginning of Sunday morning (just after midnight)
            this.active_week.clear();
          }
        }
      }
      this.lastFlush = now;
    }
  }
}

class UserMetricsTracker extends ActiveIdMetricsTracker {
  constructor(generator) {
    super("users", generator);
  }
}

module.exports = UserMetricsTracker;
