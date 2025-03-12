const {setKey, getKey} = require('../utils/redis');

// 定义一个名为 SSEHandler 的类，用于处理服务器发送事件（SSE）的连接和数据广播
class SSEHandler {
  // 构造函数，在创建 SSEHandler 实例时会自动调用
  constructor() {
    // 使用 ES6 的 Set 数据结构来存储与浏览器建立 SSE 连接的响应对象（res）
    // Set 可以确保存储的元素唯一，避免重复
    this.clients = new Set();
  }

  /**
   * 初始化 SSE 数据流，处理新的客户端连接
   * @param {Object} res - Express 响应对象，用于向客户端发送数据
   * @param {Object} req - Express 请求对象，包含客户端的请求信息
   */
  initStream(res, req) {
    // 设置响应头，指定响应内容类型为 text/event-stream，这是 SSE 的标准内容类型
    res.setHeader('Content-Type', 'text/event-stream');
    // 设置缓存控制，禁止浏览器缓存响应内容，确保每次请求都能获取最新数据
    res.setHeader('Cache-Control', 'no-cache');
    // 设置连接类型为 keep-alive，保持与客户端的长连接
    res.setHeader('Connection', 'keep-alive');
    // 刷新响应头，将设置的响应头信息发送给客户端
    res.flushHeaders();
    // 将当前客户端的响应对象添加到 clients 集合中，以便后续广播数据时使用
    this.clients.add(res);

    // 监听客户端连接关闭事件，当客户端断开连接时触发回调函数
    req.on('close', () => {
      // 从 clients 集合中删除当前客户端的响应对象
      this.clients.delete(res);
      // 打印日志，提示客户端已断开连接
      console.log('Client disconnected');
    });
  }

  /**
   * 向所有连接的客户端广播数据
   * @param {Object} data - 要广播的数据对象，会被序列化为 JSON 字符串发送给客户端
   */
 async broadcastData(data) {

    await setKey('sse_broadcast_data', data);

    // 遍历 clients 集合中的每个客户端响应对象
    this.clients.forEach((client) => {
      // 检查客户端响应是否已经结束，如果未结束则继续发送数据
      if (!client.finished) {
        // 按照 SSE 的格式，以 "data: " 开头，后面跟上 JSON 序列化后的数据，以两个换行符 "\n\n" 结尾
        // 并将其写入客户端响应流，发送给客户端
        client.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    });
  }
}

// 将 SSEHandler 类导出，以便其他模块可以引入和使用
module.exports = SSEHandler;