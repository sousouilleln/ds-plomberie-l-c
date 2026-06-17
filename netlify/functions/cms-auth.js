// Vérifie le mot de passe CMS — aucune dépendance à GitHub OAuth.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { password } = JSON.parse(event.body || '{}');
  const correct = process.env.CMS_PASSWORD;

  if (!correct) {
    return { statusCode: 500, body: JSON.stringify({ error: 'CMS_PASSWORD non configuré dans Netlify' }) };
  }

  if (!password || password !== correct) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Mot de passe incorrect' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
