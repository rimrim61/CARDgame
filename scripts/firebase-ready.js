let databaseUrl;

async function loadDatabaseUrl() {
  if (databaseUrl) return databaseUrl;

  try {
    const { firebaseConfig } = await import("../firebase-config.js");
    databaseUrl = firebaseConfig.databaseURL?.replace(/\/$/, "");
  } catch (error) {
    databaseUrl = "";
  }

  return databaseUrl;
}

function canSaveToday() {
  const today = new Date().toISOString().slice(0, 10);
  const lastSavedDay = localStorage.getItem("lastFirebaseSaveDay");

  return lastSavedDay !== today;
}

function markSavedToday() {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem("lastFirebaseSaveDay", today);
}

export async function saveGameCompletion(record) {
  const url = await loadDatabaseUrl();

  if (!url || !canSaveToday()) return;

  try {
    await fetch(`${url}/c.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    markSavedToday();
  } catch (error) {
    console.warn("Firebase save skipped:", error);
  }
}
