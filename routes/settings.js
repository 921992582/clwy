const express = require('express');
const router = express.Router();
const {Setting} = require('../models');
const {NotFound} = require('http-errors');
const {success, failure} = require('../utils/responses');
const {setKey, getKey} = require('../utils/redis');
/**
 * 查询系统信息
 * GET /admin/settings
 */
router.get('/', async function (req, res) {
  try {
    const cacheKey = 'setting';
    let setting = await getKey(cacheKey);

    // 如果缓存中没有数据，则从数据库中读取数据
    if (!setting) {
      setting = await Setting.findOne();
      if (!setting) {
        throw new NotFound('未找到系统设置，请联系管理员。')
      }

      // 并将数据写入缓存
      await setKey(cacheKey, setting);
    }


    success(res, '查询系统信息成功。', {setting});
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
