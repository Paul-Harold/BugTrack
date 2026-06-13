require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// CLIENT_URL can be a single origin or a comma-separated list. If unset, reflect
// the request origin (fine here — auth uses Bearer tokens, not cookies).
const origins = process.env.CLIENT_URL?.split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: origins && origins.length ? origins : true }));
app.use(express.json());

// Ensure a DB connection before handling any request. Cached after the first
// call, so this is effectively free on warm invocations / a persistent server.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/suites', require('./routes/suiteRoutes'));
app.use('/api/testcases', require('./routes/testCaseRoutes'));
app.use('/api/runs', require('./routes/testRunRoutes'));
app.use('/api/bugs', require('./routes/bugRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;

// Local development: run a normal long-lived HTTP server.
// On Vercel the app is imported by api/index.js and invoked per-request instead.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`BugTrack API running on http://localhost:${PORT}`));
}
