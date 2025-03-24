const { AppError } = require('../errors/AppError');

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      throw new AppError('File size too large. Maximum size is 100MB', 400);
    }
    throw new AppError(err.message, 400);
  } else if (err) {
    throw new AppError(err.message, 400);
  }
  next();
};

module.exports = handleMulterError; 