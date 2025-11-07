import { getStoredTokens, refreshTokens } from './auth.service';

const RESOURCE_SERVER_URL =
  process.env.REACT_APP_RESOURCE_SERVER_URL || 'http://localhost:8080';

async function withAuth(fetcher) {
  try {
    return await fetcher();
  } catch (err) {
    throw err;
  }
}

async function doFetch(path, options = {}) {
  const tokens = getStoredTokens();
  if (!tokens?.access_token) {
    throw new Error('No access token found. Please sign in first.');
  }

  const response = await fetch(
    `${RESOURCE_SERVER_URL.replace(/\/$/, '')}${path}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${tokens.access_token}`
      }
    }
  );

  if (response.status === 401 && tokens.refresh_token) {
    const refreshed = await refreshTokens();
    const retry = await fetch(
      `${RESOURCE_SERVER_URL.replace(/\/$/, '')}${path}`,
      {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
          Authorization: `Bearer ${refreshed.access_token}`
        }
      }
    );
    if (!retry.ok) {
      throw new Error('API request failed after refresh');
    }
    return retry.json();
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'API request failed');
  }

  return response.json();
}

export async function fetchUsers() {
  return withAuth(() => doFetch('/api/users'));
}

export async function fetchUserById(id) {
  return withAuth(() => doFetch(`/api/users/${id}`));
}

export async function fetchProducts() {
  return withAuth(() => doFetch('/api/products'));
}

export async function callCustomEndpoint(path, method = 'GET', body) {
  return withAuth(() =>
    doFetch(path, {
      method,
      body: body ? JSON.stringify(body) : undefined
    })
  );
}
