const express = require('express');
const router = express.Router();
const {Order, User, Membership} = require('../models');
const {success, failure} = require('../utils/responses');
const {BadRequest, NotFound} = require('http-errors');
const {v4: uuidv4} = require('uuid');
const {setKey, getKey} = require("../utils/redis");

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
      offset: offset
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
      }
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
        attributes: ['id', 'username', 'avatar']
      }
    ]
  }
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
      userId: req.userId        // 用户只能查看自己的订单
    },
  });

  if (!order) {
    throw new NotFound(`订单号: ${outTradeNo} 的订单未找到。`)
  }

  return order;
}

/**
 * 创建订单
 * POST /orders
 */
router.post('/', async function (req, res, next) {
  try {
    const outTradeNo = uuidv4().replace(/-/g, '');
    const membership = await getMembership(req);

    const order = await Order.create({
      outTradeNo: outTradeNo,
      userId: req.userId,
      subject: membership.name,
      totalAmount: membership.price,
      status: 0,
    });

    success(res, '订单创建成功。', {order});
  } catch (error) {
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
