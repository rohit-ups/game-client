# Game CRM Terminal Client

A simple terminal client for testing the Game CRM backend. This client allows you to:

1. Log in to the system
2. Store authentication token
3. Connect to the platform socket
4. Connect to a game socket (in testing mode)
5. Send test messages through the socket

## Prerequisites

- Node.js (v14 or higher)

## Installation

1. Clone this repository
2. Navigate to the terminal-client directory
3. Install dependencies:

npm install

## Configuration

Edit the `.env` file to configure the client:

```bash
API_BASE_URL=http://localhost:5000/api
SOCKET_URL=http://localhost:5000
NODE_ENV=testing
```

## Usage

### Start the Server

```bash
npm start
```

The server will run on the port specified in the `.env` file or default to `8080`.

## Features

- **Token Storage**: The client stores the authentication token in a local file for future use.
- **Socket Connection**: Connects to both platform and game sockets (in testing mode).
- **Real-time Updates**: Displays alerts and data received from the server.

