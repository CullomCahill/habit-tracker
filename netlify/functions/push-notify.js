const { getStore } = require('@netlify/blobs');
const webpush = require('web-push');

exports.handler = async () => {
  const { VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error('VAPID keys not configured');
    return { statusCode: 500, body: 'VAPID keys missing' };
  }

  webpush.setVapidDetails(`mailto:${VAPID_EMAIL}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const store = getStore('subscriptions');
  const { blobs } = await store.list();

  if (blobs.length === 0) {
    return { statusCode: 200, body: JSON.stringify({ sent: 0, total: 0 }) };
  }

  const payload = JSON.stringify({
    title: 'Habit Tracker',
    body: "Don't forget to log your habits today!",
    icon: '/icon-192.png',
  });

  const results = await Promise.allSettled(
    blobs.map(async ({ key }) => {
      const data = await store.get(key);
      return webpush.sendNotification(JSON.parse(data), payload);
    })
  );

  // Remove subscriptions that are expired or invalid
  await Promise.all(
    results.map(async (result, i) => {
      if (result.status === 'rejected') {
        const code = result.reason?.statusCode;
        if (code === 404 || code === 410) {
          await store.delete(blobs[i].key);
        }
      }
    })
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  console.log(`Push sent: ${sent}/${blobs.length}`);
  return { statusCode: 200, body: JSON.stringify({ sent, total: blobs.length }) };
};
