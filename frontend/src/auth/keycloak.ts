import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:8080",
  realm: "project-demo",
  clientId: "vite-frontend",
});

export default keycloak;
