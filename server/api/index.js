// Vercel serverless entry point — delegates every request to the Express app.
// All incoming paths are rewritten to this function via vercel.json.
module.exports = require('../server');
