const crypto = require('crypto');

// Extensions autorisées — interdit d'uploader du JS/HTML/PHP etc.
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg']);

function safeEquals(a, b) {
  try { return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8')); }
  catch { return false; }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const password = event.headers['x-cms-password'];
  const correct  = process.env.CMS_PASSWORD;
  if (!correct || !password || !safeEquals(password, correct)) {
    await new Promise(r => setTimeout(r, 500));
    return { statusCode: 401, body: JSON.stringify({ error: 'Non autorisé' }) };
  }

  const pat = process.env.GITHUB_PAT;
  if (!pat) return { statusCode: 500, body: JSON.stringify({ error: 'GITHUB_PAT non configuré' }) };

  const { filename, data } = JSON.parse(event.body || '{}');
  if (!filename || !data) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Paramètres manquants' }) };
  }

  // Sanitize serveur-side — le client peut être contourné, donc on re-valide ici.
  // 1. Garde uniquement les caractères sûrs (pas de slash, pas de ..)
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '');
  // 2. Vérifie l'extension
  const ext = safeName.split('.').pop().toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Type de fichier non autorisé (images uniquement)' }) };
  }
  // 3. Limite la taille du payload base64 (~4 Mo image = ~5.5 Mo base64)
  if (data.length > 6 * 1024 * 1024) {
    return { statusCode: 413, body: JSON.stringify({ error: 'Image trop volumineuse (max 4 Mo)' }) };
  }

  const repo     = 'sousouilleln/ds-plomberie-l-c';
  const filePath = `assets/uploads/${safeName}`;
  const apiUrl   = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const headers  = {
    Authorization:  `Bearer ${pat}`,
    Accept:         'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent':   'ds-plomberie-cms',
  };

  // Si le fichier existe déjà, récupère son SHA pour l'écraser proprement.
  let sha;
  const checkRes = await fetch(apiUrl, { headers });
  if (checkRes.ok) sha = (await checkRes.json()).sha;

  const body = { message: `CMS: upload ${safeName}`, content: data };
  if (sha) body.sha = sha;

  const putRes = await fetch(apiUrl, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Erreur GitHub API' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ url: `/assets/uploads/${safeName}` }) };
};
