const express = require('express');
const router = express.Router();
const {Course, Category, User} = require('../models');
const {success, failure} = require('../utils/responses');
const {setKey, getKey} = require('../utils/redis');
/**
 * 查询首页数据
 * GET /
 */
router.get('/', async function (req, res, next) {
  try {

    // 如果有缓存，直接返回缓存数据
    let data = await getKey('index');
    if (data) {
      return success(res, '查询首页数据成功。', data);
    }
    // 如果没有缓存，查询数据库
    const [recommendedCourses, likesCourses, introductoryCourses] = await Promise.all([
      // 焦点图（推荐的课程）
      Course.findAll({
        attributes: {exclude: ['CategoryId', 'UserId', 'content']},
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'nickname', 'avatar', 'company'],
          }
        ],
        where: {recommended: true},
        order: [['id', 'desc']],
        limit: 10
      }),

      Course.findAll({
        attributes: {exclude: ['CategoryId', 'UserId', 'content']},
        order: [['likesCount', 'desc'], ['id', 'desc']],
        limit: 10
      }),

      // 入门课程
      Course.findAll({
        attributes: {exclude: ['CategoryId', 'UserId', 'content']},
        where: {introductory: true},
        order: [['id', 'desc']],
        limit: 10
      })

    ])


    // 组装数据
    data = {
      recommendedCourses,
      likesCourses,
      introductoryCourses
    }

    // 设置缓存过期时间，为10秒钟
    await setKey('index', data,  30 * 60);

    return success(res, '查询首页数据成功。', data);
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
