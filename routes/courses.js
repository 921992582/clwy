const express = require('express');
const router = express.Router();
const { Course, Category, Chapter, User } = require('../models');
const { NotFound, BadRequest } = require('http-errors');
const { success, failure } = require('../utils/responses');

/**
 * 查询课程列表
 * GET /courses
 */
router.get('/', async function (req, res) {
  try {
    const query = req.query;
    const currentPage = Math.abs(Number(query.currentPage)) || 1;
    const pageSize = Math.abs(Number(query.pageSize)) || 10;
    const offset = (currentPage - 1) * pageSize;

    if (!query.categoryId) {
      throw new BadRequest('获取课程列表失败，分类ID不能为空。');
    }

    const condition = {
      attributes: { exclude: ['CategoryId', 'UserId', 'content'] },
      where: { categoryId: query.categoryId },
      order: [['id', 'DESC']],
      limit: pageSize,
      offset: offset
    };

    const { count, rows } = await Course.findAndCountAll(condition);
    success(res, '查询课程列表成功。', {
      courses: rows,
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
 * 查询课程详情
 * GET /courses/:id
 */
router.get('/:id', async function (req, res) {
  try {
    const { id } = req.params;
    const condition = {
      attributes: { exclude: ['CategoryId', 'UserId'] },
    };

    const course = await Course.findByPk(id, condition);
    if (!course) {
      throw new NotFound(`ID: ${ id }的课程未找到。`)
    }

    // 查询课程关联的分类
    const category = await course.getCategory({
      attributes: ['id', 'name'],
    });

    // 查询课程关联的用户
    const user = await course.getUser({
      attributes: ['id', 'username', 'nickname', 'avatar', 'company'],
    });

    // 查询课程关联的章节
    const chapters = await course.getChapters({
      attributes: ['id', 'title', 'rank', 'createdAt'],
      order: [['rank', 'ASC'], ['id', 'DESC']]
    });

    success(res, '查询课程成功。', { course, category, user, chapters });
  } catch (error) {
    failure(res, error);
  }
});


module.exports = router;
