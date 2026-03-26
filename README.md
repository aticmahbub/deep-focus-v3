# DeepFocus — Backend Setup Guide
## Stack: Node.js + Express + MongoDB Atlas

---

## 1. Create a MongoDB Atlas Cluster (free)

1. Go to https://cloud.mongodb.com and sign up / log in
2. Click **"Build a Database"** → choose **M0 Free Tier**
3. Choose a cloud provider & region (any nearby region)
4. Set a **username** and **password** for your database user
   - Save these — you'll need them in step 3
5. Under **"Where would you like to connect from?"** choose:
   - **"My Local Environment"** for development
   - Add IP: `0.0.0.0/0` (allow all) for now — restrict later in production
6. Click **Finish and Close**, then **Go to Database**

---

## 2. Get your Connection String

1. In Atlas, click **Connect** on your cluster
2. Choose **"Drivers"**
3. Select **Node.js**, version **5.5 or later**
4. Copy the connection string — it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

---

## 3. Configure Environment Variables

In the `deepfocus-backend/` folder:

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/deepfocus?retryWrites=true&w=majority
PORT=3001
FRONTEND_ORIGIN=*
```

- Replace `YOUR_USERNAME` and `YOUR_PASSWORD` with your Atlas credentials
- The `/deepfocus` at the end names your database — Atlas creates it automatically

---

## 4. Install Dependencies & Start the Server

```bash
cd deepfocus-backend
npm install
npm run dev       # development (auto-restarts on changes)
# or
npm start         # production
```

You should see:
```
✅  MongoDB Atlas connected
🚀  Server running on http://localhost:3001
```

Test it: http://localhost:3001/api/health

---

## 5. Open the Frontend

Open `deep-focus-v2.html` directly in your browser.

The frontend auto-generates a unique `deviceId` stored in `localStorage`. 
This ID links all your data in the database — same ID = same data across sessions.

**To sync across devices:** open the browser console on device A and run:
```js
localStorage.getItem('df_deviceId')
```
Copy that value, then on device B run:
```js
localStorage.setItem('df_deviceId', 'paste_the_id_here')
```
Then refresh device B — it will load the same data.

---

## 6. Deploy to Production (optional)

### Backend — Railway (easiest, free tier)
1. Push your `deepfocus-backend/` folder to a GitHub repo
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Add environment variables in Railway's dashboard (same as your `.env`)
4. Railway gives you a public URL like `https://deepfocus-backend.up.railway.app`

### Update the frontend
In `deep-focus-v2.html`, find this line:
```js
const API_BASE = 'http://localhost:3001/api';
```
Change it to your Railway URL:
```js
const API_BASE = 'https://deepfocus-backend.up.railway.app/api';
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server + DB health check |
| GET | `/api/session/:deviceId` | Get session (pomCount, theme) |
| PATCH | `/api/session/:deviceId` | Update session |
| GET | `/api/todos/:deviceId` | Get all todos |
| POST | `/api/todos/:deviceId` | Create todo `{ text }` |
| PATCH | `/api/todos/:id` | Update todo `{ done, text }` |
| DELETE | `/api/todos/:id` | Delete todo |
| DELETE | `/api/todos/:deviceId/done` | Clear completed todos |
| GET | `/api/nn/:deviceId` | Get non-negotiables (auto-resets daily) |
| POST | `/api/nn/:deviceId` | Create NN item `{ text }` |
| PATCH | `/api/nn/:id/toggle` | Toggle done state |
| DELETE | `/api/nn/:id` | Delete NN item |

---

## Project Structure

```
deepfocus-backend/
├── server.js          ← Entry point, Express setup, MongoDB connection
├── package.json
├── .env.example       ← Copy to .env and fill in your values
├── models/
│   └── index.js       ← Mongoose schemas (Session, Todo, NN)
└── routes/
    ├── session.js     ← Pomodoro count + theme
    ├── todos.js       ← Task CRUD
    └── nn.js          ← Non-Negotiables with daily reset logic

deep-focus-v2.html     ← Frontend (open in browser)
```
