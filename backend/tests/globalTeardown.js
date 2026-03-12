// tests/globalTeardown.js
// Runs ONCE after the entire test suite
module.exports = async function () {
  // Give pg pool time to release connections cleanly
  await new Promise(r => setTimeout(r, 500));
};
