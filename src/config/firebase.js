import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyC0Gm4c9LcHTM1F4BZPjriORu3Zp-q0xGs',
  authDomain: 'abdulrahman-portfolio-10b38.firebaseapp.com',
  projectId: 'abdulrahman-portfolio-10b38',
  storageBucket: 'abdulrahman-portfolio-10b38.firebasestorage.app',
  messagingSenderId: '810744801079',
  appId: '1:810744801079:web:84d83ec35c337f21719cb2',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;