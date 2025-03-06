const createError = require('http-errors');
const multer = require('multer');
const logger = require("./logger");


/**
 * 请求成功
 * @param res
 * @param message
 * @param data
 * @param code
 */
function success(res, message, data = {}, code = 200) {
  res.status(code).json({
    status: true,
    message,
    data,
    code
  });
}


/**
 * 请求失败
 * @param res
 * @param error
 */
function failure(res, error) {
  // 初始化状态码和错误信息
  let statusCode;
  let errors;

  if (error.name === 'SequelizeValidationError') {      // Sequelize 验证错误
    statusCode = 400;
    errors = error.errors.map(e => e.message);
  } else if (error.name === 'SequelizeOptimisticLockError') {
    statusCode = 409;
    errors = '请求冲突，您提交的数据已被修改，请稍后重试。';
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {  // Token 验证错误
    statusCode = 401;
    errors = '您提交的 token 错误或已过期。';
  } else if (error instanceof createError.HttpError) {  // http-errors 库创建的错误
    statusCode = error.status;
    errors = error.message;
  } else if (error instanceof multer.MulterError) {     // multer 上传错误
    if (error.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      errors = '文件大小超出限制。';
    } else {
      statusCode = 400;
      errors = error.message;
    }
  } else {                                              // 其他未知错误
    statusCode = 500;
    errors = '服务器错误。';
    logger.error('服务器错误：', error);
  }

  res.status(statusCode).json({
    status: false,
    message: `请求失败: ${error.name}`,
    errors: Array.isArray(errors) ? errors : [errors]
  });
}

module.exports = {
  success,
  failure
}