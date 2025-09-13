// dashboard.js

// Configurazione Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBOEptpjvxndgos2gv5NGBh9xqwPRzJGpw",
  authDomain: "system-status-dashboard-885b1.firebaseapp.com",
  projectId: "system-status-dashboard-885b1",
  storageBucket: "system-status-dashboard-885b1.appspot.com",
  messagingSenderId: "920619662268",
  appId: "1:920619662268:web:080cbf07be4af7ccc849b9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const statusContainer = document.getElementById('status-container');
const lastUpdatedEl = document.getElementById('last-updated');

// Lista dei siti che stiamo monitorando (deve corrispondere a quella nello script Python)
const SITES_TO_MONITOR = [
    "https://google.com",
    "https://github.com",
    "https://www.terna.it",
];

async function fetchAndDisplayStatus() {
    console.log("Fetching latest status data...");
    lastUpdatedEl.textContent = new Date().toLocaleString('en-GB');
    
    // Svuota il contenitore prima di aggiungere i nuovi dati
    statusContainer.innerHTML = '';

    for (const siteUrl of SITES_TO_MONITOR) {
        // Query per ottenere l'ultimo log per ogni sito
        const query = db.collection("status_logs")
            .where("url", "==", siteUrl)
            .orderBy("timestamp", "desc")
            .limit(1);

        const snapshot = await query.get();

        let statusHtml = '';
        if (snapshot.empty) {
            // Se non ci sono dati per questo sito
            statusHtml = `<div class="status-item"><div class="site-info"><div class="site-url">${siteUrl}</div><div class="meta-info">No data available yet.</div></div></div>`;
        } else {
            const latestLog = snapshot.docs[0].data();
            const statusClass = latestLog.status === 'UP' ? 'status-up' : 'status-down';
            
            statusHtml = `
                <div class="status-item ${statusClass}">
                    <div class="site-info">
                        <div class="site-url">${latestLog.url}</div>
                        <div class="meta-info">
                            Response Time: <strong>${latestLog.response_time_ms}ms</strong>
                        </div>
                    </div>
                    <div class="status-badge ${statusClass}">${latestLog.status}</div>
                </div>
            `;
        }
        statusContainer.insertAdjacentHTML('beforeend', statusHtml);
    }
}

// Esegui la funzione al caricamento della pagina e poi ogni 60 secondi
fetchAndDisplayStatus();
setInterval(fetchAndDisplayStatus, 60000); // Auto-refresh every minute