import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAOEgQqHIwGgidiKnD0ixdCljybDQxiloU",
  authDomain: "girls4girls-2ee40.firebaseapp.com",
  projectId: "girls4girls-2ee40",
  storageBucket: "girls4girls-2ee40.firebasestorage.app",
  messagingSenderId: "702895110468",
  appId: "1:702895110468:web:c99049d726ef5e97e4bf11",
  measurementId: "G-03XTMT8EM6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
