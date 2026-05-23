import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const isActiveMember = (profileData) => {
  if (!profileData) return false;
  const expiry = profileData.membershipExpiry?.toDate?.() ?? null;
  return profileData.paymentStatus === 'paid' && expiry && expiry > new Date();
};

const authProvider = {
  login: async ({ username, password }) => {
    await signInWithEmailAndPassword(auth, username, password);
    const user = auth.currentUser;
    const [userSnap, profileSnap] = await Promise.all([
      getDoc(doc(db, 'users', user.uid)),
      getDoc(doc(db, 'memberProfiles', user.uid)),
    ]);
    if (!userSnap.exists() || !userSnap.data().isAdmin) {
      await signOut(auth);
      throw new Error('Access denied. Admin accounts only.');
    }
    if (!isActiveMember(profileSnap.data())) {
      await signOut(auth);
      throw new Error('Access denied. An active membership is required.');
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  checkAuth: () =>
    new Promise((resolve, reject) => {
      const unsub = onAuthStateChanged(auth, async (user) => {
        unsub();
        if (!user) return reject();
        const [userSnap, profileSnap] = await Promise.all([
          getDoc(doc(db, 'users', user.uid)),
          getDoc(doc(db, 'memberProfiles', user.uid)),
        ]);
        if (userSnap.exists() && userSnap.data().isAdmin && isActiveMember(profileSnap.data())) {
          resolve();
        } else {
          reject();
        }
      });
    }),

  checkError: ({ status }) =>
    status === 401 || status === 403 ? Promise.reject() : Promise.resolve(),

  getIdentity: async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    const [userSnap, profileSnap] = await Promise.all([
      getDoc(doc(db, 'users', user.uid)),
      getDoc(doc(db, 'memberProfiles', user.uid)),
    ]);
    const d = userSnap.data();
    return {
      id: user.uid,
      fullName: `${d.firstName} ${d.lastName}`,
      email: user.email,
      avatar: profileSnap.data()?.photoURL || null,
    };
  },

  getPermissions: async () => {
    const user = auth.currentUser;
    if (!user) return 'guest';
    const snap = await getDoc(doc(db, 'users', user.uid));
    return snap.data()?.isAdmin ? 'admin' : 'member';
  },
};

export default authProvider;
