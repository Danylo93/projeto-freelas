const rawBackendUrl = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';
const normalizedBackendUrl = rawBackendUrl.replace(/\/+$/, '');

export const BACKEND_URL = normalizedBackendUrl;
export const API_BASE_URL = normalizedBackendUrl ? `${normalizedBackendUrl}/api` : '';
