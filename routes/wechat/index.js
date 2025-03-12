const express = require('express');
const router = express.Router();
const axios = require('axios');
const {sequelize, User, Order} = require('../../models');
const {success, failure} = require('../../utils/responses');
const {BadRequest, NotFound} = require('http-errors');
const jwt = require('jsonwebtoken');
const {v4: uuidv4} = require('uuid');
const userAuth = require('../../middlewares/user-auth');
const logger = require("../../utils/logger");
const moment = require('moment');

const wechatApi = require('../../utils/wechat');

/**
 * 微信小程序登录
 * POST /wechat/sign_in
 */
router.post('/sign_in', async (req, res) => {
  try {
    const {code} = req.body;

    if (!code) {
      throw new BadRequest('请提供微信登录 code');
    }

    // 通过 code 获取微信用户 openid
    const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WECHAT_APPID,
        secret: process.env.WECHAT_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });
    const {errcode, errmsg, openid} = response.data;

    if (errcode) {
      throw new BadRequest('微信登录失败：' + errmsg);
    }

// 查找或创建用户
    let user = await User.findOne({
      where: {openid: openid}
    });

    if (!user) {
      // 首次登录，创建新用户
      const key = uuidv4();

      // 微信用户无邮箱、无用户名、无密码信息，随机生成
      user = await User.create({
        openid: openid,
        nickname: '微信用户',
        email: `wx-${key}@xw.cn`,
        username: `wx-${key}`,
        password: Math.random().toString(36).slice(-8),
        sex: 2,
        role: 0,
      });
    }

    // 生成 JWT token
    const token = jwt.sign(
      {
        userId: user.id,
      },
      process.env.SECRET,
      {expiresIn: '30d'}
    );

    success(res, '登录成功。', {token});


  } catch (error) {
    failure(res, error);
  }
});

/**
 * 微信支付
 * POST /wechat/pay
 */
router.post('/pay', userAuth, async function (req, res, next) {
  try {
    // 支付订单信息
    const order = await getOrder(req);
    const {outTradeNo, totalAmount, subject} = order;

    // 查询当前用户，因为发起支付，需要用户的 openid
    const user = await User.findByPk(req.userId);

    // 生成微信支付参数
    const result = await wechatApi.getPayParams({
      out_trade_no: outTradeNo,       // 商户内部订单号
      body: subject,                  // 商品简单描述
      total_fee: totalAmount * 100,   // 因为微信支付以「分」为单位，所以需要 * 100
      openid: user.openid             // 付款用户的 openid
    });

    // 返回给小程序
    success(res, '获取微信支付参数成功。', {result});
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 公共方法：查询当前订单
 * @param req
 * @returns {Promise<*>}
 */
async function getOrder(req) {
  const {outTradeNo} = req.body;
  if (!outTradeNo) {
    throw new BadRequest('订单号不能为空。');
  }

  const order = await Order.findOne({
    where: {
      outTradeNo: outTradeNo,
      userId: req.userId,
    },
  });

  // 用户只能查看自己的订单
  if (!order) {
    throw new NotFound(`订单号: ${outTradeNo} 的订单未找到。`);
  }

  if (order.status > 0) {
    throw new BadRequest('订单已支付或取消。');
  }

  return order;
}

/**
 * 微信支付通知
 * POST /wechat/notify
 */
router.post('/notify', wechatApi.middlewareForExpress('pay'), async function (req, res) {
  try {
    const info = req.weixin;

    if (info.return_code === 'SUCCESS' && info.result_code === 'SUCCESS') {
      const {out_trade_no, transaction_id, time_end} = info;
      // 支付时间转成 DATETIME 所需格式
      const paidAt = moment(time_end, 'YYYYMMDDHHmmss').format('YYYY-MM-DD HH:mm:ss');

      await paidSuccess(out_trade_no, transaction_id, paidAt);
      res.reply(''); // 回复微信服务器，表示已收到通知
    } else {
      // 支付失败或其他情况处理逻辑
      res.reply('错误消息');
    }

  } catch (error) {
    logger.warn('微信支付失败：', error);
    failure(res, error);
  }
});

/**
 * 支付成功后，更新订单状态和会员信息
 * @param outTradeNo
 * @param tradeNo
 * @param paidAt
 * @returns {Promise<void>}
 */
async function paidSuccess(outTradeNo, tradeNo, paidAt) {
  try {
    // 开启事务
    await sequelize.transaction(async (t) => {
      // 查询当前订单（在事务中）
      const order = await Order.findOne({
        where: {outTradeNo: outTradeNo},
        transaction: t,
        lock: true, // 增加排它锁
      });

      // 对于状态已更新的订单，直接返回。防止用户重复请求，重复增加大会员有效期
      if (order.status > 0) {
        return;
      }

      // 更新订单状态（在事务中）
      await order.update(
        {
          tradeNo: tradeNo, // 流水号
          status: 1, // 订单状态：已支付
          paymentMethod: 1, // 支付方式：微信支付
          paidAt: paidAt, // 支付时间
        },
        {transaction: t}
      );

      // 查询订单对应的用户（在事务中）
      const user = await User.findByPk(order.userId, {
        transaction: t,
        lock: true, // 增加排它锁
      });

      // 将用户组设置为大会员。可防止管理员创建订单，并将用户组修改为大会员
      if (user.role === 0) {
        user.role = 1;
      }

      // 使用moment.js，增加大会员有效期
      user.membershipExpiredAt = moment(user.membershipExpiredAt || new Date())
        .add(order.membershipMonths, 'months')
        .toDate();

      // 保存用户信息（在事务中）
      await user.save({transaction: t});
    });
  } catch (error) {
    // 将错误抛出，让上层处理
    throw error;
  }
}


module.exports = router;
