# Simple WhatsApp API Server

This project provides a simple, self-hosted HTTP API to send WhatsApp messages using Node.js and the powerful `whatsapp-web.js` library. It's designed to be a lightweight bridge between your applications and WhatsApp, allowing you to programmatically send messages and media.

## Features

- **Send Text Messages**: Easily send plain text messages to any WhatsApp number or group.
- **Send Attachments**: Send media files (images, documents, etc.) with captions.
- **Secure Endpoint**: Protects the API endpoint with a secret token.
- **Persistent Session**: Saves your WhatsApp session locally, so you only need to scan the QR code once.
- **Easy to Deploy**: Minimal setup required to get the server running.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher recommended)
- npm (usually comes with Node.js)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd api-wa
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Configuration

The server is configured using environment variables.

1.  Create a `.env` file in the root of the project by copying the example file:
    ```bash
    cp .env.example .env
    ```

2.  Open the `.env` file and add your configuration details.

    ```dotenv
    # .env

    # The port the server will listen on.
    APP_PORT=3000

    # A unique, secret key to authorize API requests.
    # Generate a strong, random string for this.
    SECRET_TOKEN=YOUR_SUPER_SECRET_TOKEN_HERE
    ```

> **Security Note**: Your `SECRET_TOKEN` is the key to your API. Keep it private and never commit it to version control. The `.gitignore` file should include `.env`.

## Running the Application

1.  **Start the server:**
    ```bash
    npm start
    ```

2.  **Authenticate with WhatsApp:**
    The first time you run the server, a QR code will be displayed in your terminal.

    - Open WhatsApp on your phone.
    - Go to **Settings** > **Linked Devices** > **Link a Device**.
    - Scan the QR code shown in the terminal.

    Once authenticated, the server will print `WhatsApp client is ready!` and a session file will be created in the `.wwebjs_auth` folder. You won't need to scan the QR code again unless you log out or the session becomes invalid.

## API Usage

The API exposes a single endpoint to send messages.

### Send Message

- **URL**: `/send-message`
- **Method**: `POST`
- **Headers**:
  - `Content-Type`: `application/json`
  - `X-API-TOKEN`: `YOUR_SUPER_SECRET_TOKEN_HERE` (must match `SECRET_TOKEN` in your `.env` file)

#### Body (JSON)

**To send a text-only message:**

```json
{
    "to": "6281234567890",
    "msg": "Hello from my API! 👋"
}
```

**To send a message with a local file attachment:**

The `attachment` value must be the **full, absolute path** to the file on the server where the API is running.

```json
{
    "to": "120363048933333333@g.us",
    "msg": "Here is the monthly report you requested.",
    "attachment": "C:\\Users\\YourUser\\Documents\\reports\\report.pdf"
}
```

### Field Descriptions

- `to` (string, required): The recipient's WhatsApp ID. For personal chats, use the number in international format (e.g., `62812...`). For groups, use the group ID (e.g., `...-...@g.us`).
- `msg` (string, required): The text content of the message. If an attachment is included, this becomes the caption.
- `attachment` (string, optional): The absolute local file path of the media to send.

## Disclaimer

This project is not affiliated with, authorized, or endorsed by WhatsApp or any of its affiliates. Use it at your own risk. Automating user accounts can be against WhatsApp's Terms of Service.
