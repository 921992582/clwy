const jwt = require('jsonwebtoken');
const { Unauthorized } = require('http-errors');
const { failure } = require('../utils/responses');

module.exports = async (req, res, next) => {
  try {
    // 判断 Token 是否存在
    const { token } = req.headers;
    if (!token) {
      throw new Unauthorized('当前接口需要认证才能访问。');
    }

    // 验证 token 是否正确
    const decoded = jwt.verify(token, process.env.SECRET);

    // 从 jwt 中，解析出之前存入的 userId
    const { userId } = decoded;

    // 如果通过验证，将 userId 挂载到 req 上，方便后续中间件或路由使用
    req.userId = userId;

    // 一定要加 next()，才能继续进入到后续中间件或路由
    next();
  } catch (error) {
    failure(res, error);
  }
};
