const express = require('express');
const router = express.Router();
const {sequelize, User, Order} = require('../../models');
const {Op} = require('sequelize');
const {success, failure} = require('../../utils/responses');
const {getStatsQuery} = require('../../utils/stats-query');
const {initSSEStream} = require('../../utils/broadcast-service');
const {getKey, setKey} = require('../../utils/redis');
/**
 * 统计用户性别
 * GET /admin/charts/sex
 */
router.get('/sex', async function (req, res) {
  try {
    const male = await User.count({where: {sex: 0}});
    const female = await User.count({where: {sex: 1}});
    const unknown = await User.count({where: {sex: 2}});

    const data = [
      {value: male, name: '男性'},
      {value: female, name: '女性'},
      {value: unknown, name: '未选择'}
    ];

    success(res, '查询用户性别成功。', {data});
  } catch (error) {
    failure(res, error);
  }
});
// 获取统计数据的通用路由
router.get('/:type', async (req, res) => {
  const type = req.params.type;

  const query = getStatsQuery(type);
  if (!query) {
    return failure(res, new Error('Invalid stats type'));
  }

  try {
    // 先从 Redis 中获取数据
    let cachedData = await getKey(`stats_data_${type}`);
    if (cachedData) {
      return success(res, 'Stats data fetched successfully', {data: cachedData});
    }

    const [results] = await sequelize.query(query);
    const data = {
      months: results.map(item => item.month),
      values: results.map(item => item.value)
    };

    // 将数据存储到 Redis 中
    await setKey(`stats_data_${type}`, data);

    success(res, 'Stats data fetched successfully', {data});
  } catch (error) {
    failure(res, error);
  }
});

/**
 * SSE 统计不同类型数据
 * GET /admin/charts/stream/:type
 */
router.get('/stream/:type', async (req, res) => {
  const type = req.params.type;

  initSSEStream(type, res, req);
});


/**
 * 统计每个月用户数量
 * GET /admin/charts/user
 */
router.get('/user', async (req, res) => {
  try {
    const [results] = await sequelize.query(
      "SELECT DATE_FORMAT(`createdAt`, '%Y-%m') AS `month`, COUNT(*) AS `value` FROM `Users` GROUP BY `month` ORDER BY `month` ASC"
    );

    const data = {
      months: [],
      values: []
    };

    results.forEach((item) => {
      data.months.push(item.month);
      data.values.push(item.value);
    });

    success(res, '查询每月用户数量成功。', {data});
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;