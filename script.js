let fileHandle = null;
let journal = [];

async function pickFile() {
  [fileHandle] = await window.showOpenFilePicker({
    types: [{
      description: 'JSON File',
      accept: { 'application/json': ['.json'] }
    }]
  });

  await loadFile();
}

async function loadFile() {
  if (!fileHandle) return;
  const file = await fileHandle.getFile();
  const text = await file.text();
  try {
    journal = JSON.parse(text);
    renderTable();
  } catch (e) {
    alert("Invalid JSON file.");
  }
}

function renderTable() {
  const table = document.getElementById("journalTable");
  table.innerHTML = "";
  journal.forEach(entry => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.location}</td>
      <td>${entry.comments}</td>
      <td>${entry.weather}</td>
      <td>${entry.photo ? `<img src="${entry.photo}" />` : ''}</td>
    `;
    table.appendChild(row);
  });
}

function openForm() {
  if (!fileHandle) {
    alert("Pick a database file first.");
    return;
  }
  document.getElementById("entryForm").style.display = "block";
}

function closeForm() {
  document.getElementById("entryForm").style.display = "none";
}

async function saveEntry() {
  const entry = {
    location: document.getElementById("location").value,
    comments: document.getElementById("comments").value,
    weather: document.getElementById("weather").value,
    photo: document.getElementById("photo").value
  };

  journal.push(entry);
  await writeFile();
  renderTable();
  closeForm();

  document.getElementById("location").value = "";
  document.getElementById("comments").value = "";
  document.getElementById("weather").value = "";
  document.getElementById("photo").value = "";
}

async function writeFile() {
  if (!fileHandle) return;
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(journal, null, 2));
  await writable.close();
}
