import { firebaseConfig } from "./firebase-config.js";
import { createCustomSelect } from "/utils.js";
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

export { loadLocations, loadEntries };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const openFormBtn = document.getElementById("openFormBtn");
const resetFilter = document.getElementById("resetFilter");
const openLocBtn = document.getElementById("openLocBtn");
const modal = document.getElementById("entryModal");
const locModal = document.getElementById("locModal");
const appContainer = document.getElementById("appContainer");
const loginScreen = document.getElementById("loginScreen");
const span = document.querySelector(".close");
const entriesBody = document.getElementById("entriesBody");
const entriesBodyLoc = document.getElementById("entriesBodyLoc");
const locationSelect = createCustomSelect("locationSelect", ["All"]);
const locationSelectForm = createCustomSelect("locationSelectForm", ["All"]);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    appContainer.style.visibility = 'visible';
    appContainer.style.opacity = '1';
    loginScreen.style.display = "none";
    loadLocations();
    loadEntries();
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    appContainer.style.visibility = 'hidden';
    appContainer.style.opacity = '0';
    loginScreen.style.display = "flex";
  }
});

loginBtn.onclick = () => signInWithPopup(auth, new GoogleAuthProvider());
logoutBtn.onclick = () => signOut(auth);

resetFilter.onclick = () => {
  locationSelect.setValue("All");
  loadEntries("All");
};

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

span.onclick = () => {
  modal.style.display = "none"
  locModal.style.display = "none"
};
window.onclick = (event) => {
  if (event.target == modal) modal.style.display = "none";
  if (event.target == locModal) locModal.style.display = "none";
};

//Get and Render Locations on Locations Page
async function createLocationsTable() {
  const q = query(collection(db, "location"), where("userId", "==", auth.currentUser.uid), orderBy("name", "asc"));
  const snapshot = await getDocs(q)
  entriesBodyLoc.innerHTML = "";
  snapshot.forEach(doc => {
    const entry = doc.data();
    entry.id = doc.id;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.name || "-"}</td>
    `;
    const actions = document.createElement("td");
    actions.classList.add("actionsCenter");
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.onclick = () => openEditLocForm(entry);
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.onclick = async () => {
      if (confirm("Delete this entry?")) {
        await deleteData(entry.id, "location");
        createLocationsTable()
        filterLocList("");
      }
    };
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    row.appendChild(actions);
    entriesBodyLoc.appendChild(row);
  });
}

//Load Locations
async function loadLocations() {
  const q = query(collection(db, "location"), where("userId", "==", auth.currentUser.uid), orderBy("name", "asc"));
  const snapshot = await getDocs(q)
  const locations = new Array();
  locations.push("All");
  locationSelect.setOptions(locations);
  locationSelectForm.setOptions(locations);
  snapshot.forEach(doc => {
    const entry = doc.data();
    if (entry.name) locations.push(entry.name);
  });
}


//Load Work Entries
async function loadEntries(filter = "All") {
  let q = query(collection(db, "work"),
    where("userId", "==", auth.currentUser.uid),
    orderBy("date", "desc"));

  if (filter != "All") q = query(collection(db, "work"),
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
    actions.classList.add("actionsCenter");
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.onclick = () => openEditForm(entry);
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.onclick = async () => {
      if (confirm("Delete this entry?")) {
        await deleteData(entry.id, "work");
        loadEntries();
      }
    };
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    row.appendChild(actions);
    entriesBody.appendChild(row);
  });
}

//Delete From DB
async function deleteData(_id, _doc) {
  const docRef = doc(db, _doc, _id);
  await deleteDoc(docRef);
  return true;
}

//Open Edit Form
function openEditForm(entry) {
  modal.style.display = "block";
  locationSelectForm.setValue(entry.location);
  document.getElementById("comments").value = entry.comments || "";
  document.getElementById("weather").value = entry.weather || "";
  document.getElementById("photoUrl").value = entry.photoUrl || "";
  document.getElementById("date").value = entry.date;

  document.getElementById("entryForm").dataset.editingId = entry.id;
}

//Open Edit Form Locations
function openEditLocForm(entry) {
  locModal.style.display = "block";
  document.getElementById("locForm").dataset.editingId = entry.id;
}

//Listen For Location Submit
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
    createLocationsTable();
    filterLocList("");
  } catch (err) {
    console.error(err);
    alert("Error saving location");
  }
});

//Listen For Work Entry Submit
document.getElementById("entryForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const id = form.dataset.editingId;
  const data = {
    location: locationSelectForm.getValue(),
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
  } catch (err) {
    console.error(err);
    alert("Error saving entry");
  }
});

//Search Bar Filter Locations Table
function filterLocList(_value) {
  const searchTerm = this._value.toLowerCase();
  const rows = document.querySelectorAll('#entriesTableLoc tbody tr');

  rows.forEach(row => {
    const rowText = row.innerText.toLowerCase();
    row.style.display = rowText.includes(searchTerm) ? '' : 'none';
  });
}

//Trigger Locations Search Bar
document.getElementById('locationSearch').addEventListener('input', function () {
  filterLocList(this.value || "");
});

//Switch to Main Page
document.getElementById('navHome').addEventListener('click', () => {
  document.getElementById('homeSection').style.display = 'block';
  document.getElementById('locationsSection').style.display = 'none';
  locationSelect.setValue("All");
  loadEntries();
});

//Switch to Locations Page
document.getElementById('navLocations').addEventListener('click', () => {
  document.getElementById('homeSection').style.display = 'none';
  document.getElementById('locationsSection').style.display = 'block';
  createLocationsTable();
});
