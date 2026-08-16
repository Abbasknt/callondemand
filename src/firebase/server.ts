import { initializeFirebase } from './init';

export function getAdminDb() {
  return initializeFirebase().firestore;
}

export function getAdminAuth() {
  return initializeFirebase().auth;
}

export const db = new Proxy(function() {}, {
  get(_target, prop, receiver) {
    const firestore = initializeFirebase().firestore;
    const val = Reflect.get(firestore, prop, firestore);
    return typeof val === 'function' ? val.bind(firestore) : val;
  },
  apply() {
    return initializeFirebase().firestore;
  },
  getPrototypeOf() {
    return Object.getPrototypeOf(initializeFirebase().firestore);
  },
  has(_target, prop) {
    return Reflect.has(initializeFirebase().firestore, prop);
  }
}) as any;

export const auth = new Proxy(function() {}, {
  get(_target, prop, receiver) {
    const authInst = initializeFirebase().auth;
    const val = Reflect.get(authInst, prop, authInst);
    return typeof val === 'function' ? val.bind(authInst) : val;
  },
  apply() {
    return initializeFirebase().auth;
  },
  getPrototypeOf() {
    return Object.getPrototypeOf(initializeFirebase().auth);
  },
  has(_target, prop) {
    return Reflect.has(initializeFirebase().auth, prop);
  }
}) as any;

