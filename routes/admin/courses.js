const express = require('express');
const router = express.Router();
const { Course, Category, User, Chapter } = require('../../models');
const { Op } = require('sequelize');
const { NotFound, Conflict } = require('http-errors');
const { success, failure } = require('../../utils/responses');
const { getKeysByPattern, delKey } = require('../../utils/redis');
/**
 * 查询课程列表
 * GET /admin/courses
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

    if (query.categoryId) {
      condition.where.categoryId = query.categoryId;
    }

    if (query.userId) {
      condition.where.userId = query.userId;
    }

    if (query.name) {
      condition.where.name = {
        [Op.like]: `%${query.name}%`,
      };
    }

    if (query.recommended) {
      condition.where.recommended = query.recommended === 'true';
    }

    if (query.introductory) {
      condition.where.introductory = query.introductory === 'true';
    }

    const { count, rows } = await Course.findAndCountAll(condition);
    success(res, '查询课程列表成功。', {
      courses: rows,
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
 * 查询课程详情
 * GET /admin/courses/:id
 */
router.get('/:id', async function (req, res) {
  try {
    const course = await getCourse(req);
    success(res, '查询课程成功。', { course });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 创建课程
 * POST /admin/courses
 */
router.post('/', async function (req, res) {
  try {
    const body = filterBody(req);
    // 获取当前登录的用户 ID
    body.userId = req.user.id;

    const course = await Course.create(body);
    await clearCache();
    success(res, '创建课程成功。', { course }, 201);
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 更新课程
 * PUT /admin/courses/:id
 */
router.put('/:id', async function (req, res) {
  try {
    const course = await getCourse(req);
    const body = filterBody(req);

    await course.update(body);
    await clearCache(course);
    success(res, '更新课程成功。', { course });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 删除课程
 * DELETE /admin/courses/:id
 */
router.delete('/:id', async function (req, res) {
  try {
    const course = await getCourse(req);

    const count = await Chapter.count({ where: { courseId: req.params.id } });
    if (count > 0) {
      throw new Conflict('当前课程有章节，无法删除。');
    }

    await course.destroy();
    await clearCache(course);
    success(res, '删除课程成功。');
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 公共方法：关联分类、用户数据
 * @returns {{include: [{as: string, model, attributes: string[]}], attributes: {exclude: string[]}}}
 */
function getCondition() {
  return {
    attributes: { exclude: ['CategoryId', 'UserId'] },
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name'],
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatar'],
      },
    ],
  };
}

/**
 * 公共方法：查询当前课程
 */
async function getCourse(req) {
  const { id } = req.params;
  const condition = getCondition();

  const course = await Course.findByPk(id, condition);
  if (!course) {
    throw new NotFound(`ID: ${id}的课程未找到。`);
  }

  return course;
}

/**
 * 公共方法：白名单过滤
 * @param req
 * @returns {{image: *, name, introductory: (boolean|*), categoryId: (number|*), content, recommended: (boolean|*)}}
 */
function filterBody(req) {
  return {
    categoryId: req.body.categoryId,
    name: req.body.name,
    image: req.body.image,
    recommended: req.body.recommended,
    introductory: req.body.introductory,
    content: req.body.content,
    free: req.body.free,
  };
}

async function clearCache(course = null) {
  let keys = await getKeysByPattern('courses:*');
  if (keys.length !== 0) {
    await delKey(keys);
  }

  if (course) {
    await delKey(`course:${course.id}`);
  }
}

module.exports = router;
