const multer = require('multer');
const sharp = require('sharp');
const Uuid = require('uuid')

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError('no an image uploaded ,please aupload only images', 400),
      false,
    );
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

exports.resizePhoto = async (req, res, next) => {
  if (!req.file) return next();

  req.body.photo = `user-${Uuid.v4()}-${Date.now()}.jpg`;

await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .toFile(`public/img/users/${req.body.photo}`);
    next()
};
