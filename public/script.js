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
import { } from "/utils.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const entryForm = document.getElementById("entryForm");
const entriesDiv = document.getElementById("entries");
const modal = document.getElementById("entryModal");
const formBtn = document.getElementById("openFormBtn");
const span = document.querySelector(".close");

loginBtn.onclick = () => signInWithPopup(auth, new GoogleAuthProvider());
logoutBtn.onclick = () => signOut(auth);

formBtn.onclick = function() {
  modal.style.display = "block";
  document.getElementById("entryForm").reset();
};

span.onclick = function() {
  modal.style.display = "none";
};

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline";
    formBtn.style.display = "inline";
    loadEntries(user.uid);
  } else {
    loginBtn.style.display = "inline";
    logoutBtn.style.display = "none";
    formBtn.style.display = "none";
    entriesDiv.innerHTML = "";
  }
});

entryForm.onsubmit = async (e) => {
  e.preventDefault();
  var user = auth.currentUser;
  if (!user) return;

  var location = document.getElementById("location").value;
  var date = document.getElementById("date").value;
  var weather = document.getElementById("weather").value;
  var comments = document.getElementById("comments").value;
  var photoURL = document.getElementById("photo").value;

  await addDoc(collection(db, "work"), {
    userId: user.uid,
    location,
    date,
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
  const q = query(collection(db, "work"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    const data = doc.data();
    if (data.userId !== uid) return;

    const div = document.createElement("div");
    div.className = "entry";
    div.innerHTML = `
      <strong>${data.location}</strong> - ${data.weather}<br/>
      <p>${data.comments}</p>
      <hr/>
    `;
    entriesDiv.appendChild(div);
  });
}
