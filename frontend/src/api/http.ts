import { getOrCreateClientId } from './clientIdentity';

const ACCESS_PASSWORD_STORAGE_KEY = 'beichen_access_password';
const ACCESS_HEADER = import.meta.env.VITE_ACCESS_HEADER || 'X-Beichen-Access';
const CLIENT_ID_HEADER = 'X-Beichen-Client-Id';
const REQUEST_ID_HEADER = 'X-Request-Id';

interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T | null;
  request_id?: string;
}

interface ApiErrorOptions {
  code?: number;
  status?: number;
  requestId?: string;
  cause?: unknown;
}

export class ApiError extends Error {
  code?: number;
  status?: number;
  requestId?: string;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = options.code;
    this.status = options.status;
    this.requestId = options.requestId;
  }
}

export function getAccessPassword(): string {
  return localStorage.getItem(ACCESS_PASSWORD_STORAGE_KEY) || '';
}

export function setAccessPassword(password: string): void {
  const normalized = password.trim();
  if (normalized) {
    localStorage.setItem(ACCESS_PASSWORD_STORAGE_KEY, normalized);
  } else {
    localStorage.removeItem(ACCESS_PASSWORD_STORAGE_KEY);
  }
}

export function clearAccessPassword(): void {
  localStorage.removeItem(ACCESS_PASSWORD_STORAGE_KEY);
}

export async function fetchWithAccess(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const password = getAccessPassword();
  const headers = new Headers(init.headers);

  headers.set(CLIENT_ID_HEADER, getOrCreateClientId());

  if (password) {
    headers.set(ACCESS_HEADER, password);
  }

  try {
    return await fetch(input, {
      ...init,
      headers,
    });
  } catch (error) {
    throw new ApiError('无法连接服务器，请检查网络或稍后重试。', { cause: error });
  }
}

export async function parseApiResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  const requestIdFromHeader = response.headers.get(REQUEST_ID_HEADER) || undefined;
  const rawText = await response.text();
  let payload: ApiEnvelope<T> | null = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText) as ApiEnvelope<T>;
    } catch (error) {
      throw new ApiError('服务器返回了无法解析的响应，请稍后重试。', {
        status: response.status,
        requestId: requestIdFromHeader,
        cause: error,
      });
    }
  }

  const requestId = payload?.request_id || requestIdFromHeader;
  if (!response.ok || !payload || payload.code !== 0 || payload.data === null) {
    throw new ApiError(payload?.message || fallbackMessage, {
      code: payload?.code,
      status: response.status,
      requestId,
    });
  }

  return payload.data;
}

export function formatApiError(error: unknown, fallbackMessage: string): string {
  if (error instanceof ApiError) {
    return error.requestId
      ? `${error.message}（错误追踪 ID：${error.requestId}）`
      : error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}
