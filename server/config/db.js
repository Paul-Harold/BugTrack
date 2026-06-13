const mongoose = require('mongoose');

// On Vercel the API runs as serverless functions: each warm invocation reuses
// the same Node process, so we cache the connection on `global` to avoid opening
// a new pool on every request (which would quickly exhaust Atlas connections).
let cached = global._mongooseCache;
if (!cached) cached = global._mongooseCache = { conn: null, promise: null };

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
      .then((m) => {
        console.log(`MongoDB connected: ${m.connection.host}/${m.connection.name}`);
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // reset so the next request can retry
    throw err;
  }
  return cached.conn;
};

module.exports = connectDB;
