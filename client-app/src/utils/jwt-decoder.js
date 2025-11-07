export function decodeJwt(token) {
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const json = decodeURIComponent(
      decoded
        .split('')
        .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );
    return JSON.parse(json);
  } catch (err) {
    console.warn('Failed to decode JWT', err);
    return null;
  }
}

export function getExpiryDate(token) {
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return null;
  return new Date(decoded.exp * 1000);
}

export function isExpired(token) {
  const expiry = getExpiryDate(token);
  if (!expiry) return false;
  return expiry.getTime() <= Date.now();
}

export default decodeJwt;
