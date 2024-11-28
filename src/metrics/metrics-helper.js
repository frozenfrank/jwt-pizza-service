
const os = require('os');

function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  return cpuUsage.toFixed(2) * 100;
}

function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

function serializeMetrics(metrics) {
  return Object.entries(metrics)
  .map(([key, value]) => `${key}=${value}`)
  .join(",");
}


function nowString() {
  return (Math.floor(Date.now()) * 1000000).toString();
}

module.exports.getCpuUsagePercentage = getCpuUsagePercentage;
module.exports.getMemoryUsagePercentage = getMemoryUsagePercentage;
module.exports.serializeMetrics = serializeMetrics;
module.exports.nowString = nowString;
