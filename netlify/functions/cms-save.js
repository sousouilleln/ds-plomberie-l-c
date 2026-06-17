// Écrit un fichier content/*.json dans le dépôt GitHub via l'API.
// Authentification : mot de passe dans l'en-tête x-cms-password.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const password = event.headers['x-cms-password'];
  if (!password || password !== process.env.CMS_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Non autorisé' }) };
  }

  const pat = process.env.GITHUB_PAT;
  if (!pat) {
    return { statusCode: 500, body: JSON.stringify({ error: 'GITHUB_PAT non configuré' }) };
  }

  const { file, content } = JSON.parse(event.body || '{}');
  if (!file || !content) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Paramètres manquants' }) };
  }

  const repo     = 'sousouilleln/ds-plomberie-l-c';
  const filePath = `content/${file}.json`;
  const apiUrl   = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const headers  = {
    Authorization:  `Bearer ${pat}`,
    Accept:         'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent':   'ds-plomberie-cms',
  };

  // Récupère le SHA actuel (requis par GitHub pour mettre à jour un fichier existant).
  let sha;
  const getRes = await fetch(apiUrl, { headers });
  if (getRes.ok) {
    const current = await getRes.json();
    sha = current.sha;
  }

  const body = {
    message: `CMS: mise à jour content/${file}.json`,
    content: Buffer.from(JSON.stringify(content, null, 2) + '\n').toString('base64'),
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(apiUrl, { method: 'PUT', headers, body: JSON.stringify(body) });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Erreur GitHub API' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
