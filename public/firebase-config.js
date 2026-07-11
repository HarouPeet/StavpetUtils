const prodConfig = {
  apiKey: "AIzaSyDL55xvsI9swgt4RzUY8UfaMx2jmndBZtc",
  authDomain: "stavpetutils.firebaseapp.com",
  projectId: "stavpetutils",
  storageBucket: "stavpetutils.firebasestorage.app",
  messagingSenderId: "653249985602",
  appId: "1:653249985602:web:493a5bdd4f70245e7741db"
};

const testConfig = {
  apiKey: "AIzaSyBwt9Djq8dukRJWiNBt8kXrxnvIM8maN9o",
  authDomain: "stavpetutils-test.firebaseapp.com",
  projectId: "stavpetutils-test",
  storageBucket: "stavpetutils-test.firebasestorage.app",
  messagingSenderId: "202482092029",
  appId: "1:202482092029:web:e93a9b294658e72d58bb94"
};

export const firebaseConfig = window.location.hostname.includes("stavpetutils-test") || window.location.hostname.includes("localhost")
  ? testConfig 
  : prodConfig;