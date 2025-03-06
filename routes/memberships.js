const express = require('express');
const router = express.Router();
const { Membership } = require('../models');
const { success, failure } = require('../utils/responses');
const { setKey, getKey } = require('../utils/redis');

/**
 * 查询大会员列表
 * GET /memberships
 */
router.get('/', async function (req, res, next) {
  try {
    let memberships = await getKey('memberships');
    if (!memberships) {
      memberships = await Membership.findAll({
        order: [
          ['rank', 'ASC'],
          ['id', 'DESC'],
        ],
      });
      await setKey('memberships', memberships);
    }

    success(res, '查询大会员列表成功。', { memberships });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
