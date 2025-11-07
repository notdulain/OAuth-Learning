import React from 'react';

export default function Login({
  isAuthenticated,
  onLogin,
  onLogout,
  user,
  loading
}) {
  return (
    <div className="card">
      <h2>Authentication</h2>
      {isAuthenticated && user ? (
        <>
          <p className="muted">
            Logged in as <strong>{user.name || user.username}</strong>
          </p>
          <button className="btn secondary" onClick={onLogout}>
            Sign out
          </button>
        </>
      ) : (
        <>
          <p className="muted">
            Start the Authorization Code + PKCE flow using the button below.
          </p>
          <button className="btn primary" onClick={onLogin} disabled={loading}>
            {loading ? 'Redirecting…' : 'Sign in with OAuth'}
          </button>
        </>
      )}
    </div>
  );
}
