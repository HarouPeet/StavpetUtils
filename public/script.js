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
const resetLocFilter = document.getElementById("resetLocFilter");
const openLocBtn = document.getElementById("openLocBtn");
const modal = document.getElementById("entryModal");
const locModal = document.getElementById("locModal");
const datePicker = document.getElementById("date")
const appContainer = document.getElementById("appContainer");
const loginScreen = document.getElementById("loginScreen");
const closeButtons = document.querySelectorAll(".close");
const cancelBtn = document.querySelectorAll(".cancel");
const entriesBody = document.getElementById("entriesBody");
const entriesBodyLoc = document.getElementById("entriesBodyLoc");
const locationSelect = createCustomSelect("locationSelect", ["All"]);
const locationSelectForm = createCustomSelect("locationSelectForm", ["All"]);
const weatherSelect = document.getElementById('weatherSelect');
const userLang = localStorage.getItem("lang") || "en";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    appContainer.style.visibility = 'visible';
    appContainer.style.opacity = '1';
    loginScreen.style.display = "none";
    loadLocations();
    loadEntries();
    if (user.photoURL) {
      document.getElementById("userPhoto").src = user.photoURL;
    }
    document.getElementById("userName").textContent = user.displayName;
    //    document.getElementById("email").textContent = user.email;
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    appContainer.style.visibility = 'hidden';
    appContainer.style.opacity = '0';
    loginScreen.style.display = "flex";
  }
});

loadLanguage(userLang);
async function loadLanguage(lang) {
  const res = await fetch(`lang/${lang}.json`);
  const dict = await res.json();

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });
}

loginBtn.onclick = () => signInWithPopup(auth, new GoogleAuthProvider());
logoutBtn.onclick = () => signOut(auth);

resetFilter.onclick = () => {
  locationSelect.setValue("All");
  loadEntries("All");
};

resetLocFilter.onclick = () => {
  document.getElementById("locationSearch").value = "";
  filterLocList("");
};

openFormBtn.onclick = () => {
  modal.style.display = "block";
  document.getElementById("entryForm").reset();
  delete document.getElementById("entryForm").dataset.editingId;
  delete document.getElementById("entryForm").dataset.rawDate;
  document.body.style.overflow = "hidden";
  weatherSelect.innerHTML = "";
};

openLocBtn.onclick = () => {
  locModal.style.display = "block";
  document.getElementById("locForm").reset();
  delete document.getElementById("locForm").dataset.editingId;
  delete document.getElementById("locForm").dataset.rawDate;
  document.body.style.overflow = "hidden";
};

closeButtons.forEach(btn => {
  closeForm(btn)
});

cancelBtn.forEach(btn => {
  closeForm(btn)
});

function closeForm(_btn) {
  _btn.addEventListener("click", () => {
    const modal = _btn.closest(".modal");
    if (modal) {
      document.body.style.overflow = "";
      modal.style.display = "none";
    }
  });
}

//Get Weather Data From Firestore
async function getWeatherData(_date) {
  const day = new Date(_date);
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);

  const q = query(collection(db, "weatherData"), where("timestamp", ">=", start),
    where("timestamp", "<=", end)
  );

  const querySnapshot = await getDocs(q);
  const weatherData = new Array();
  weatherSelect.innerHTML = "";
  const dummyOption = document.createElement('option');
  const res = await fetch(`lang/${userLang}.json`);
  const dict = await res.json();
  dummyOption.textContent = dict.selectWeather;
  weatherSelect.appendChild(dummyOption);
  querySnapshot.forEach((doc) => {
    const entry = doc.data();
    const option = document.createElement('option');
    const timestamp = entry.timestamp.toDate();
    const hours = String(timestamp.getHours()).padStart(2, "0");
    const minutes = String(timestamp.getMinutes()).padStart(2, "0");
    const timeString = `${hours}:${minutes}`;
    var dataWeather = "Error";
    if (entry.data.weather) {
      dataWeather = entry.data.weather[0].description;
      dataWeather = dataWeather[0].toUpperCase() + dataWeather.slice(1);
    }
    const weatherValue = `${dataWeather}, ${entry.data.main.temp_min.toString().split(".")[0]}°C - ${entry.data.main.temp_max.toString().split(".")[0]}°C`
    option.value = weatherValue;
    option.textContent = `[${timeString}] ${weatherValue}`;
    weatherSelect.appendChild(option);
  });
}

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
    const actionsDiv = document.createElement("div");
    actionsDiv.classList.add("actionsCenter");
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.onclick = () => openEditLocForm(entry);
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    editBtn.classList.add("reset-btn");
    deleteBtn.classList.add("reset-btn");
    deleteBtn.onclick = async () => {
      if (confirm("Delete this entry?")) {
        await deleteData(entry.id, "location");
        createLocationsTable()
        filterLocList("");
      }
    };
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    actions.appendChild(actionsDiv);
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
      <td class="locationTd">${entry.location || "-"}</td>
      <td class="dateTd">${formattedDate || "-"}</td>
      <td class="weatherTd">${entry.weather || "-"}</td>
      <td class="commentsTd">${entry.comments || "-"}</td>
      <td class="photoTd">
        ${entry.photoUrl ? `<a href="${entry.photoUrl}" target="_blank">Link</a><br>` : ""}
      </td>
    `;
    const actions = document.createElement("td");
    const actionsDiv = document.createElement("div");
    actionsDiv.classList.add("actionsCenter");
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.onclick = () => openEditForm(entry);
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    editBtn.classList.add("reset-btn");
    deleteBtn.classList.add("reset-btn");
    deleteBtn.onclick = async () => {
      if (confirm("Delete this entry?")) {
        await deleteData(entry.id, "work");
        loadEntries();
      }
    };
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    actions.appendChild(actionsDiv);
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
  document.body.style.overflow = "hidden";
  locationSelectForm.setValue(entry.location);
  document.getElementById("comments").value = entry.comments || "";
  document.getElementById("weather").value = entry.weather || "";
  document.getElementById("photoUrl").value = entry.photoUrl || "";
  document.getElementById("date").value = entry.date;

  document.getElementById("entryForm").dataset.editingId = entry.id;
  getWeatherData(entry.date);
}

//Open Edit Form Locations
function openEditLocForm(entry) {
  locModal.style.display = "block";
  document.body.style.overflow = "hidden";
  document.getElementById("locForm").dataset.editingId = entry.id;
  document.getElementById("locationName").value = entry.name || "";
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
    if (locationSelect.getValue().length > 0)
      loadEntries(locationSelect.getValue());
    else
      loadEntries();
  } catch (err) {
    console.error(err);
    alert("Error saving entry");
  }
});

//Search Bar Filter Locations Table
function filterLocList(_value) {
  const searchTerm = _value.toLowerCase();
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
  document.getElementById('locationSearch').value = "";
  createLocationsTable();
});

//Language Switch Listeners
document.querySelectorAll('[data-lang]').forEach(btn => {
  btn.addEventListener("click", () => {
    const lang = btn.getAttribute("data-lang");
    localStorage.setItem("lang", lang);
    loadLanguage(lang);
  });
});

datePicker.addEventListener('change', () => {
  getWeatherData(datePicker.value)
});

weatherSelect.addEventListener('change', () => {
  if (weatherSelect.value.includes("°")) document.getElementById("weather").value = weatherSelect.value;
});
