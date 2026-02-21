const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

const CONTACTS_FILE = "./contacts.json";

// In-memory storage for latest location (could be extended per-session/user)
let latestLocation = null;

/* Helper functions */
const readContacts = () => {
    const data = fs.readFileSync(CONTACTS_FILE);
    return JSON.parse(data);
};

const saveContacts = (contacts) => {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
};

/* Add contact */
app.post("/api/contacts", (req, res) => {
    const { name, phone } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ error: "Missing fields" });
    }

    const contacts = readContacts();

    contacts.push({ name, phone });

    saveContacts(contacts);

    res.json({ success: true, contacts });
});

/* Get contacts */
app.get("/api/contacts", (req, res) => {
    const contacts = readContacts();
    res.json(contacts);
});

/* Alert trigger */
app.post("/api/alert", (req, res) => {
    const { message, location } = req.body;

    const contacts = readContacts();

    console.log("\n🚨 ALERT RECEIVED");
    console.log("Message:", message);
    console.log("Location:", location);

    const whatsappLinks = contacts.map(c => ({
        name: c.name,
        link: `https://wa.me/${c.phone}?text=${encodeURIComponent(
            `${message}\nLocation: ${location}`
        )}`
    }));

    // Attempt to send messages via provider if configured (Twilio support)
    const sendAlerts = async (contactsList, msg, loc) => {
        // Require and send only if Twilio credentials are present
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
            return;
        }

        try {
            const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            const useWhatsApp = !!process.env.TWILIO_WHATSAPP_FROM;
            const from = useWhatsApp ? `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}` : process.env.TWILIO_FROM;

            for (const c of contactsList) {
                const to = useWhatsApp ? `whatsapp:${c.phone}` : c.phone;
                try {
                    // prefer loc param, otherwise use latestLocation stored from /api/location
                    const locToSend = loc || (latestLocation ? `Lat:${latestLocation.latitude}, Lon:${latestLocation.longitude}` : 'Unknown');
                    await twilio.messages.create({ from, to, body: `${msg}\nLocation: ${locToSend}` });
                    console.log(`Sent alert to ${c.name} (${c.phone}) via Twilio`);
                } catch (err) {
                    console.error('Failed to send to', c.phone, err && err.message);
                }
            }
        } catch (err) {
            console.error('Twilio setup failed or module missing', err && err.message);
        }
    };

    // fire-and-forget sending (non-blocking)
    sendAlerts(contacts, message, location).catch(e => console.error('sendAlerts error', e));

    res.json({
        success: true,
        contactsNotified: contacts.length,
        whatsappLinks
    });
});
app.get("/", (req, res) => {
    res.send("✅ SheShield backend running");
});

/* Receive live location updates from client */
app.post('/api/location', (req, res) => {
    const { latitude, longitude, timestamp } = req.body || {};
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: 'Invalid location payload' });
    }

    latestLocation = { latitude, longitude, timestamp: timestamp || Date.now() };
    console.log('Received live location:', latestLocation);
    res.json({ success: true });
});
app.listen(5000, () =>
    console.log("✅ Server running on http://localhost:5000")
);