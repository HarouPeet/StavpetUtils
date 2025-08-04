import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const entryForm = document.getElementById("entryForm");
const entriesDiv = document.getElementById("entries");

loginBtn.onclick = () => signInWithPopup(auth, new GoogleAuthProvider());
logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline";
    entryForm.style.display = "block";
    loadEntries(user.uid);
  } else {
    loginBtn.style.display = "inline";
    logoutBtn.style.display = "none";
    entryForm.style.display = "none";
    entriesDiv.innerHTML = "";
  }
});

entryForm.onsubmit = async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const location = document.getElementById("location").value;
  const weather = document.getElementById("weather").value;
  const comments = document.getElementById("comments").value;
  const file = document.getElementById("photo").files[0];
  let photoURL = "";

  if (file) {
    const photoRef = ref(storage, `photos/${user.uid}/${Date.now()}_${file.name}`);
    await uploadBytes(photoRef, file);
    photoURL = await getDownloadURL(photoRef);
  }

  await addDoc(collection(db, "entries"), {
    userId: user.uid,
    location,
    weather,
    comments,
    photoURL,
    createdAt: Date.now()
  });

  entryForm.reset();
  loadEntries(user.uid);
};

async function loadEntries(uid) {
  entriesDiv.innerHTML = "";
  const q = query(collection(db, "entries"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    const data = doc.data();
    if (data.userId !== uid) return;

    const div = document.createElement("div");
    div.className = "entry";
    div.innerHTML = `
      <strong>${data.location}</strong> - ${data.weather}<br/>
      <p>${data.comments}</p>
      ${data.photoURL ? `<img src="${data.photoURL}" width="200" />` : ""}
      <hr/>
    `;
    entriesDiv.appendChild(div);
  });
}
