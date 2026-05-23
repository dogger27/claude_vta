const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const Stripe = require('stripe').default || require('stripe');

admin.initializeApp();
const db = admin.firestore();

const STRIPE_SECRET          = defineSecret('STRIPE_SECRET');
const STRIPE_WEBHOOK_SECRET  = defineSecret('STRIPE_WEBHOOK_SECRET');

// Price in cents CAD. 1 = $0.01 for testing; switch to 5000 for $50.
const MEMBERSHIP_PRICE_CENTS = 5000;
const MEMBERSHIP_LABEL       = 'VTA Annual Membership';

const cleanSecret = (s) => s.replace(/[^a-zA-Z0-9_]/g, '');

// ── Admin: Create Member ─────────────────────────────────────────────────────
exports.createMemberAdmin = onCall(
  {},
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');

    const callerSnap = await db.collection('users').doc(request.auth.uid).get();
    if (!callerSnap.data()?.isAdmin) throw new HttpsError('permission-denied', 'Admins only.');

    const { email, firstName, lastName } = request.data;
    if (!email || !firstName || !lastName) throw new HttpsError('invalid-argument', 'email, firstName, and lastName are required.');

    // Create Firebase Auth user (random temp password — member will use password reset)
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
    const userRecord = await admin.auth().createUser({
      email,
      password: tempPassword,
      displayName: `${firstName} ${lastName}`,
    });

    const uid = userRecord.uid;
    const now = admin.firestore.FieldValue.serverTimestamp();

    const batch = db.batch();
    batch.set(db.collection('users').doc(uid), {
      uid, email, firstName, lastName, isAdmin: false, createdAt: now,
    });
    batch.set(db.collection('memberProfiles').doc(uid), {
      userId: uid, email, firstName, lastName,
      phone: '', street: '', city: '', state: '', zipCode: '',
      paymentStatus: 'unpaid', createdAt: now, updatedAt: now,
    });
    await batch.commit();

    const resetLink = await admin.auth().generatePasswordResetLink(email);
    return { uid, resetLink };
  }
);

// ── Create Checkout Session ──────────────────────────────────────────────────
exports.createCheckoutSession = onCall(
  { secrets: [STRIPE_SECRET] },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');

    const stripe = new Stripe(cleanSecret(STRIPE_SECRET.value()));
    const { uid, token: { email } = {} } = request.auth;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'cad',
          unit_amount: MEMBERSHIP_PRICE_CENTS,
          product_data: { name: MEMBERSHIP_LABEL },
        },
        quantity: 1,
      }],
      metadata: { userId: uid },
      success_url: 'https://vancouver-tennis-association.web.app/dashboard?payment=success',
      cancel_url:  'https://vancouver-tennis-association.web.app/dashboard?payment=cancelled',
    });

    return { url: session.url };
  }
);

// ── Stripe Webhook ───────────────────────────────────────────────────────────
exports.stripeWebhook = onRequest(
  { secrets: [STRIPE_SECRET, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      const stripe = new Stripe(cleanSecret(STRIPE_SECRET.value()));
      event = stripe.webhooks.constructEvent(req.rawBody, sig, cleanSecret(STRIPE_WEBHOOK_SECRET.value()));
    } catch (err) {
      console.error('Webhook signature failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId  = session.metadata?.userId;
      if (!userId) return res.sendStatus(200);

      const now = new Date();

      const profileSnap = await db.collection('memberProfiles').doc(userId).get();
      const currentExpiry = profileSnap.data()?.membershipExpiry?.toDate?.();
      const baseDate = currentExpiry && currentExpiry > now ? currentExpiry : now;

      const expiry = new Date(baseDate);
      expiry.setFullYear(expiry.getFullYear() + 1);

      const batch = db.batch();

      batch.update(db.collection('memberProfiles').doc(userId), {
        membershipStart:  admin.firestore.Timestamp.fromDate(now),
        membershipExpiry: admin.firestore.Timestamp.fromDate(expiry),
        paymentStatus:    'paid',
        updatedAt:        admin.firestore.FieldValue.serverTimestamp(),
      });

      const membershipRef = db.collection('memberships').doc();
      batch.set(membershipRef, {
        userId,
        membershipStart:  admin.firestore.Timestamp.fromDate(now),
        membershipExpiry: admin.firestore.Timestamp.fromDate(expiry),
        paymentStatus:    'paid',
        amount:           session.amount_total / 100,
        stripeSessionId:  session.id,
        createdAt:        admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();
      console.log(`Membership activated for user ${userId}`);
    }

    res.sendStatus(200);
  }
);
