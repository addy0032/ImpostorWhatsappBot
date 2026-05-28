# WhatsApp Impostor Word Game Bot

A lightweight, beginner-friendly WhatsApp bot to play the Impostor Word Game with your private friend group.

## Features
* QR code terminal login
* Runs on your own WhatsApp number
* No complex database, no admin panel - simple in-memory session.
* Random word & category generation powered by AI (Groq API ChatGPT/Llama models)
* Roles are sent in DMs. Since you're also playing, the bot uses `delete for me` to hide other people's roles from your own WhatsApp.

## Prerequisites
* Node.js (v18+ recommended)
* A Groq API key (Grab one from [Groq console](https://console.groq.com/))

## Setup
1. Clone this repository or copy the files.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup environment variables:
   Copy `.env.example` to `.env` and add your Groq API key.
   ```
   GROQ_API_KEY=your_api_key_here
   GROQ_MODEL=chatgpt-oss-120b # Or any valid model string
   ```

## Running the Bot
Run the bot via `ts-node`:
```bash
npx ts-node src/index.ts
```

1. Look at your terminal, a QR code will be generated.
2. Open WhatsApp on your phone -> Linked Devices -> Link a Device.
3. Scan the QR code.
4. The bot is now running on your device!

## How to Play
1. Add the bot (which is your own number) to a WhatsApp group with your friends (around 5 people).
2. Inside that group, send:
   `!start`
3. The bot will:
   * DM everyone their roles (Impostor or Word)
   * The DMs sent to your friends will be automatically "Deleted for me" from your own view, so you (running the bot) won't see their roles!
   * The DM sent to YOU will remain intact.
   * Send the random discussion order in the group.
4. If you want to play a new round with the exact same friends:
   `!new`
5. At the end of the session:
   `!end`

## How delete-for-me works
The bot sends messages out using your number's session. After sending to another participant, it asks WhatsApp to modify that specific chat by applying a `deleteForMe` operation for that message key. This ensures the bot runner doesn't get spoilers in their chat logs.

## Troubleshooting
* If the bot disconnects, wait a moment; it attempts to reconnect.
* If you see authorization errors, delete the `auth_info` folder and restart the bot to scan a new QR code.
