const express = require('express');
const router = express.Router();
const {Category, Course} = require('../../models');
const {Op} = require('sequelize');
const {NotFound, Conflict} = require('http-errors');
const {success, failure} = require('../../utils/responses');
const {delKey} = require('../../utils/redis');
/**
 * 查询分类列表
 * GET /admin/categories
 */
router.get('/', async function (req, res) {
  try {
    const query = req.query;

    const condition = {
      where: {},
      order: [['rank', 'ASC'], ['id', 'ASC']],
    };

    if (query.name) {
      condition.where.name = {
        [Op.like]: `%${query.name}%`
      };
    }

    const categories = await Category.findAll(condition);
    success(res, '查询分类列表成功。', {
      categories: categories,
    });
  } catch (error) {
    failure(res, error);
  }
});


/**
 * 查询分类详情
 * GET /admin/categories/:id
 */
router.get('/:id', async function (req, res) {
  try {
    const category = await getCategory(req);
    success(res, '查询分类成功。', {category});
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 创建分类
 * POST /admin/categories
 */
router.post('/', async function (req, res) {
  try {
    const body = filterBody(req);

    const category = await Category.create(body);

    await clearCache();
    success(res, '创建分类成功。', {category}, 201);
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 更新分类
 * PUT /admin/categories/:id
 */
router.put('/:id', async function (req, res) {
  try {
    const category = await getCategory(req);
    const body = filterBody(req);

    await category.update(body);
    await clearCache(category);
    success(res, '更新分类成功。', {category});
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 删除分类
 * DELETE /admin/categories/:id
 */
router.delete('/:id', async function (req, res) {
  try {
    const category = await getCategory(req);

    const count = await Course.count({where: {categoryId: req.params.id}});
    if (count > 0) {
      throw new Conflict('当前分类有课程，无法删除。');
    }

    await category.destroy();
    await clearCache(category);
    success(res, '删除分类成功。');
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 公共方法：查询当前分类
 */
async function getCategory(req) {
  const {id} = req.params;

  const category = await Category.findByPk(id);
  if (!category) {
    throw new NotFound(`ID: ${id}的分类未找到。`)
  }

  return category;
}

/**
 * 公共方法：白名单过滤
 * @param req
 * @returns {{name, rank: (number|*)}}
 */
function filterBody(req) {
  return {
    name: req.body.name,
    rank: req.body.rank
  };
}


/**
 * 清除缓存
 * @param category
 * @returns {Promise<void>}
 */
async function clearCache(category = null) {
  await delKey('categories');

  if (category) {
    await delKey(`category:${category.id}`);
  }
}

module.exports = router;
