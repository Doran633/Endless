const ACCESS_PASSWORD_STORAGE_KEY = 'beichen_access_password';
const ACCESS_HEADER = import.meta.env.VITE_ACCESS_HEADER || 'X-Beichen-Access';

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

export function fetchWithAccess(input: RequestInfo | URL, init: RequestInit = {}) {
  const password = getAccessPassword();
  const headers = new Headers(init.headers);

  if (password) {
    headers.set(ACCESS_HEADER, password);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
