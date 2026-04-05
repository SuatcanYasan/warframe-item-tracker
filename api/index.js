// Vercel serverless function wrapper for the Express app
const { app } = require("../src/server");

module.exports = (req, res) => app(req, res);
