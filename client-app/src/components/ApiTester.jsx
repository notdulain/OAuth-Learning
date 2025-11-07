import React, { useState } from 'react';
import { fetchUsers, fetchProducts, callCustomEndpoint } from '../services/api.service';

const PRESETS = [
  { label: 'GET /api/users', path: '/api/users', action: fetchUsers },
  { label: 'GET /api/products', path: '/api/products', action: fetchProducts }
];

export default function ApiTester({ isAuthenticated }) {
  const [customPath, setCustomPath] = useState('/api/users/1');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callApi = async action => {
    if (!isAuthenticated) {
      setError('Sign in first to call protected APIs');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await action();
      setResponse(data);
    } catch (err) {
      setError(err.message);
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const callCustom = async () => {
    await callApi(() => callCustomEndpoint(customPath));
  };

  return (
    <div className="card">
      <h2>API Tester</h2>
      <p className="muted">
        Quickly verify that your access token works against the resource server.
      </p>
      <div className="button-grid">
        {PRESETS.map(preset => (
          <button
            key={preset.path}
            className="btn secondary"
            onClick={() => callApi(preset.action)}
            disabled={loading}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="custom-call">
        <label htmlFor="customPath">Custom endpoint</label>
        <div className="custom-row">
          <input
            id="customPath"
            value={customPath}
            onChange={e => setCustomPath(e.target.value)}
            placeholder="/api/users/1"
          />
          <button className="btn primary" onClick={callCustom} disabled={loading}>
            Call API
          </button>
        </div>
      </div>
      {loading && <p>Calling API…</p>}
      {error && <p className="error-text">{error}</p>}
      {response && (
        <pre className="response-block">{JSON.stringify(response, null, 2)}</pre>
      )}
    </div>
  );
}
