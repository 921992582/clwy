const schedule = require('node-schedule');
const {sequelize, Order} = require('../models');
const {Op} = require('sequelize');
const logger = require('../utils/logger');
const moment = require('moment');
const {producer} = require('../utils/rabbit-mq')

/**
 * 定时检查并处理超时未支付订单
 * 每天凌晨 0:00 执行一次
 */
async function processExpiredOrders() {
  // 定义每次查询的订单数量，即分页查询时每页的记录数
  const pageSize = 1;
  // 偏移量，用于分页查询，初始为 0 表示从第一条记录开始查询
  let offset = 0;
  // 标记是否还有更多数据可查询，初始设为 true
  let hasMoreData = true;

  // 当还有数据可查询时，进入循环进行分页查询和处理
  while (hasMoreData) {
    // 开启一个数据库事务，确保数据操作的原子性
    const t = await sequelize.transaction();
    try {
      // 查找超时未支付的订单，使用分页查询的方式
      const expiredOrders = await Order.findAll({
        // 只查询订单的 id 字段，减少数据传输量
        attributes: ['id'],
        where: {
          // 筛选出状态为 0（未支付）的订单
          status: 0,
          // 筛选出创建时间早于当前时间一天前的订单，即超时未支付订单
          createdAt: {
            [Op.lt]: moment().subtract(1, 'day').toDate()
          }
        },
        // 每页查询的记录数
        limit: pageSize,
        // 偏移量，用于分页
        offset: offset,
        // 将查询操作纳入当前事务
        transaction: t,
        // 使用排它锁，防止并发更新，保证数据一致性
        lock: true
      });

      // 如果查询到的过期订单数量为 0，说明没有更多符合条件的数据了
      if (expiredOrders.length === 0) {
        hasMoreData = false;
        // 提交事务
        await t.commit();
        // 跳出循环
        break;
      }

      // 提取已超时订单的 ID 列表，方便后续批量操作
      const orderIds = expiredOrders.map(order => order.id);

      // 将订单 ID 发送到消息队列，以便后续异步处理
      // await sendMessageToQueue('expired_orders_queue', orderIds);
      await producer('expired_orders_queue', orderIds)
      // 批量更新超时订单的状态为 2（已取消（超时））
      await Order.update(
        {
          status: 2,      // 订单状态：已取消（超时）
        },
        {
          where: {
            id: orderIds
          },
          // 将更新操作纳入当前事务
          transaction: t
        }
      );

      // 提交事务，确保数据更新操作生效
      await t.commit();
      // 偏移量增加，用于下一次分页查询
      offset += pageSize;
    } catch (error) {
      // 若出现异常，回滚事务，保证数据的一致性
      await t.rollback();
      // 记录错误日志，方便后续排查问题
      logger.error('定时任务处理超时订单失败：', error);
      // 跳出循环，终止当前查询流程
      break;
    }
  }
}

function scheduleOrderCheck() {
  // 使用 node - schedule 模块设置定时任务，每天凌晨 0:00 执行 processExpiredOrders 函数
  schedule.scheduleJob('0 0 0  * * *', processExpiredOrders);
}

// 导出 scheduleOrderCheck 函数，供其他模块调用以启动定时任务
module.exports = scheduleOrderCheck;