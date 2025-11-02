const { clients } = require('../config/oauth-config');
const { safeCompare } = require('../utils/crypto');

function findClientById(clientId) {
  return clients.find(client => client.clientId === clientId);
}

function validateClientCredentials(clientId, clientSecret) {
  const client = findClientById(clientId);
  if (!client || !client.clientSecret) return null;
  if (!safeCompare(client.clientSecret, clientSecret)) return null;
  return client;
}

module.exports = {
  findClientById,
  validateClientCredentials
};
