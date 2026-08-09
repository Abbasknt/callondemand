import { initializeFirebase } from './init';

const instances = initializeFirebase();

export const db = instances.firestore;
export const auth = instances.auth;
