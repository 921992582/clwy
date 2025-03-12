const express = require('express');
const router = express.Router();
const {Order, User, Membership} = require('../models');
const {success, failure} = require('../utils/responses');
const {BadRequest, NotFound} = require('http-errors');
const {v4: uuidv4} = require('uuid');
const {setKey, getKey, delKey} = require('../utils/redis');
const {broadcastStats} = require('../utils/broadcast-service');

/**
 * 查询订单列表
 * GET /orders
 */
router.get('/', async function (req, res) {
  try {
    const query = req.query;
    const currentPage = Math.abs(Number(query.currentPage)) || 1;
    const pageSize = Math.abs(Number(query.pageSize)) || 10;
    const offset = (currentPage - 1) * pageSize;

    const condition = {
      ...getCondition(),
      where: {userId: req.userId},
      order: [['id', 'DESC']],
      limit: pageSize,
      offset: offset,
    };

    if (query.outTradeNo) {
      condition.where.outTradeNo = query.outTradeNo;
    }

    if (query.tradeNo) {
      condition.where.tradeNo = query.tradeNo;
    }

    if (query.status) {
      condition.where.status = query.status;
    }

    const {count, rows} = await Order.findAndCountAll(condition);


    success(res, '查询订单列表成功。', {
      orders: rows,
      pagination: {
        total: count,
        currentPage,
        pageSize,
      },
    });
  } catch (error) {
    failure(res, error);
  }
});


/**
 * 查询订单详情
 * GET /orders/:outTradeNo
 */
router.get('/:outTradeNo', async function (req, res) {
  try {
    const order = await getOrder(req);
    success(res, '查询订单详情成功。', order);
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 公共方法：关联用户
 * @returns {{include: [{as: string, model, attributes: string[]}], attributes: {exclude: string[]}}}
 */
function getCondition() {
  return {
    attributes: {exclude: ['id', 'UserId']},
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatar'],
      },
    ],
  };
}

/**
 * 公共方法：查询当前订单
 */
async function getOrder(req) {
  const {outTradeNo} = req.params;

  const order = await Order.findOne({
    ...getCondition(),
    where: {
      outTradeNo: outTradeNo,
      userId: req.userId, // 用户只能查看自己的订单
    },
  });

  if (!order) {
    throw new NotFound(`订单号: ${outTradeNo} 的订单未找到。`);
  }

  return order;
}

/**
 * 创建订单
 * POST /orders
 */
// 定义一个处理 POST 请求的路由，路径为根路径（'/'）
// 当客户端向该路径发送 POST 请求时，此中间件函数会被调用
// req 表示请求对象，包含客户端发送的请求信息
// res 表示响应对象，用于向客户端发送响应
// next 是 Express 中的中间件函数，用于将控制权传递给下一个中间件
router.post('/', async function (req, res, next) {
  try {
    // 生成一个唯一的订单号
    // 使用 uuidv4 函数生成一个通用唯一识别码（UUID）
    // 然后使用 replace 方法将 UUID 中的连字符（-）替换为空字符串，得到一个无连字符的订单号
    const outTradeNo = uuidv4().replace(/-/g, '');

    // 调用 getMembership 函数，根据请求对象 req 获取会员信息
    // 这个函数可能会从数据库、缓存或其他数据源中获取与当前请求相关的会员信息
    const membership = await getMembership(req);

    // 使用 Sequelize 的 create 方法创建一个新的订单记录
    // 传入一个包含订单信息的对象，这些信息将被插入到数据库的 Order 表中
    const order = await Order.create({
      // 订单号，使用前面生成的唯一订单号
      outTradeNo: outTradeNo,
      // 用户 ID，从请求对象中获取当前用户的 ID
      userId: req.userId,
      // 订单主题，使用会员的名称
      subject: membership.name,
      // 会员时长（月），从会员信息中获取会员的持续月数
      membershipMonths: membership.durationMonths,
      // 订单总金额，使用会员的价格
      totalAmount: membership.price,
      // 订单状态，初始状态设为 0，通常表示待支付
      status: 0,
    });

    // 删除 Redis 中存储的订单统计数据缓存
    // 当有新订单创建时，之前的统计数据可能不再准确，所以需要删除缓存
    // 后续请求统计数据时会重新从数据库获取最新数据
    await delKey('stats_data_order');

    // 调用广播服务，将订单统计数据的更新广播出去
    // 这可能会触发前端页面或其他相关服务更新订单统计信息
    await broadcastStats('order');

    // 调用 success 函数，向客户端发送成功响应
    // 第一个参数是响应对象 res，用于发送响应
    // 第二个参数是成功消息，告知客户端订单创建成功
    // 第三个参数是包含订单信息的对象，客户端可以使用这些信息进行后续处理
    success(res, '订单创建成功。', {order});
  } catch (error) {
    // 如果在订单创建过程中出现错误，调用 failure 函数向客户端发送错误响应
    // 第一个参数是响应对象 res，用于发送响应
    // 第二个参数是捕获到的错误对象，客户端可以根据错误信息进行相应处理
    failure(res, error);
  }
});

/**
 * 查询大会员信息
 * @param req
 * @returns {Promise<*>}
 */
async function getMembership(req) {
  const {membershipId} = req.body;
  if (!membershipId) {
    throw new BadRequest('请选择要购买的大会员。');
  }

  let membership = await getKey(`membership:${membershipId}`);
  if (!membership) {
    membership = await Membership.findByPk(membershipId);

    if (!membership) {
      throw new NotFound('未找到大会员信息，请联系管理员。');
    }
    await setKey(`membership:${membershipId}`, membership);
  }

  return membership;
}

module.exports = router;
