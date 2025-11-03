function toScopeArray(scope) {
  if (!scope) return [];
  if (Array.isArray(scope)) return scope;
  if (typeof scope === 'string') return scope.split(/\s+/).filter(Boolean);
  return [];
}

/**
 * Verify that the request token contains all required scopes.
 *
 * @param {string[]} requiredScopes
 * @returns {Function} Express middleware
 */
function scopeCheck(requiredScopes = []) {
  return (req, res, next) => {
    const tokenScopes = toScopeArray(req.user && req.user.scope);

    const missing = requiredScopes.filter(
      scope => !tokenScopes.includes(scope)
    );

    if (missing.length > 0) {
      return res.status(403).json({
        error: 'insufficient_scope',
        error_description: `Missing required scope(s): ${missing.join(', ')}`,
        required_scopes: requiredScopes,
        token_scopes: tokenScopes
      });
    }

    next();
  };
}

module.exports = scopeCheck;
