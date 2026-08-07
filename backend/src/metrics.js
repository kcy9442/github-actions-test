const http = require('http');
const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'dambda_' });

const httpRequests = new client.Counter({
  name: 'dambda_http_requests_total',
  help: 'Total number of HTTP requests handled by the backend',
  labelNames: ['method', 'status_code'],
  registers: [register],
});

const httpDuration = new client.Histogram({
  name: 'dambda_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'status_code'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const requestsInFlight = new client.Gauge({
  name: 'dambda_http_requests_in_flight',
  help: 'Number of HTTP requests currently being handled',
  registers: [register],
});

const moderationTotal = new client.Counter({
  name: 'dambda_moderation_total',
  help: 'Total number of moderation decisions',
  labelNames: ['result'],
  registers: [register],
});

function metricsMiddleware(req, res, next) {
  requestsInFlight.inc();
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const statusCode = String(res.statusCode);
    const elapsedSeconds = Number(process.hrtime.bigint() - started) / 1e9;
    httpRequests.inc({ method: req.method, status_code: statusCode });
    httpDuration.observe(
      { method: req.method, status_code: statusCode },
      elapsedSeconds,
    );
    requestsInFlight.dec();
  });
  next();
}

function recordModeration(result) {
  const label = result?.reasons?.includes('moderation_service_error')
    ? 'error'
    : result?.approved
      ? 'approved'
      : 'blocked';
  moderationTotal.inc({ result: label });
}

function startMetricsServer(port = 9090) {
  const server = http.createServer(async (req, res) => {
    if (req.url !== '/metrics') {
      res.writeHead(404).end('not found');
      return;
    }
    try {
      res.writeHead(200, { 'Content-Type': register.contentType });
      res.end(await register.metrics());
    } catch (error) {
      res.writeHead(500).end('metrics collection failed');
    }
  });
  server.listen(port, '0.0.0.0', () => {
    console.log(`dambda metrics listening on port ${port}`);
  });
  return server;
}

module.exports = { metricsMiddleware, recordModeration, startMetricsServer };
