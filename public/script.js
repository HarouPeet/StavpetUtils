import { firebaseConfig } from "./firebase-config.js";
import { } from "/utils.js";
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
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const openFormBtn = document.getElementById("openFormBtn");
const openLocBtn = document.getElementById("openLocBtn");
const refreshBtn = document.getElementById("refreshBtn");
const modal = document.getElementById("entryModal");
const locModal = document.getElementById("locModal");
const span = document.querySelector(".close");
const entriesBody = document.getElementById("entriesBody");
const locationFilter = document.createElement("select");
const locationList = document.getElementById("location");
locationFilter.id = "locationFilter";
locationFilter.innerHTML = "<option value=''>All Locations</option>";
document.body.insertBefore(locationFilter, document.getElementById("entriesTable"));

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    openFormBtn.style.display = "inline-block";
    openLocBtn.style.display = "inline-block";
    refreshBtn.style.display = "inline-block";
    loadLocations();
    loadEntries();
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    openFormBtn.style.display = "none";
    openLocBtn.style.display = "none";
    refreshBtn.style.display = "none";
  }
});

loginBtn.onclick = () => signInWithPopup(auth, new GoogleAuthProvider());
logoutBtn.onclick = () => signOut(auth);

openFormBtn.onclick = () => {
  modal.style.display = "block";
  document.getElementById("entryForm").reset();
  delete document.getElementById("entryForm").dataset.editingId;
  delete document.getElementById("entryForm").dataset.rawDate;
};

openLocBtn.onclick = () => {
  locModal.style.display = "block";
  document.getElementById("locForm").reset();
  delete document.getElementById("locForm").dataset.editingId;
  delete document.getElementById("locForm").dataset.rawDate;
};

refreshBtn.onclick = () => {
  loadLocations();
  loadEntries();
}

span.onclick = () => {
  modal.style.display = "none"
  locModal.style.display = "none"
};
window.onclick = (event) => {
  if (event.target == modal) modal.style.display = "none";
  if (event.target == locModal) locModal.style.display = "none";
};

locationFilter.addEventListener("change", loadEntries);

async function loadLocations() {
  const q = query(collection(db, "location"), where("userId", "==", auth.currentUser.uid), orderBy("name", "asc"));
  const snapshot = await getDocs(q)
  const locations = new Set();
  snapshot.forEach(doc => {
    const entry = doc.data();
    if (entry.name) locations.add(entry.name);
  });
  locationFilter.innerHTML = "<option value=''>All Locations</option>";
  locationList.innerHTML = "";
  locations.forEach(loc => {
    const opt = document.createElement("option");
    opt.value = loc;
    opt.textContent = loc;
    const opt2 = document.createElement("option");
    opt2.value = loc;
    opt2.textContent = loc;
    locationList.appendChild(opt2);
    locationFilter.appendChild(opt);
  });
}

async function loadEntries() {
  const filter = locationFilter.value;
  let q = query(collection(db, "work"),
    where("userId", "==", auth.currentUser.uid),
    orderBy("date", "desc"));

  if (filter.length > 1) q = query(collection(db, "work"),
    where("userId", "==", auth.currentUser.uid),
    where("location", "==", filter),
    orderBy("date", "desc"));

  const snapshot = await getDocs(q);
  entriesBody.innerHTML = "";
  snapshot.forEach(doc => {
    const entry = doc.data();
    entry.id = doc.id;
    const row = document.createElement("tr");
    const _date = new Date(entry.date);
    const formattedDate = `${_date.getDate()}.${_date.getMonth() + 1}.${_date.getFullYear()}`;
    row.innerHTML = `
      <td>${entry.location || "-"}</td>
      <td>${formattedDate || "-"}</td>
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
        await deleteData(entry.id, "work");
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

async function deleteData(_id, _doc) {
  const docRef = doc(db, _doc, _id);
  await deleteDoc(docRef);
  return true;
}

function openEditForm(entry) {
  modal.style.display = "block";
  document.getElementById("location").value = entry.location || "";
  document.getElementById("comments").value = entry.comments || "";
  document.getElementById("weather").value = entry.weather || "";
  document.getElementById("photoUrl").value = entry.photoUrl || "";
  document.getElementById("date").value = entry.date;

  document.getElementById("entryForm").dataset.editingId = entry.id;
}

document.getElementById("locForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const id = form.dataset.editingId;
  const data = {
    name: document.getElementById("locationName").value,
    userId: auth.currentUser.uid
  };
  try {
    if (id) {
      const docRef = doc(db, "location", id);
      await updateDoc(docRef, data);
    } else {
      await addDoc(collection(db, "location"), data);
    }
    form.reset();
    delete form.dataset.editingId;
    locModal.style.display = "none";
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
    date: document.getElementById("date").value,
    userId: auth.currentUser.uid
  };
  try {
    if (id) {
      const docRef = doc(db, "work", id);
      await updateDoc(docRef, data);
    } else {
      await addDoc(collection(db, "work"), data);
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
