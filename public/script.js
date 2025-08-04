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

firebaseConfig.initializeApp(firebaseConfig);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const openFormBtn = document.getElementById("openFormBtn");
const openLocBtn = document.getElementById("openLocBtn");
const modal = document.getElementById("entryModal");
const span = document.querySelector(".close");
const entriesBody = document.getElementById("entriesBody");
const locationFilter = document.createElement("select");
locationFilter.id = "locationFilter";
locationFilter.innerHTML = "<option value=''>All Locations</option>";
document.body.insertBefore(locationFilter, document.getElementById("entriesTable"));

auth.onAuthStateChanged(user => {
  if (user) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    openFormBtn.style.display = "inline-block";
    loadLocations();
    loadEntries();
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    openFormBtn.style.display = "none";
  }
});

loginBtn.onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
};

logoutBtn.onclick = () => auth.signOut();

openFormBtn.onclick = () => {
  modal.style.display = "block";
  document.getElementById("entryForm").reset();
  delete document.getElementById("entryForm").dataset.editingId;
};

openLocBtn.onclick = () => {
  modal.style.display = "block";
  document.getElementById("locForm").reset();
  delete document.getElementById("locForm").dataset.editingId;
};

span.onclick = () => modal.style.display = "none";
window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; };

locationFilter.addEventListener("change", loadEntries);

async function loadLocations() {
  const snapshot = await db.collection("locations").where("userId", "==", auth.currentUser.uid).get();
  const locations = new Set();
  snapshot.forEach(doc => {
    const entry = doc.data();
    if (entry.location) locations.add(entry.location);
  });
  locationFilter.innerHTML = "<option value=''>All Locations</option>";
  locations.forEach(loc => {
    const opt = document.createElement("option");
    opt.value = loc;
    opt.textContent = loc;
    locationFilter.appendChild(opt);
  });
}

async function loadEntries() {
  const filter = locationFilter.value;
  let query = db.collection("entries").where("userId", "==", auth.currentUser.uid);
  if (filter) query = query.where("location", "==", filter);
  const snapshot = await query.orderBy("date", "desc").get();
  entriesBody.innerHTML = "";
  snapshot.forEach(doc => {
    const entry = doc.data();
    entry.id = doc.id;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.location || "-"}</td>
      <td>${entry.date?.toDate().toLocaleString() || "-"}</td>
      <td>${entry.weather || "-"}</td>
      <td>${entry.comments || "-"}</td>
      <td>
        ${entry.photoUrl ? `<a href="${entry.photoUrl}" target="_blank">Open</a><br>` : ""}
      </td>
    `;
    const actions = document.createElement("td");
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.onclick = () => openEditForm(entry);
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.onclick = async () => {
      if (confirm("Delete this entry?")) {
        await db.collection("entries").doc(entry.id).delete();
        loadEntries();
        loadLocations();
      }
    };
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    row.appendChild(actions);
    entriesBody.appendChild(row);
  });
}

function openEditForm(entry) {
  modal.style.display = "block";
  document.getElementById("location").value = entry.location || "";
  document.getElementById("comments").value = entry.comments || "";
  document.getElementById("weather").value = entry.weather || "";
  document.getElementById("photoUrl").value = entry.photoUrl || "";
  const dateInput = document.getElementById("date");
  if (entry.date?.toDate) {
    const dateObj = entry.date.toDate();
    dateInput.value = dateObj.toISOString().split("T")[0];
  }
  document.getElementById("entryForm").dataset.editingId = entry.id;
}

document.getElementById("locForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const id = form.dataset.editingId;
  const data = {
    location: document.getElementById("location").value,
    userId: auth.currentUser.uid
  };
  try {
    const ref = db.collection("locations");
    if (id) {
      await ref.doc(id).update(data);
    } else {
      await ref.add(data);
    }
    form.reset();
    delete form.dataset.editingId;
    modal.style.display = "none";
    loadLocations();
  } catch (err) {
    console.error(err);
    alert("Error saving location");
  }
});


document.getElementById("entryForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const id = form.dataset.editingId;
  const data = {
    location: document.getElementById("location").value,
    comments: document.getElementById("comments").value,
    weather: document.getElementById("weather").value,
    photoUrl: document.getElementById("photoUrl").value,
    date: new Date(document.getElementById("date").value),
    userId: auth.currentUser.uid
  };
  try {
    const ref = db.collection("entries");
    if (id) {
      await ref.doc(id).update(data);
    } else {
      await ref.add(data);
    }
    form.reset();
    delete form.dataset.editingId;
    modal.style.display = "none";
    loadEntries();
    loadLocations();
  } catch (err) {
    console.error(err);
    alert("Error saving entry");
  }
});
