import {
  collection, getDocs, getDoc, doc, addDoc, setDoc, updateDoc, deleteDoc,
  query, orderBy, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Convert Firestore Timestamps to ISO date strings for React Admin
const serializeDoc = (id, data) => {
  const result = { id, ...data };
  Object.keys(result).forEach(key => {
    if (result[key]?.toDate) {
      result[key] = result[key].toDate().toISOString();
    }
  });
  return result;
};

const dataProvider = {
  getList: async (resource, { sort, pagination, filter }) => {
    const colRef = collection(db, resource);
    let q = colRef;
    if (sort?.field && sort.field !== 'id') {
      try {
        q = query(colRef, orderBy(sort.field, sort.order.toLowerCase()));
      } catch {
        q = colRef;
      }
    }
    const snapshot = await getDocs(q);
    let data = snapshot.docs.map(d => serializeDoc(d.id, d.data()));

    // In-memory filtering
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          data = data.filter(item =>
            String(item[key] ?? '').toLowerCase().includes(String(value).toLowerCase())
          );
        }
      });
    }

    const total = data.length;
    const { page, perPage } = pagination;
    data = data.slice((page - 1) * perPage, page * perPage);
    return { data, total };
  },

  getOne: async (resource, { id }) => {
    const snap = await getDoc(doc(db, resource, id));
    if (!snap.exists()) throw new Error(`${resource}/${id} not found`);
    return { data: serializeDoc(snap.id, snap.data()) };
  },

  getMany: async (resource, { ids }) => {
    const data = await Promise.all(
      ids.map(async id => {
        const snap = await getDoc(doc(db, resource, id));
        return snap.exists() ? serializeDoc(snap.id, snap.data()) : null;
      })
    );
    return { data: data.filter(Boolean) };
  },

  getManyReference: async (resource, { target, id, pagination }) => {
    const q = query(collection(db, resource), where(target, '==', id));
    const snapshot = await getDocs(q);
    let data = snapshot.docs.map(d => serializeDoc(d.id, d.data()));
    const total = data.length;
    const { page, perPage } = pagination;
    data = data.slice((page - 1) * perPage, page * perPage);
    return { data, total };
  },

  create: async (resource, { data }) => {
    const { id, ...rest } = data;
    const now = serverTimestamp();
    const docRef = await addDoc(collection(db, resource), { ...rest, createdAt: now, updatedAt: now });
    return { data: { id: docRef.id, ...rest } };
  },

  update: async (resource, { id, data }) => {
    const { id: _id, ...rest } = data;
    await updateDoc(doc(db, resource, id), { ...rest, updatedAt: serverTimestamp() });
    return { data: { id, ...rest } };
  },

  updateMany: async (resource, { ids, data }) => {
    await Promise.all(ids.map(id =>
      updateDoc(doc(db, resource, id), { ...data, updatedAt: serverTimestamp() })
    ));
    return { data: ids };
  },

  delete: async (resource, { id }) => {
    await deleteDoc(doc(db, resource, id));
    return { data: { id } };
  },

  deleteMany: async (resource, { ids }) => {
    await Promise.all(ids.map(id => deleteDoc(doc(db, resource, id))));
    return { data: ids };
  },
};

export default dataProvider;
