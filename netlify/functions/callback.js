// OAuth — étape 2 : échange le "code" GitHub contre un token, puis renvoie
// ce token à Decap CMS via postMessage (protocole attendu par le CMS).
exports.handler = async (event) => {
  const clientId = process.env.GITHUB_OAUTH_ID;
  const clientSecret = process.env.GITHUB_OAUTH_SECRET;
  const code = event.queryStringParameters && event.queryStringParameters.code;

  const provider = "github";

  const render = (status, payload) => ({
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Connexion…</title></head>
<body>
<script>
  (function () {
    function receiveMessage(e) {
      window.opener.postMessage(
        'authorization:${provider}:${status}:${JSON.stringify(payload)}',
        e.origin
      );
      window.removeEventListener('message', receiveMessage, false);
    }
    window.addEventListener('message', receiveMessage, false);
    window.opener.postMessage('authorizing:${provider}', '*');
  })();
</script>
<p>${status === "success" ? "Connexion réussie. Vous pouvez fermer cette fenêtre." : "Échec de la connexion."}</p>
</body></html>`,
  });

  if (!clientId || !clientSecret) {
    return render("error", { error: "Variables GITHUB_OAUTH_ID / GITHUB_OAUTH_SECRET manquantes." });
  }
  if (!code) {
    return render("error", { error: "Code d'autorisation manquant." });
  }

  try {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const data = await res.json();
    if (data.error || !data.access_token) {
      return render("error", { error: data.error_description || "Échec de l'échange du token." });
    }
    return render("success", { token: data.access_token, provider });
  } catch (err) {
    return render("error", { error: String(err) });
  }
};
