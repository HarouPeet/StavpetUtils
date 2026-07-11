export { createCustomSelect };
import { loadLocations, loadEntries } from "./script.js";

function convertDriveLink(originalUrl) {
  const match = originalUrl.match(/\/d\/(.+?)\//);
  if (match) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return originalUrl;
}

function createCustomSelect(containerId, initialOptions, placeholder = "All") {
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

const exportPdfBtn = document.getElementById("exportPdf");

exportPdfBtn.onclick = () => {
  exportEntriesPDF();
};

function exportEntriesPDF() {
  const table = document.getElementById('entriesTable');
  const headers = [];
  const body = [];
  const docTitle = document.getElementById("navHome").textContent;

  const headerCells = table.querySelectorAll('thead th');
  for (let i = 1; i < 5; i++) {
    headers.push(headerCells[i].innerText.trim());
  }

  body.push(headers);

  for (let row of table.tBodies[0].rows) {
    const rowData = [];
    for (let i = 1; i < 5; i++) {
      rowData.push(row.cells[i].innerText.trim());
    }
    body.push(rowData);
  }
  var locationHeader = document.querySelector('.locationTd').textContent;

  const docDefinition = {
    header: function () {
      return {
        stack: [
          { text: docTitle, style: 'headerTitle', alignment: 'center', fontSize: 18, bold: true },
          { text: locationHeader, style: 'headerTitle', alignment: 'center', fontSize: 16 },
        ],
        margin: [0, 10, 0, 0]
      };
    },
    footer: function (currentPage, pageCount) {
      return {
        margin: [40, 0, 40, 0],
        columns: [
          {
            text: currentPage + ' / ' + pageCount,
            alignment: 'left',
            margin: [0, 28, 0, 0]
          },
          {
            columns: [
              {
                stack: [
                  { text: '_______________________' },
                  { text: 'Zhotoviteľ', fontSize: 8 }
                ],
                alignment: 'center'
              },
              {
                stack: [
                  { text: '_______________________' },
                  { text: 'Objednávateľ', fontSize: 8 }
                ],
                alignment: 'center'
              }
            ],
            columnGap: 20,
            alignment: 'right',
            width: 'auto',
            margin: [0, 25, 0, 0]
          }
        ]
      };
    },
    content: [
      {
        table: {
          dontBreakRows: true,
          headerRows: 1,
          widths: [50, 70, '*', 100],
          body: body
        },
        layout: {
          fillColor: function (rowIndex) {
            return rowIndex === 0 ? '#CCCCCC' : null;
          },
          hLineColor: () => '#000000',
          vLineColor: () => '#000000',
          paddingLeft: () => 5,
          paddingRight: () => 5
        }
      }
    ],
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10], alignment: 'center' }
    },
    defaultStyle: {
      fontSize: 10
    },
    pageMargins: [40, 60, 40, 60]
  };

  pdfMake.createPdf(docDefinition).open();
}