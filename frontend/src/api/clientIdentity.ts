const CLIENT_ID_STORAGE_KEY = 'beichen_client_id';

function createFallbackClientId(): string {
  return `client_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getOrCreateClientId(): string {
  const existing = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const clientId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : createFallbackClientId();
  localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId);
  return clientId;
}
