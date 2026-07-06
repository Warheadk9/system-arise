const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  // Only Vercel's own cron scheduler (or someone with the secret) can trigger this
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const today = new Date().toISOString().split('T')[0]; // matches getTodayKey() in index.html

    const snap = await db.collection('users').where('role', '==', 'hunter').get();

    let sent = 0;
    let skipped = 0;

    const sends = [];
    snap.forEach(doc => {
      const data = doc.data();
      if (data.lastDailyClaim === today) {
        skipped++;
        return; // already claimed today, don't bother them
      }
      if (!data.fcmToken) {
        skipped++;
        return; // no device to notify
      }
      sent++;
      sends.push(
        admin.messaging().send({
          token: data.fcmToken,
          notification: {
            title: 'Daily Reward Ready!',
            body: "Don't forget to claim your daily reward, hunter!",
          },
          data: { type: 'daily_reminder' },
        }).catch(err => console.warn('Failed to notify', doc.id, err.message))
      );
    });

    await Promise.all(sends);

    return res.status(200).json({ sent, skipped });
  } catch (err) {
    console.error('Daily reminder error:', err);
    return res.status(500).json({ error: err.message });
  }
};
