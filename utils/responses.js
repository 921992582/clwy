const createError = require('http-errors');
const multer = require('multer');
const winston = require('winston');

// 配置 winston 日志记录器
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log' })
  ]
});

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
  // 默认响应为 500，服务器错误
  let statusCode = 500;
  let errors = '服务器错误';

  // 记录详细的错误信息到日志文件
  logger.error({
    message: '请求失败',
    error: error.stack || error.message,
    name: error.name
  });

  if (error.name === 'SequelizeValidationError') {  // Sequelize 验证错误
    statusCode = 400;
    errors = error.errors.map(e => e.message);
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {  // Token 验证错误
    statusCode = 401;
    errors = '您提交的 token 错误或已过期。';
  } else if (error instanceof createError.HttpError) {  // http-errors 库创建的错误
    statusCode = error.status;
    errors = error.message;
  } else if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      errors = '文件大小超出限制。';
    } else {
      statusCode = 400;
      errors = error.message;
    }
  }

  res.status(statusCode).json({
    status: false,
    message: `请求失败: ${error.name}`,
    errors: Array.isArray(errors) ? errors : [errors],
    code: statusCode
  });
}

module.exports = {
  success,
  failure
}