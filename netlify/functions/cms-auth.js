const crypto = require('crypto');

// Comparaison en temps constant — résiste aux timing attacks.
function safeEquals(a, b) {
  try { return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8')); }
  catch { return false; }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const { password } = JSON.parse(event.body || '{}');
  const correct = process.env.CMS_PASSWORD;

  if (!correct) {
    return { statusCode: 500, body: JSON.stringify({ error: 'CMS_PASSWORD non configuré' }) };
  }

  if (!password || !safeEquals(password, correct)) {
    // Délai fixe sur échec — ralentit le brute-force sans coût notable pour un vrai utilisateur.
    await new Promise(r => setTimeout(r, 500));
    return { statusCode: 401, body: JSON.stringify({ error: 'Mot de passe incorrect' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
