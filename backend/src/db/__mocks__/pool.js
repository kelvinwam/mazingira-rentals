// Manual mock for db/pool used in tests
const pool = {
  query: jest.fn(),
};

module.exports = pool;
