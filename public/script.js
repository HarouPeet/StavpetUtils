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
const galleryModal = document.getElementById("galleryModal");
const galleryGrid = document.getElementById("galleryGrid");
const closeGallery = document.getElementById("closeGallery");

if (closeGallery) {
  closeGallery.onclick = () => {
    galleryModal.style.display = "none";
    document.body.style.overflow = "";
  };
}

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
  const fileInput = document.getElementById("photoFile");
  if (fileInput) fileInput.value = "";
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

    //Copy
    const copyBtn = document.createElement("button");
    copyBtn.textContent = "📋";
    copyBtn.classList.add("reset-btn");
    copyBtn.onclick = async () => {
      try {
        const duplicatedData = {
          name: entry.name ? `${entry.name} (Copy)` : "New Copy",
          userId: auth.currentUser.uid
        };
        await addDoc(collection(db, "location"), duplicatedData);
        loadLocations();
        createLocationsTable();
        filterLocList("");
      } catch (err) {
        console.error(err);
        alert("Error");
      }
    };

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
    actionsDiv.appendChild(copyBtn);
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
    let photoCellContent = "-";
    if (entry.photoUrl && entry.photoUrl.trim() !== "") {
      const photoCount = entry.photoUrl.split(",").length;

      photoCellContent = `
    <button class="view-photos-btn" onclick="openPhotoGallery('${entry.photoUrl}', '${entry.id}')">
      Foto (${photoCount})
    </button>
  `;
    }
    row.innerHTML = `
      <td class="locationTd">${entry.location || "-"}</td>
      <td class="dateTd">${formattedDate || "-"}</td>
      <td class="weatherTd">${entry.weather || "-"}</td>
      <td class="commentsTd">${entry.comments || "-"}</td>
      <td class="noteTd">${entry.note || "-"}</td>
<td class="photoTd">
    ${photoCellContent}
  </td>
    `;
    const actions = document.createElement("td");
    const actionsDiv = document.createElement("div");
    actionsDiv.classList.add("actionsCenter");
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.onclick = () => openEditForm(entry);

    //Copy
    const copyBtn = document.createElement("button");
    copyBtn.textContent = "📋";
    copyBtn.classList.add("reset-btn");
    copyBtn.onclick = async () => {
      try {
        const duplicatedData = {
          location: entry.location || "",
          comments: entry.comments || "",
          note: entry.note ? `${entry.note} (Copy)` : "",
          weather: entry.weather || "",
          photoUrl: entry.photoUrl || "",
          date: entry.date,
          userId: auth.currentUser.uid
        };
        await addDoc(collection(db, "work"), duplicatedData);

        if (locationSelect.getValue().length > 0)
          loadEntries(locationSelect.getValue());
        else
          loadEntries();
      } catch (err) {
        console.error(err);
        alert("Error");
      }
    };

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
    actionsDiv.appendChild(copyBtn);
    actionsDiv.appendChild(deleteBtn);
    actions.appendChild(actionsDiv);
    row.appendChild(actions);
    entriesBody.appendChild(row);
  });
  if (locationSelect.getValue() == "All" || locationSelect.getValue() == "" || entriesBody.innerHTML == "") {
    document.getElementById("exportPdf").disabled = true;
  } else {
    document.getElementById("exportPdf").disabled = false;
  }
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
  document.getElementById("note").value = entry.note || "";
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

// Photo preview
window.openPhotoGallery = function (photoUrlString, docId) {
  if (!photoUrlString || !docId) return;

  const galleryModal = document.getElementById("galleryModal");
  const galleryGrid = document.getElementById("galleryGrid");
  const closeGallery = document.getElementById("closeGallery");
  const deleteAllBtn = document.getElementById("deleteAllPhotosBtn");

  if (!galleryModal || !galleryGrid) return;

  galleryGrid.innerHTML = "";
  let urls = photoUrlString.split(",").map(url => url.trim()).filter(url => url !== "");

  async function updatePhotosInDatabase(updatedUrlsArray) {
    const newUrlString = updatedUrlsArray.join(",");
    const docRef = doc(db, "work", docId);

    try {
      await updateDoc(docRef, { photoUrl: newUrlString });

      if (updatedUrlsArray.length === 0) {
        galleryModal.style.display = "none";
        document.body.style.overflow = "auto";
      } else {
        window.openPhotoGallery(newUrlString, docId);
      }

      if (typeof loadEntries === "function") {
        if (locationSelect && locationSelect.getValue().length > 0) {
          loadEntries(locationSelect.getValue());
        } else {
          loadEntries();
        }
      }
    } catch (err) {
      console.error("Error updating photos:", err);
      alert("Failed to delete photo from database.");
    }
  }

  deleteAllBtn.onclick = async () => {
    if (confirm("Are you sure you want to delete ALL photos for this entry?")) {
      await updatePhotosInDatabase([]);
    }
  };

  const totalPhotos = urls.length;
  galleryGrid.style.gridTemplateColumns = totalPhotos === 1 ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))";

  urls.forEach((url, index) => {
    // 1. Card Container (Set position to relative so the button aligns to it)
    const container = document.createElement("div");
    container.style.cssText = "position: relative; border: 1px solid #ddd; padding: 8px; border-radius: 8px; background: #f9f9f9; display: flex; justify-content: center; align-items: center; overflow: hidden;";

    // 2. Image Element
    const img = document.createElement("img");
    img.src = url;
    img.alt = `Photo ${index + 1}`;
    img.style.cssText = totalPhotos === 1
      ? "width: 100%; max-height: 400px; object-fit: contain; border-radius: 6px; cursor: pointer;"
      : "width: 100%; height: 160px; object-fit: cover; border-radius: 6px; cursor: pointer;";
    img.onclick = () => window.open(url, "_blank");

    // 3. Floating Delete Button (Positioned absolutely over the top-right)
    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = "&times;"; // Displays a bold custom 'X' multiplication symbol
    deleteBtn.title = "Delete photo";
    deleteBtn.style.cssText = `
      position: absolute;
      top: 2px;
      right: 14px;
      width: 26px;
      height: 26px;
      background: rgba(220, 53, 69, 0.9); /* Translucent danger red */
      color: white;
      border: none;
      border-radius: 50%; /* Perfect circle */
      font-size: 18px;
      line-height: 22px;
      text-align: center;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0,0,0,0.25);
      transition: transform 0.1s, background 0.1s;
      padding: 0;
    `;

    // Simple hover micro-interactions
    deleteBtn.onmouseenter = () => deleteBtn.style.transform = "scale(1.1)";
    deleteBtn.onmouseleave = () => deleteBtn.style.transform = "scale(1.0)";

    deleteBtn.onclick = async (e) => {
      e.stopPropagation(); // Stops the image click action from firing simultaneously
      if (confirm("Delete this photo?")) {
        const filteredUrls = urls.filter((_, i) => i !== index);
        await updatePhotosInDatabase(filteredUrls);
      }
    };

    // Append items back to structural canvas
    container.appendChild(img);
    container.appendChild(deleteBtn);
    galleryGrid.appendChild(container);
  });

  galleryModal.style.display = "block";
  document.body.style.overflow = "hidden";

  if (closeGallery) {
    closeGallery.onclick = () => {
      galleryModal.style.display = "none";
      document.body.style.overflow = "auto";
    };
  }
};

//Image upload
async function uploadToImgbb(file) {
  if (!file) return "";

  //const apiKey = "__IMGBBB_API_KEY__";
  const apiKey = "5fbd0c6cc1608bec7099fa08e8b12e61";
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Imgbb upload failed");
    }

    const result = await response.json();
    return result.data.url;
  } catch (error) {
    console.error("Error uploading to Imgbb:", error);
    throw error;
  }
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

  const fileInput = document.getElementById("photoFile");
  let uploadedUrlArray = [];

  try {

    if (fileInput && fileInput.files.length > 0) {

      for (const file of fileInput.files) {
        const url = await uploadToImgbb(file);
        if (url) {
          uploadedUrlArray.push(url);
        }
      }
    }

    const currentHiddenUrlValue = document.getElementById("photoUrl") ? document.getElementById("photoUrl").value : "";

    const calculatedUrls = uploadedUrlArray.length > 0
      ? (id && currentHiddenUrlValue.trim() !== "" ? `${currentHiddenUrlValue},${uploadedUrlArray.join(",")}` : uploadedUrlArray.join(","))
      : (id ? currentHiddenUrlValue : "");

    const data = {
      location: locationSelectForm.getValue(),
      comments: document.getElementById("comments").value,
      note: document.getElementById("note").value,
      weather: document.getElementById("weather").value,
      photoUrl: calculatedUrls,
      date: document.getElementById("date").value,
      userId: auth.currentUser.uid
    };
    if (id) {
      const docRef = doc(db, "work", id);
      await updateDoc(docRef, data);
    } else {
      await addDoc(collection(db, "work"), data);
    }
    form.reset();
    if (fileInput) fileInput.value = "";
    delete form.dataset.editingId;
    modal.style.display = "none";
    if (locationSelect.getValue().length > 0)
      loadEntries(locationSelect.getValue());
    else
      loadEntries();
  } catch (err) {
    console.error(err);
    alert("Error");
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
