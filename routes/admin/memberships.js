const express = require('express');
const router = express.Router();
const { Membership } = require('../../models');
const { Op } = require('sequelize');
const { NotFound } = require('http-errors');
const { success, failure } = require('../../utils/responses');
const { delKey } = require('../../utils/redis');

/**
 * 查询大会员列表
 * GET /admin/memberships
 */
router.get('/', async function (req, res) {
  try {
    const query = req.query;

    const condition = {
      where: {},
      order: [
        ['rank', 'ASC'],
        ['id', 'ASC'],
      ],
    };

    if (query.name) {
      condition.where.name = {
        [Op.like]: `%${query.name}%`,
      };
    }

    const memberships = await Membership.findAll(condition);
    success(res, '查询大会员列表成功。', {
      memberships: memberships,
    });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 查询大会员详情
 * GET /admin/memberships/:id
 */
router.get('/:id', async function (req, res) {
  try {
    const membership = await getMembership(req);
    success(res, '查询大会员成功。', { membership });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 创建大会员
 * POST /admin/memberships
 */
router.post('/', async function (req, res) {
  try {
    const body = filterBody(req);

    const membership = await Membership.create(body);
    await clearCache();

    success(res, '创建大会员成功。', { membership }, 201);
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 更新大会员
 * PUT /admin/memberships/:id
 */
router.put('/:id', async function (req, res) {
  try {
    const membership = await getMembership(req);
    const body = filterBody(req);

    await membership.update(body);
    await clearCache(membership);

    success(res, '更新大会员成功。', { membership: membership });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 删除大会员
 * DELETE /admin/memberships/:id
 */
router.delete('/:id', async function (req, res) {
  try {
    const membership = await getMembership(req);
    await membership.destroy();
    await clearCache(membership);

    success(res, '删除大会员成功。');
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 公共方法：查询当前大会员
 */
async function getMembership(req) {
  const { id } = req.params;

  const membership = await Membership.findByPk(id);
  if (!membership) {
    throw new NotFound(`ID: ${id}的大会员未找到。`);
  }

  return membership;
}

/**
 * 公共方法：白名单过滤
 * @param req
 * @returns {{durationMonths: (number|*), price: (number|*), name, rank, description}}
 */
function filterBody(req) {
  return {
    name: req.body.name,
    durationMonths: req.body.durationMonths,
    price: req.body.price,
    rank: req.body.rank,
    description: req.body.description,
  };
}

/**
 * 清除缓存
 * @param membership
 * @returns {Promise<void>}
 */
async function clearCache(membership = null) {
  await delKey('memberships');

  if (membership) {
    await delKey(`membership:${membership.id}`);
  }
}

module.exports = router;
