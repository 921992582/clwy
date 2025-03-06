require('dotenv').config();
const { mailConsumer } = require('./rabbit-mq');

const logger = require('./logger');
// 封装启动消费者的函数，方便后续扩展和错误处理
const startMailConsumer = async () => {
  try {
    await mailConsumer();
    logger.info('邮件消费者已启动');
  } catch (error) {
    logger.error('启动邮件消费者时出错:', error);
    process.exit(1);
  }
};

// 启动消费者
startMailConsumer();

// 监听进程信号，优雅关闭消费者
process.on('SIGINT', async () => {
  logger.info('收到 SIGINT 信号，正在优雅关闭邮件消费者...');
  try {
    // 这里可以添加关闭连接和通道的逻辑
    process.exit(0);
  } catch (error) {
    logger.error('关闭邮件消费者时出错:', error);
    process.exit(1);
  }
});
