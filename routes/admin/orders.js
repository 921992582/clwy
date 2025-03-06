const express = require('express');
const router = express.Router();
const { Order, User } = require('../../models');
const { success, failure } = require('../../utils/responses');
const { NotFound } = require('http-errors');

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
      where: {},
      order: [['id', 'DESC']],
      limit: pageSize,
      offset: offset,
    };

    if (query.userId) {
      condition.where.userId = query.userId;
    }

    if (query.outTradeNo) {
      condition.where.outTradeNo = query.outTradeNo;
    }

    if (query.tradeNo) {
      condition.where.tradeNo = query.tradeNo;
    }

    if (query.status) {
      condition.where.status = query.status;
    }

    const { count, rows } = await Order.findAndCountAll(condition);
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
    attributes: { exclude: ['UserId'] },
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
  const { outTradeNo } = req.params;

  const order = await Order.findOne({
    ...getCondition(),
    where: { outTradeNo: outTradeNo },
  });

  if (!order) {
    throw new NotFound(`订单号: ${outTradeNo} 的订单未找到。`);
  }

  return order;
}

module.exports = router;
