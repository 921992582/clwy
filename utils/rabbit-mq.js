const amqp = require('amqplib');
const sendMail = require('./mail');
const logger = require('./logger');

// 创建全局的 RabbitMQ 连接和通道
let connection;
let channel;

// 封装一个重试连接的函数，增加连接的稳定性
const connectWithRetry = async (url, retries = 5, delay = 5000) => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await amqp.connect(url);
    } catch (error) {
      attempt++;
      logger.error(`RabbitMQ 连接尝试 ${attempt} 失败:`, error);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error('无法连接到 RabbitMQ，已达到最大重试次数');
};

/**
 * 连接到 RabbitMQ
 * @returns {Promise<*>}
 */
const connectToRabbitMQ = async () => {
  if (connection && channel) return;

  try {
    connection = await connectWithRetry(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    // 监听连接关闭事件，方便处理异常
    connection.on('close', () => {
      logger.warn('RabbitMQ 连接已关闭，尝试重新连接...');
      connection = null;
      channel = null;
    });

    // 监听连接错误事件，增强错误处理能力
    connection.on('error', (err) => {
      logger.error('RabbitMQ 连接发生错误:', err);
    });

    await channel.assertQueue('mail_queue', {durable: true});
  } catch (error) {
    logger.error('RabbitMQ 连接失败：', error);
    throw error;
  }
};

/**
 * 邮件队列生产者（发送消息）
 */
const mailProducer = async (msg) => {
  try {
    await connectToRabbitMQ(); // 确保已连接

    // 消息持久化设置，提高消息可靠性
    const options = {persistent: true};
    const sent = channel.sendToQueue('mail_queue', Buffer.from(JSON.stringify(msg)), options);
    if (!sent) {
      logger.warn('消息未能立即入队，等待下次机会');
    }
  } catch (error) {
    logger.error('邮件队列生产者错误：', error);
    throw error;
  }
};

/**
 * 邮件队列消费者（接收消息）
 */
const mailConsumer = async () => {
  try {
    await connectToRabbitMQ();

    // 消费消息时，手动确认消息，避免消息丢失
    channel.consume('mail_queue', async (msg) => {
      if (msg) {
        try {
          const message = JSON.parse(msg.content.toString());
          await sendMail(message.to, message.subject, message.html);
          channel.ack(msg); // 手动确认消息
        } catch (error) {
          logger.error('处理邮件消息时出错:', error);
          channel.nack(msg, false, true); // 消息处理失败，重新入队
        }
      }
    }, {noAck: false}); // 关闭自动确认

    logger.info('邮件队列消费者已开始监听');
  } catch (error) {
    logger.error('邮件队列消费者错误：', error);
    throw error;
  }
};

module.exports = {
  mailProducer,
  mailConsumer,
};