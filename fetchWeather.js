const fetch = require("node-fetch");
const admin = require("firebase-admin");

const weatherApiKey = process.env.WEATHER_KEY;
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function main() {
  const city = "Bratislava";
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data || data.cod !== 200) {
      throw new Error(data.message || "Failed to get weather");
    }

    await db.collection("weatherData").add({
      timestamp: new Date(),
      data,
    });

    console.log(`Weather data saved for ${city}:`, data.weather[0].description);
  } catch (err) {
    console.error("Error fetching/saving weather:", err);
    process.exit(1);
  }
}

main();
