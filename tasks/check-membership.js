const schedule = require('node-schedule');
const { sequelize, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * 定时检查并处理过期会员
 *
 */
function scheduleMembershipCheck() {
  schedule.scheduleJob('0 0 0 * * *', async () => {
    const t = await sequelize.transaction();

    try {
      // 查找所有已过期的大会员用户
      const expiredUsers = await User.findAll({
        attributes: ['id'],
        where: {
          role: 1,
          membershipExpiredAt: {
            [Op.lt]: new Date()  // 小于当前时间
          }
        },
        transaction: t,
        lock: true
      });

      // 已过期的用户 ID 列表
      const userIds = expiredUsers.map(user => user.id);

      // 批量更新过期用户的角色
      await User.update(
        {
          role: 0,  // 将用户组改为普通用户
          membershipExpiredAt: null
        },
        {
          where: {
            id: userIds
          },
          transaction: t
        }
      );

      await t.commit();
    } catch (error) {
      await t.rollback();
      logger.error('定时任务处理过期大会员失败：', error);
    }
  });
}

module.exports = scheduleMembershipCheck;
