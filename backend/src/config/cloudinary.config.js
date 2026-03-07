const cloudinary = require('cloudinary').v2;
const multer     = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: 'dxfjpibbo',
  api_key:    '982523552448151',
  api_secret: 'IvjoY_Ank6fQJCjFcbt_0LLGRxU',
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => ({
    folder:          'mazingira/listings',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1920, height: 1440, crop: 'limit', quality: 'auto:best' }],
    public_id:       `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  }),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg','image/jpg','image/png','image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG and WebP images are allowed'));
  },
});

function getUploader() {
  return upload;
}

module.exports = { cloudinary, getUploader };