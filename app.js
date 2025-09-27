require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs-extra'); // Using fs-extra for recursive directory removal
const path = require('path');

// --- Configuration ---
const PORT = process.env.APP_PORT || 3000;
const SESSION_DIR = path.join(__dirname, '.wwebjs_auth');
const SECRET_TOKEN = process.env.SECRET_TOKEN;

// --- Pre-flight Checks ---
// Ensure the secret token is configured before starting
if (!SECRET_TOKEN) {
    console.error('FATAL ERROR: SECRET_TOKEN is not defined in your environment variables. Please create a .env file.');
    process.exit(1);
}


// --- Express App Initialization ---
const app = express();
app.use(express.json());


// --- WhatsApp Client Initialization ---
console.log('Initializing WhatsApp client...');
const client = new Client({
    authStrategy: new LocalAuth(), // Use local session saving
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for running in some environments
    }
});

client.on('qr', (qr) => {
    console.log('QR Code received, please scan with your phone.');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('Authentication successful!');
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE:', msg);
    console.log('Session data is likely corrupt. Deleting session and shutting down.');
    // Use fs.rmSync for Node.js v14.14+ or fs-extra for broader compatibility
    if (fs.existsSync(SESSION_DIR)) {
        fs.removeSync(SESSION_DIR);
    }
    console.log('Please restart the application to generate a new QR code.');
    process.exit(1);
});

client.on('ready', () => {
    console.log('WhatsApp client is ready!');
    // Start the Express server only after the client is ready
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is listening on port ${PORT}. Send POST requests to /send-message`);
    });
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out. Reason:', reason);
    // If the client is logged out, the session is invalid.
    // Delete the session directory and exit to allow for a clean restart.
    if (fs.existsSync(SESSION_DIR)) {
        console.log('Deleting session data...');
        fs.removeSync(SESSION_DIR);
    }
    console.log('Shutting down. Please restart the application.');
    process.exit(1);
});

// Initialize the client
client.initialize();


// --- Middleware for Token Validation ---
const validateToken = (req, res, next) => {
    const token = req.headers['x-api-token'];
    if (!token || token !== SECRET_TOKEN) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or missing API token.' });
    }
    next();
};


// --- API Endpoint Definition ---
app.post('/send-message', validateToken, async (req, res) => {
    const { to, msg, attachment } = req.body;

    if (!to || !msg) {
        return res.status(400).json({ success: false, message: 'Bad Request: "to" and "msg" fields are required.' });
    }

    // Format number to WhatsApp format (e.g., 6281234567890@c.us)
    const chatId = to.includes('@') ? to : `${to}@c.us`;

    try {
        if (attachment) {
            if (!fs.existsSync(attachment)) {
                 return res.status(400).json({ success: false, message: `Attachment not found at path: ${attachment}` });
            }
            const media = MessageMedia.fromFilePath(attachment);
            await client.sendMessage(chatId, media, { caption: msg });
        } else {
            await client.sendMessage(chatId, msg);
        }
        console.log(`Message sent to ${chatId}`);
        res.status(200).json({ success: true, message: 'Message sent successfully.' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error: Failed to send message.' });
    }
});


// --- Root Endpoint for Health Check ---
app.get('/', (req, res) => {
    res.send('WhatsApp API Server is running.');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await client.destroy();
  process.exit(0);
});