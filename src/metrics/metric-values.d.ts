export type AccumulatorNumber = number;
export type InstantNumber = number;

/** Unless specified otherwise, all of the following will be accumulator values. */
export type PizzaServiceMetrics =
  HttpMetrics &
  UserMetrics &
  SessionMetrics &
  AuthMetrics &
  SystemMetrics &
  SalesMetrics &
  LatencyMetrics;

export interface HttpMetrics {
  http_requests_total: AccumulatorNumber;

  http_requests_get: AccumulatorNumber;
  http_requests_put: AccumulatorNumber;
  http_requests_delete: AccumulatorNumber;
  http_requests_post: AccumulatorNumber;

  http_results_100: AccumulatorNumber;
  http_results_200: AccumulatorNumber;
  http_results_300: AccumulatorNumber;
  http_results_400: AccumulatorNumber;
  http_results_500: AccumulatorNumber;

  /** Any 200 status code */
  http_results_success: AccumulatorNumber;
  /** Any non-200 status code */
  http_results_error: AccumulatorNumber;
}

export type UserMetrics = ActiveIdMetricsMapper<"users">;
export type SessionMetrics = ActiveIdMetricsMapper<"sessions">;

type ActiveIdMetricsMapper<PREFIX extends string> = {
  [K in keyof ActiveIdMetrics as `${PREFIX}_${K}`]: ActiveIdMetrics[K];
}
interface ActiveIdMetrics {
  active_minute: InstantNumber;
  active_hour: InstantNumber;
  active_day: InstantNumber;
  active_week: InstantNumber;
  unauthenticated_requests: AccumulatorNumber;
}

export interface AuthMetrics {
  auth_successful: AccumulatorNumber;
  auth_failed: AccumulatorNumber;
}

export interface SystemMetrics {
  sys_cpu: InstantNumber;
  sys_mem: InstantNumber;
}

export interface SalesMetrics {
  sales_qty: AccumulatorNumber;
  sales_failed_requests: AccumulatorNumber;
  sales_revenue: AccumulatorNumber;
}

export interface LatencyMetrics {
  lat_service: InstantNumber;
  lat_factory: InstantNumber;
  lat_service_failures: AccumulatorNumber;
  lat_factory_failures: AccumulatorNumber;
}
