const express = require('express');
const router = express.Router();
const { Article } = require('../models');
const { success, failure } = require('../utils/responses');
const { NotFound } = require('http-errors');
const { setKey, getKey } = require('../utils/redis');
/**
 * 查询文章列表
 * GET /articles
 */
router.get('/', async function (req, res) {
  try {
    const query = req.query;
    const currentPage = Math.abs(Number(query.currentPage)) || 1;
    const pageSize = Math.abs(Number(query.pageSize)) || 10;
    const offset = (currentPage - 1) * pageSize;

    // 定义带有「当前页码」和「每页条数」的 cacheKey 作为缓存的键
    const cacheKey = `articles:${currentPage}:${pageSize}`;

    let data = await getKey(cacheKey);
    if (data) {
      return success(res, '查询文章列表成功。', data);
    }

    const condition = {
      attributes: { exclude: ['content'] },
      order: [['id', 'DESC']],
      limit: pageSize,
      offset: offset,
    };

    const { count, rows } = await Article.findAndCountAll(condition);
    data = {
      articles: rows,
      pagination: {
        total: count,
        currentPage,
        pageSize,
      },
    };
    await setKey(cacheKey, data);

    success(res, '查询文章列表成功。', data);
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 查询文章详情
 * GET /articles/:id
 */
router.get('/:id', async function (req, res) {
  try {
    const { id } = req.params;
    let article = await getKey(`article:${id}`);
    if (!article) {
      article = await Article.findByPk(id);
      if (!article) {
        throw new NotFound(`ID: ${id}的文章未找到。`);
      }
      await setKey(`article:${id}`, article);
    }

    success(res, '查询文章成功。', { article });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
