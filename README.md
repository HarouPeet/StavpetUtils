# Work Journal App

A lightweight web-based work journal application built with **Firebase Hosting** and **Firestore**.  
It helps track work activities with weather context, quick location selection, and secure access via Google Sign-In.

---

## Features

- **Work Journal Entries**  
  - Record work done with:
    - Address  
    - Date  
    - Notes  
    - Work description  
    - Weather (auto-fetched)  

- **Weather Integration**  
  - Uses **OpenWeatherMap Free API**  
  - Weather data fetched **3× daily** via **GitHub Actions**  
  - Currently set up for **one location** (extendable if needed)  

- **Location Management**  
  - Maintain a list of addresses/locations  
  - Stored in Firestore for **quick selection** during entry creation  

- **Filtering & Exporting**  
  - Each page has **independent filtering**  
  - Export filtered Work Journal results as **PDF** (via [pdfmake](https://pdfmake.github.io/docs/))  

- **Authentication & Security**  
  - **Google Sign-In** for access  
  - Firestore security rules prevent unauthorized **read/write**  

---

## App Structure

- **Work Journal Page** → Create, view, filter, and export work entries  
- **Location List Page** → Manage addresses for faster entry creation  

---

## Tech Stack

- **Frontend & Hosting** → [Firebase Hosting](https://firebase.google.com/docs/hosting)  
- **Database** → [Cloud Firestore](https://firebase.google.com/docs/firestore)  
- **Auth** → [Firebase Authentication (Google Sign-In)](https://firebase.google.com/docs/auth)  
- **Weather Data** → [OpenWeatherMap API](https://openweathermap.org/api)  
- **Automation** → [GitHub Actions](https://docs.github.com/en/actions) for scheduled weather fetch  
- **PDF Export** → [pdfmake](https://pdfmake.github.io/docs/)  

---

## Authentication & Security

- Only signed-in Google accounts can access the app  
- Firestore security rules ensure only authenticated users can read/write data  

---

## License

MIT License. See [LICENSE](./LICENSE) for details.  
