import React from 'react';
import TokenDisplay from './TokenDisplay';

export default function Dashboard({ user, tokens }) {
  if (!tokens?.access_token) {
    return (
      <div className="card">
        <h2>Session</h2>
        <p className="muted">Sign in to see decoded token details.</p>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <h2>Profile</h2>
        {user ? (
          <div className="claims-grid">
            {Object.entries(user).map(([key, value]) => (
              <div key={key} className="claim">
                <span className="label">{key}</span>
                <span className="value">
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p>No user claims found in the token.</p>
        )}
      </div>
      <TokenDisplay tokens={tokens} />
    </>
  );
}
