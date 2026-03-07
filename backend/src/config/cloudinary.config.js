const cloudinary      = require('cloudinary').v2;
const multer          = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: 'dxfjpibbo',
  api_key:    '982523552448151',
  api_secret: 'IvjoY_Ank6fQJCjFcbt_0LLGRxU',
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => ({
    folder:         'macharent/listings',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto:good' }],
    public_id:      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  }),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per image
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg','image/jpg','image/png','image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG and WebP images are allowed'));
  },
});

// For local dev without cloudinary — store in memory and return a placeholder URL
const memStorage = multer.memoryStorage();
const uploadLocal = multer({ storage: memStorage, limits: { fileSize: 5 * 1024 * 1024 } });

function getUploader() {
  // Use cloudinary only if credentials are set
  const hasCloudinary =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';
  return hasCloudinary ? upload : uploadLocal;
}

module.exports = { cloudinary, getUploader };
