# Hostel Management System (MERN)

A web app to manage a hostel: students, rooms and allotment, fees, complaints, mess and notifications.
Two roles: **Admin (warden)** and **Student**.

## Folder structure
```
hostel/
  server/            Node + Express + MongoDB (the backend / API)
    server.js        starts the server
    seed.js          adds sample data
    models/          database tables (User, Room, Fee, Complaint, Mess, Notification)
    routes/          API for each feature
    middleware/      login + role check
  client/            React (the website)
    src/App.jsx      menu and page routes
    src/api.js       helper to call the backend
    src/pages/       one file per page
```

## How to run (first time)

1. Install Node.js (LTS) and create a free MongoDB Atlas cluster (copy its connection string).
2. Backend:
   ```
   cd server
   npm install
   copy .env.example to .env  and put your MONGO_URI and any JWT_SECRET
   npm run seed        (adds sample admin, students, rooms, menu)
   npm start
   ```
3. Frontend (new terminal):
   ```
   cd client
   npm install
   npm run dev
   ```
4. Open http://localhost:5173

## Login for testing (after `npm run seed`)
| Role | Email | Password |
|---|---|---|
| Admin | admin@hostel.com | admin123 |
| Student | sameer@hostel.com | student123 |

New students can also register on the login page. Students added by the admin get password `student123`.

## Features
- **Access control:** JWT login, admin-only and student-only routes
- **Students:** admin adds / edits / deletes
- **Rooms:** admin adds rooms, allots or removes students (capacity is checked, no double allotment)
- **Fees:** admin adds fees, marks paid, sends due reminders; students see their dues
- **Complaints:** student raises, admin updates status (Open / In Progress / Resolved)
- **Mess:** weekly menu, admin edits it, students opt in or out of meals for a date, admin sees counts
- **Notifications:** automatic messages (room allotted, new fee, payment received, complaint update, reminders)
- **Dashboard:** counts for admin, personal summary for student
- **Mobile friendly:** responsive layout with a collapsing menu

## Edge cases handled
- Room allotment is atomic: a room cannot be overfilled and a student cannot get two rooms, even if two admins click together
- A paid fee cannot be paid twice; each fee gets at most one reminder per day
- Input checks for email, phone, year, amount, dates, room size and ids (bad ids return a clear 400, not a crash)
- Duplicate email, roll number and room (per block) are blocked
- 5 wrong passwords blocks that login for 15 minutes; passwords need 6+ characters
- Deleted accounts and expired tokens are logged out automatically; the role is always read from the database
- Deleting a student frees his bed and deletes his fees, complaints, meal choices and notifications
- A student can have at most 5 open complaints; meal choices only from yesterday up to 14 days ahead
- Admin can reset a student's password; every user can change their own (Account page)
- The app shows clear messages when the server is down, and the server refuses to start if `.env` is missing

## How a request flows (good for viva)
React page -> `api()` in `api.js` -> Express route -> `login` / `adminOnly` middleware -> Mongoose model -> MongoDB -> JSON back to the page.

## Deploy everything on Vercel (free)
The website and the API deploy together as one Vercel project (`api/index.js` runs the Express app from `server/`).
1. Create a free MongoDB Atlas database. Allow `0.0.0.0/0` under Network Access. Copy the connection string and put `/hostel` before the `?`.
2. Put the string in `server/.env` as `MONGO_URI` and run `npm run seed` once on your computer (creates the admin and sample students).
3. Push this whole folder to GitHub (the `api`, `client`, `server` folders and `vercel.json` must be at the top level).
4. In Vercel: Add New Project, pick the repo, leave **Root Directory empty**, Framework Preset **Other**.
5. Add environment variables `MONGO_URI` and `JWT_SECRET` (any long random text). Do not add `VITE_API_URL`.
6. Deploy, then open the link and login with `admin@hostel.com` / `admin123`.
