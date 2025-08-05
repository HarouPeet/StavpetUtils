export { createCustomSelect };
import { loadLocations, loadEntries } from "./script.js";

function convertDriveLink(originalUrl) {
  const match = originalUrl.match(/\/d\/(.+?)\//);
  if (match) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return originalUrl;
}

function createCustomSelect(containerId, initialOptions, placeholder = "Filter") {
  const container = document.getElementById(containerId);
  container.innerHTML = `
      <div class="custom-select-display">${placeholder}</div>
      <div class="custom-select-dropdown">
        <input type="text" class="custom-select-search" placeholder="Search...">
        <div class="custom-select-options"></div>
      </div>
    `;

  const display = container.querySelector(".custom-select-display");
  const dropdown = container.querySelector(".custom-select-dropdown");
  const searchInput = container.querySelector(".custom-select-search");
  const optionsContainer = container.querySelector(".custom-select-options");

  let selectedValue = "";
  let options = [...initialOptions];

  function renderOptions(filter = "") {
    optionsContainer.innerHTML = "";
    const filtered = options.filter(opt => opt.toLowerCase().includes(filter.toLowerCase()));
    filtered.forEach(opt => {
      const div = document.createElement("div");
      div.className = "custom-select-option";
      div.textContent = opt;
      div.onclick = () => {
        display.textContent = opt;
        selectedValue = opt;
        dropdown.style.display = "none";
        if (shouldRefresh()) loadEntries(opt);
      };
      optionsContainer.appendChild(div);
    });
  }

  function shouldRefresh() {
    var triggerId = ["locationSelect"];
    return triggerId.includes(containerId)
  }

  display.addEventListener("click", () => {
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    renderOptions();
    searchInput.value = "";
    searchInput.focus();
  });

  searchInput.addEventListener("input", (e) => {
    renderOptions(e.target.value);
  });

  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });

  renderOptions();

  return {
    getValue: () => selectedValue,
    setValue: (newValue) => {
      selectedValue = newValue;
      display.textContent = newValue;
    },
    isValid: () => selectedValue !== "",
    setOptions: (newOptions) => {
      options = newOptions;
      renderOptions();
    }
  };
}