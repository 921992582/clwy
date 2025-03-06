const { createLogger, format, transports } = require('winston');
const MySQLTransport = require('winston-mysql');

// 读取 config/config.json 数据库配置文件
// 根据环境变量 NODE_ENV 来选择对应数据库配置
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const options = {
  host: config.host,
  user: config.username,
  password: config.password,
  database: config.database,
  table: 'Logs',
};

const logger = createLogger({
  // 日志级别，只输出 info 及以上级别的日志
  level: 'info',
  // 日志格式为 JSON
  format: format.combine(
    format.errors({ stack: true }), // 添加错误堆栈信息
    format.json()
  ),
  // 添加元数据，这里添加了服务名称
  defaultMeta: { service: 'xw-api' },
  // 日志输出位置
  transports: [
    // 将 error 或更高级别的错误写入 error.log 文件
    new transports.File({ filename: 'error.log', level: 'error' }),
    // 将 info 或更高级别的日志写入 combined.log 文件
    new transports.File({ filename: 'combined.log' }),
    // 添加 MySQL 传输，将日志存储到数据库
    new MySQLTransport(options),
  ],
});

// 在非生产环境下，将日志输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(), // 终端中输出彩色的日志信息
        format.simple()
      ),
    })
  );
}

module.exports = logger;
