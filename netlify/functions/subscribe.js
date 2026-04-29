const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders() };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const sub = JSON.parse(event.body);
    if (!sub?.endpoint) return { statusCode: 400, body: 'Invalid subscription' };

    const store = getStore('subscriptions');
    const key = crypto.createHash('sha256').update(sub.endpoint).digest('hex');
    await store.set(key, JSON.stringify(sub));

    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

function corsHeaders() {
  return { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
}
