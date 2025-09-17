const stripTrailingSlash = (url?: string) => (url ? url.replace(/\/+$/, '') : '');

const ensurePath = (base: string, segment: string) => {
  if (!base) return '';
  return base.endsWith(segment) ? base : `${base}${segment}`;
};

const resolveServiceUrl = (explicit?: string, fallbackBase?: string, fallbackPath?: string) => {
  const trimmedExplicit = stripTrailingSlash(explicit);
  if (trimmedExplicit) {
    return trimmedExplicit;
  }
  if (!fallbackBase || !fallbackPath) {
    return '';
  }
  return ensurePath(fallbackBase, fallbackPath);
};

// URL principal da API (via ngrok ou gateway configurado)
const rawApiUrl = stripTrailingSlash(process.env.EXPO_PUBLIC_API_URL);
const rawApiGatewayUrl = stripTrailingSlash(process.env.EXPO_PUBLIC_API_GATEWAY_URL);
const rawApiBaseUrl = stripTrailingSlash(process.env.EXPO_PUBLIC_API_BASE_URL);
const rawStripePk = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const rawSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const rawSupabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// URLs centralizadas através do gateway
export const API_URL = rawApiUrl || rawApiGatewayUrl || 'https://b34b1c97cd37.ngrok-free.app';
export const API_BASE_URL = rawApiBaseUrl || ensurePath(API_URL, '/api');

// Endpoints específicos
export const AUTH_API_URL = resolveServiceUrl(
  process.env.EXPO_PUBLIC_AUTH_SERVICE_URL,
  API_BASE_URL,
  '/auth'
);
export const PROVIDERS_API_URL = resolveServiceUrl(
  process.env.EXPO_PUBLIC_PROVIDER_SERVICE_URL,
  API_BASE_URL,
  '/providers'
);
export const REQUESTS_API_URL = resolveServiceUrl(
  process.env.EXPO_PUBLIC_REQUEST_SERVICE_URL,
  API_BASE_URL,
  '/requests'
);
export const PAYMENTS_API_URL = resolveServiceUrl(
  process.env.EXPO_PUBLIC_PAYMENT_SERVICE_URL,
  API_BASE_URL,
  '/payments'
);
export const MATCHING_API_URL = resolveServiceUrl(
  process.env.EXPO_PUBLIC_MATCHING_SERVICE_URL,
  API_BASE_URL,
  '/matching'
);
export const ADMIN_API_URL = resolveServiceUrl(
  process.env.EXPO_PUBLIC_ADMIN_SERVICE_URL,
  API_BASE_URL,
  '/admin'
);

// Socket URL (usando HTTPS para ngrok)
export const SOCKET_URL =
  stripTrailingSlash(process.env.EXPO_PUBLIC_SOCKET_URL) || API_URL;

// Outras configurações
export const STRIPE_PUBLISHABLE_KEY = rawStripePk || '';
export const SUPABASE_URL = rawSupabaseUrl || '';
export const SUPABASE_ANON_KEY = rawSupabaseAnon || '';

// Compatibilidade com código antigo
export const BACKEND_URL = API_URL;
export const API_GATEWAY_URL = API_URL;
