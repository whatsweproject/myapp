// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBmwxCsgEzpG1S8RKlSRlVgB5ur0_Nt5Fw",
  authDomain: "testapp-1e3ec.firebaseapp.com",
  projectId: "testapp-1e3ec",
  storageBucket: "testapp-1e3ec.firebasestorage.app",
  messagingSenderId: "759293664490",
  appId: "1:759293664490:web:8d53efb51d082ced6e4b93",
  measurementId: "G-QCL1MHQ7SS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export default app;