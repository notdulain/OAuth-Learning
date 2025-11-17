import React, { useMemo } from 'react';
import { decodeJwt, getExpiryDate } from '../utils/jwt-decoder';

function TokenCard({ label, token, description }) {
  const claims = useMemo(() => decodeJwt(token), [token]);
  const expiry = useMemo(() => getExpiryDate(token), [token]);
  return (
    <div className="token-card">
      <div className="token-header">
        <h3>{label}</h3>
        {expiry && (
          <span className="badge">
            expires {expiry.toLocaleTimeString()} ({expiry.toLocaleDateString()})
          </span>
        )}
      </div>
      {description && <p className="muted">{description}</p>}
      <textarea
        readOnly
        value={token || '——'}
        className="token-textarea"
        rows={3}
      />
      {claims && (
        <details>
          <summary>Decoded claims</summary>
          <pre>{JSON.stringify(claims, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}

export default function TokenDisplay({ tokens }) {
  return (
    <div className="card">
      <h2>Tokens</h2>
      <TokenCard
        label="Access Token"
        token={tokens?.access_token}
        description="Used to call the resource server (bearer token)."
      />
      <TokenCard
        label="Refresh Token"
        token={tokens?.refresh_token}
        description="Used to obtain new access tokens when they expire."
      />
      <TokenCard
        label="ID Token"
        token={tokens?.id_token}
        description="OpenID Connect identity token containing profile claims."
      />
    </div>
  );
}
