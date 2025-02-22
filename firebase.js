// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
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

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { auth, db };

