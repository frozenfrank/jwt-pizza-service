/** Unless specified otherwise, all of the following will be accumulator values. */
export type PizzaServiceMetrics =
  HttpMetrics &
  UserMetrics &
  AuthMetrics;

export interface HttpMetrics {
  http_requests_total: number;

  http_requests_get: number;
  http_requests_put: number;
  http_requests_delete: number;
  http_requests_post: number;

  http_results_100: number;
  http_results_200: number;
  http_results_300: number;
  http_results_400: number;
  http_results_500: number;

  /** Any 200 status code */
  http_results_success: number;
  /** Any non-200 status code */
  http_results_error: number;
}

export interface UserMetrics {
  users_active_hour: number;
  users_active_day: number;
  users_active_week: number;
}

export interface AuthMetrics {
  auth_successful: number;
  auth_failed: number;
}

export interface SystemMetrics {
  sys_cpu: number;
  sys_mem: number;
}

export interface SalesMetrics {
  sales_qty: number;
  sales_failed_requests: number;
  sales_revenue: number;
}

export interface LatencyMetrics {
  lat_service: number;
  lat_pizza_creation: number;
  lat_failed_requests: number;
}
