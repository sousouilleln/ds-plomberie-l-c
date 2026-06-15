// OAuth — étape 1 : redirige l'éditeur vers la page d'autorisation GitHub.
// Remplace Netlify Identity / Git Gateway (supprimés pour les nouveaux comptes).
exports.handler = async (event) => {
  const clientId = process.env.GITHUB_OAUTH_ID;
  if (!clientId) {
    return { statusCode: 500, body: "Variable d'environnement GITHUB_OAUTH_ID manquante." };
  }
  const host = event.headers.host;
  const redirectUri = `https://${host}/.netlify/functions/callback`;
  const state = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo",
    state,
    allow_signup: "false",
  });

  return {
    statusCode: 302,
    headers: { Location: `https://github.com/login/oauth/authorize?${params.toString()}` },
  };
};
