import { getFirestore } from 'firebase/firestore/lite';
import { app } from './firebase';

// Kept in its own module so the Firestore SDK can be loaded on demand.
// AuthContext imports this dynamically; page chunks import it directly.
export const db = getFirestore(app);
