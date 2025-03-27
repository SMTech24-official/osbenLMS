const catchAsync = require('../../utils/catchAsync');
const FileUpload = require('../../utils/FileUpload');
const  sendResponse  = require('../../utils/sendResponse');
const  AppError  = require('../../errors/AppError');

const fileController = {
  uploadFile: catchAsync(async (req, res) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Log file details for debugging
    console.log(`Processing file: ${req.file.originalname}, Size: ${(req.file.size / (1024 * 1024)).toFixed(2)}MB, Type: ${req.file.mimetype}`);

    const fileUrl = await FileUpload.uploadFile(req.file);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: 'File uploaded successfully',
      data: { fileUrl }
    });
  }),

  deleteFile: catchAsync(async (req, res) => {
    const { fileUrl } = req.body;
    
    if (!fileUrl) {
      throw new AppError('File URL is required', 400);
    }

    await FileUpload.deleteFile(fileUrl);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: 'File deleted successfully'
    });
  }),

};

module.exports = fileController; 