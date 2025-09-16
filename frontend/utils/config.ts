const stripTrailingSlash = (url?: string) => (url ? url.replace(/\/+$/, '') : '');

const ensurePath = (base: string, segment: string) => {
  if (!base) return '';
  return base.endsWith(segment) ? base : `${base}${segment}`;
};

const rawBackendUrl = stripTrailingSlash(process.env.EXPO_PUBLIC_BACKEND_URL);
const rawGatewayUrl = stripTrailingSlash(process.env.EXPO_PUBLIC_API_GATEWAY_URL);

const rawAuthServiceUrl = stripTrailingSlash(process.env.EXPO_PUBLIC_AUTH_SERVICE_URL);
const rawProviderServiceUrl = stripTrailingSlash(
  process.env.EXPO_PUBLIC_PROVIDER_SERVICE_URL
);
const rawRequestServiceUrl = stripTrailingSlash(
  process.env.EXPO_PUBLIC_REQUEST_SERVICE_URL
);
const rawSocketUrl = stripTrailingSlash(process.env.EXPO_PUBLIC_SOCKET_URL);

const resolvedGatewayUrl = rawGatewayUrl || rawSocketUrl || rawBackendUrl;
const resolvedSocketUrl = rawSocketUrl || rawGatewayUrl || rawBackendUrl;

export const BACKEND_URL = rawBackendUrl;
export const API_GATEWAY_URL = resolvedGatewayUrl;
export const API_BASE_URL = resolvedGatewayUrl ? ensurePath(resolvedGatewayUrl, '/api') : '';

export const AUTH_API_URL = rawAuthServiceUrl
  ? ensurePath(rawAuthServiceUrl, '/auth')
  : ensurePath(API_BASE_URL, '/auth');

export const PROVIDERS_API_URL = rawProviderServiceUrl
  ? ensurePath(rawProviderServiceUrl, '/providers')
  : ensurePath(API_BASE_URL, '/providers');

export const REQUESTS_API_URL = rawRequestServiceUrl
  ? ensurePath(rawRequestServiceUrl, '/requests')
  : ensurePath(API_BASE_URL, '/requests');

export const SOCKET_URL = resolvedSocketUrl;

export const USING_SERVICE_OVERRIDES = Boolean(
  rawAuthServiceUrl || rawProviderServiceUrl || rawRequestServiceUrl || rawSocketUrl
);
