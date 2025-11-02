const clients = [
    {
      clientId: 'learning-client',
      clientSecret: process.env.LEARNING_CLIENT_SECRET || 'learning-client-secret',
      name: 'Local Learning Client',
      redirectUris: ['http://localhost:3000/callback'], // will matter in later phases
      grants: ['client_credentials', 'authorization_code', 'refresh_token'],
      scopes: ['read:users', 'read:products', 'openid', 'profile', 'email']
    }
  ];
  
  module.exports = {
    clients
  };
  