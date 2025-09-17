const stripTrailingSlash = (url?: string) => (url ? url.replace(/\/+$/, '') : '');

const ensurePath = (base: string, segment: string) => {
  if (!base) return '';
  return base.endsWith(segment) ? base : `${base}${segment}`;
};

// Configuração global do axios para incluir o header ngrok-skip-browser-warning
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';
axios.defaults.headers.common['ngrok-skip-browser-warning'] = '1';

const safeJsonParse = <T = any>(value?: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    return null;
  }
};

const extractHost = (uri?: string | null) => {
  if (!uri) return '';
  const cleaned = uri
    .replace('exp://', '')
    .replace('http://', '')
    .replace('https://', '')
    .split('?')[0];

  const hostPort = cleaned.split('/')[0];
  const host = hostPort.split(':')[0];
  if (host === 'localhost' || host === '127.0.0.1') {
    if (Platform.OS === 'android') {
      return '10.0.2.2';
    }
    return 'localhost';
  }
  return host;
};

const resolveExpoHost = () => {
  const manifest = Constants.manifest;
  const manifest2 = Constants.manifest2 as any;

  const potentialHosts = [
    Constants.expoConfig?.hostUri,
    manifest?.hostUri,
    manifest?.debuggerHost,
    manifest2?.extra?.expoClient?.hostUri,
    manifest2?.extra?.expoClient?.manifest?.hostUri,
    manifest2?.extra?.expoGo?.projectConfig?.hostUri,
  ];

  for (const candidate of potentialHosts) {
    const host = extractHost(candidate);
    if (host) {
      return host;
    }
  }

  const linkingUri = Constants.linkingUri;
  const experienceUrl = (Constants as any).experienceUrl as string | undefined;
  const fallbackHost = extractHost(linkingUri || experienceUrl);
  if (fallbackHost) {
    return fallbackHost;
  }

  // For Expo Router in development we can inspect Updates configuration
  const updatesConfiguration = safeJsonParse<{ url?: string }>(
    manifest2?.extra?.expoClient?.manifestString
  );
  if (updatesConfiguration?.url) {
    const hostFromUpdates = extractHost(updatesConfiguration.url);
    if (hostFromUpdates) {
      return hostFromUpdates;
    }
  }

  return '';
};

const expoHost = resolveExpoHost();
const DEV_PROTOCOL = process.env.EXPO_PUBLIC_DEV_PROTOCOL || 'http';
const DEFAULT_GATEWAY_PORT = process.env.EXPO_PUBLIC_GATEWAY_PORT || '8015';
const DEV_API_PORT = process.env.EXPO_PUBLIC_API_PORT || DEFAULT_GATEWAY_PORT;
const DEV_SOCKET_PORT = process.env.EXPO_PUBLIC_SOCKET_PORT || DEV_API_PORT;

const fallbackHost = expoHost || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
const fallbackApiHost = fallbackHost
  ? `${DEV_PROTOCOL}://${fallbackHost}:${DEV_API_PORT}`
  : '';
const fallbackSocketHost = fallbackHost
  ? `${DEV_PROTOCOL}://${fallbackHost}:${DEV_SOCKET_PORT}`
  : '';

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
export const API_URL =
  rawApiUrl ||
  rawApiGatewayUrl ||
  fallbackApiHost ||
  `${DEV_PROTOCOL}://localhost:${DEV_API_PORT}`;
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
  stripTrailingSlash(process.env.EXPO_PUBLIC_SOCKET_URL) ||
  fallbackSocketHost ||
  API_URL;

// Outras configurações
export const STRIPE_PUBLISHABLE_KEY = rawStripePk || '';
export const SUPABASE_URL = rawSupabaseUrl || '';
export const SUPABASE_ANON_KEY = rawSupabaseAnon || '';

// Compatibilidade com código antigo
export const BACKEND_URL = API_URL;
export const API_GATEWAY_URL = API_URL;
