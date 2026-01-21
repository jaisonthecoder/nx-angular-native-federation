


export const environment = {
  production: false,
  keycloak: {
    url: 'http://127.0.0.1:9090',
    realm: 'lpco-angola-system', // Updated to match Keycloak realm export
    clientId: 'lpco-system' // Updated to match Keycloak client
  },
  apiUrl: 'http://localhost:3000/api',
  // Keycloak role names - update these if role names change in Keycloak

};
