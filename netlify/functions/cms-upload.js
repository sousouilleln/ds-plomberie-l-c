// Téléverse une image dans assets/uploads/ du dépôt GitHub via l'API.
// Le client envoie le fichier en base64 — le PAT ne quitte jamais le serveur.
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

  const { filename, data } = JSON.parse(event.body || '{}');
  if (!filename || !data) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Paramètres manquants' }) };
  }

  const repo     = 'sousouilleln/ds-plomberie-l-c';
  const filePath = `assets/uploads/${filename}`;
  const apiUrl   = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const headers  = {
    Authorization:  `Bearer ${pat}`,
    Accept:         'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent':   'ds-plomberie-cms',
  };

  // Si le fichier existe déjà (même nom), on récupère son SHA pour l'écraser.
  let sha;
  const checkRes = await fetch(apiUrl, { headers });
  if (checkRes.ok) {
    const existing = await checkRes.json();
    sha = existing.sha;
  }

  const body = {
    message: `CMS: upload image ${filename}`,
    content: data, // déjà en base64 (envoyé par FileReader côté client)
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(apiUrl, { method: 'PUT', headers, body: JSON.stringify(body) });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Erreur GitHub API' }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ url: `/assets/uploads/${filename}` }),
  };
};
