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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST is allowed' });
  }

  try {
    const { toUid, title, body, data } = req.body;

    if (!toUid || !title || !body) {
      return res.status(400).json({ error: 'toUid, title, and body are required' });
    }

    const userDoc = await db.collection('users').doc(toUid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const fcmToken = userDoc.data().fcmToken;
    if (!fcmToken) {
      return res.status(200).json({ skipped: true, reason: 'No device token on file' });
    }

    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: data || {},
    });

    return res.status(200).json({ sent: true });
  } catch (err) {
    console.error('Push send error:', err);
    return res.status(500).json({ error: err.message });
  }
};
