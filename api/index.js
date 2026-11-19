// Vercel runs this file as the backend. It reuses the same Express app from server/.
const mongoose = require('mongoose');
const app = require('../server/server.js');

// Vercel starts and stops this function often, so we keep one DB connection and reuse it
let connecting = null;
function connect() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 15000,
      })
      .catch((err) => {
        connecting = null; // try again on the next request
        throw err;
      });
  }
  return connecting;
}

// Send a JSON error without relying on helper methods
function fail(res, message) {
  res.statusCode = 500;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ message }));
}

module.exports = async (req, res) => {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    return fail(res, 'Server settings missing: add MONGO_URI and JWT_SECRET in Vercel.');
  }
  try {
    await connect();
  } catch (err) {
    console.log('DB connection failed:', err.message);
    return fail(res, 'Database connection failed. Check MONGO_URI and Atlas Network Access (0.0.0.0/0).');
  }
  return app(req, res);
};
