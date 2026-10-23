// Loopback-only preview transport. No credentials, production host, or auth bypass.
export const apiFetch = (url: string | URL, init: RequestInit = {}) => fetch(url, init);
