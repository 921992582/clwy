const express = require('express');
const router = express.Router();
const { Log } = require('../../models');
const { NotFound } = require('http-errors');
const { success, failure } = require('../../utils/responses');

/**
 * 查询日志列表
 * GET /admin/logs
 */
router.get('/', async function (req, res) {
  try {
    const logs = await Log.findAll({
      order: [['id', 'DESC']],
    });

    success(res, '查询日志列表成功。', { logs: logs });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 查询日志详情
 * GET /admin/logs/:id
 */
router.get('/:id', async function (req, res) {
  try {
    const log = await getLog(req);

    success(res, '查询日志成功。', { log });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 清空全部日志
 * DELETE /admin/logs/clear
 */
router.delete('/clear', async function (req, res) {
  try {
    await Log.destroy({ truncate: true });

    success(res, '清空日志成功。');
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 删除日志
 * DELETE /admin/logs/:id
 */
router.delete('/:id', async function (req, res) {
  try {
    const log = await getLog(req);
    await log.destroy();

    success(res, '删除日志成功。');
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 公共方法：查询当前日志
 */
async function getLog(req) {
  const { id } = req.params;

  const log = await Log.findByPk(id);
  if (!log) {
    throw new NotFound(`ID: ${id}的日志未找到。`);
  }

  return log;
}

module.exports = router;
