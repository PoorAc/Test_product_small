import Keycloak from 'keycloak-js';

// These should match your Keycloak Docker settings
const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'product_small', // Or your custom realm name
  clientId: 'vite-frontend', 
});

export default keycloak;