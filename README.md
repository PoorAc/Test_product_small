# How to Run
Below is a step by step guide on how to run the app.

## Prerequisites
- Docker  
- Docker Compose  
- Node.js  
- npm  

## Running the Application

### Step 1: Install Docker
Ensure Docker and Docker Compose are installed and running on your system.

### Step 2: Build Docker Images
From the project root directory, run:
```bash
docker compose build
```

### Step 3: Start Backend Services
Start all backend services:
```bash
docker compose up
```

### Step 4: Start the Frontend
Open a new terminal, navigate to the frontend directory, and run:
```bash
cd frontend
npm install
npm run dev
```

## Keycloak Setup

### Step 5: Open Keycloak Admin Console
Open your browser and go to:
[Admin Console](http://localhost:8080)

### Step 6: Create a Realm
Create a new realm for the project and set the realm name in:
```bash
frontend/src/auth/keycloak.ts
```

### Step 7: Create a Client
Create a new client inside the realm and set the Client ID in:
```bash
frontend/src/auth/keycloak.ts
```

### Step 8: Configure Client Settings

Set the following values for the client:

- Root URL: http://localhost:5173

- Valid Redirect URIs: http://localhost:5173/*

- Web Origins: *

### Step 9: Create a User
Create a user in the realm, set credentials, and ensure the user is enabled.

## Using the Application

### Step 10: Open the App
Open your browser and navigate to:
[The app URL](http://localhost:5173)

Log in using the Keycloak user you created.

### Step 11: Upload and Download
You can now upload audio or video files and download the generated transcript.

## Notes
- Ensure Docker containers are running before starting the frontend.

- Restart the frontend after any Keycloak configuration changes.

- Stop other services using ports 8080 or 5173 if needed.