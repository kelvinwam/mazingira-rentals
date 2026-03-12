// Silence noisy logs during tests unless TEST_VERBOSE=true
if (!process.env.TEST_VERBOSE) {
  global.console.log  = jest.fn();
  global.console.info = jest.fn();
}
