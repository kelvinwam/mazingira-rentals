require('dotenv').config();
require('express-async-errors');

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const compression = require('compression');

const { connectDB } = require('./database/connection');
const { notFoundHandler, errorHandler } = require('./common/middleware/error.middleware');
const { defaultLimiter }                = require('./common/middleware/rateLimit.middleware');

const authRoutes     = require('./modules/auth/auth.routes');
const usersRoutes    = require('./modules/users/users.routes');
const areasRoutes    = require('./modules/areas/areas.routes');
const amenitiesRoutes= require('./modules/amenities/amenities.routes');
const listingsRoutes = require('./modules/listings/listings.routes');
const reviewsRoutes  = require('./modules/reviews/reviews.routes');
const landlordRoutes = require('./modules/landlord/landlord.routes');
const wishlistRoutes = require('./modules/wishlist/wishlist.routes');
const messagesRoutes = require('./modules/messages/messages.routes');
const adminRoutes    = require('./modules/admin/admin.routes');
const searchRoutes   = require('./modules/search/search.routes');

const app = express();

app.use(helmet());
app.use(cors({
  origin:      process.env.APP_URL || 'http://localhost:3000',
  credentials: true,
  methods:     ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(defaultLimiter);

app.get('/health', (_req, res) => res.json({
  success:     true,
  service:     'Mazingira API — Stage 6',
  environment: process.env.NODE_ENV || 'development',
  timestamp:   new Date().toISOString(),
}));

const V1 = '/v1';
app.use(`${V1}/auth`,     authRoutes);
app.use(`${V1}/users`,    usersRoutes);
app.use(`${V1}/areas`,    areasRoutes);
app.use(`${V1}/amenities`,amenitiesRoutes);
app.use(`${V1}/listings`, listingsRoutes);
app.use(`${V1}/reviews`,  reviewsRoutes);
app.use(`${V1}/landlord`, landlordRoutes);
app.use(`${V1}/wishlist`, wishlistRoutes);
app.use(`${V1}/messages`, messagesRoutes);
app.use(`${V1}/admin`,    adminRoutes);
app.use(`${V1}/search`,   searchRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n✅  Mazingira API (Stage 6) running → http://localhost:${PORT}\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err.message);
    process.exit(1);
  }
}

bootstrap();
module.exports = { app };
