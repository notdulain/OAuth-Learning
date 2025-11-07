import React, { useEffect, useState, useCallback } from 'react';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ApiTester from './components/ApiTester';
import {
  initiateLogin,
  handleRedirectCallback,
  getStoredTokens,
  getUserFromTokens,
  refreshTokens,
  logout,
  getAuthConfig
} from './services/auth.service';

function App() {
  const [tokens, setTokens] = useState(() => getStoredTokens());
  const [user, setUser] = useState(() => getUserFromTokens(tokens));
  const [status, setStatus] = useState('ready');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const config = getAuthConfig();

  useEffect(() => {
    let mounted = true;
    handleRedirectCallback()
      .then(result => {
        if (!mounted) return;
        if (result.handled && result.tokens) {
          setTokens(result.tokens);
          setUser(getUserFromTokens(result.tokens));
          setMessage('Authorization code exchanged for tokens.');
        } else if (result.error) {
          setError(result.error);
        }
      })
      .catch(err => {
        if (mounted) setError(err.message);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setUser(getUserFromTokens(tokens));
  }, [tokens]);

  const handleLogin = useCallback(() => {
    setStatus('redirecting');
    initiateLogin();
  }, []);

  const handleRefresh = async () => {
    try {
      setStatus('refreshing');
      const refreshed = await refreshTokens();
      setTokens(refreshed);
      setMessage('Access token refreshed');
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus('ready');
    }
  };

  const handleLogout = async () => {
    await logout();
    setTokens(null);
    setUser(null);
    setMessage('Signed out');
  };

  return (
    <div className="app-shell">
      <header>
        <div>
          <h1>OAuth Learning Client</h1>
          <p className="muted">
            Authorization Code + PKCE flow with token inspection and API tests.
          </p>
        </div>
        {tokens?.access_token && (
          <div className="session-actions">
            <button className="btn secondary" onClick={handleRefresh}>
              Refresh token
            </button>
            <button className="btn ghost" onClick={handleLogout}>
              Clear session
            </button>
          </div>
        )}
      </header>

      {message && <div className="banner success">{message}</div>}
      {error && <div className="banner error">{error}</div>}

      <main>
        <section className="layout">
          <Login
            isAuthenticated={Boolean(tokens?.access_token)}
            user={user}
            onLogin={handleLogin}
            onLogout={handleLogout}
            loading={status === 'redirecting'}
          />
          <Dashboard user={user} tokens={tokens} />
        </section>
        <section className="layout">
          <ApiTester isAuthenticated={Boolean(tokens?.access_token)} />
          <div className="card">
            <h2>Config</h2>
            <dl className="config-grid">
              <div>
                <dt>Auth Server</dt>
                <dd>{config.authServerUrl}</dd>
              </div>
              <div>
                <dt>Client ID</dt>
                <dd>{config.clientId}</dd>
              </div>
              <div>
                <dt>Redirect URI</dt>
                <dd>{config.redirectUri}</dd>
              </div>
              <div>
                <dt>Scopes</dt>
                <dd>{config.scopes.join(', ')}</dd>
              </div>
              <div>
                <dt>Show Code Page</dt>
                <dd>{config.showCode ? 'true' : 'false'}</dd>
              </div>
            </dl>
            <p className="note">
              Update <code>client-app/.env</code> to change these values.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
