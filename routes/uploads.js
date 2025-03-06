const express = require('express');
const router = express.Router();
const { success, failure } = require('../utils/responses');
const { config, client, singleFileUpload, multipleFilesUpload } = require('../utils/aliyun');
const { BadRequest } = require('http-errors');
const { Attachment } = require('../models');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

/**
 * 阿里云 OSS 客户端上传
 * POST /uploads/aliyun
 */
router.post('/aliyun', function (req, res) {
  try {
    singleFileUpload(req, res, async function (error) {
      if (error) {
        return failure(res, error);
      }
      console.log(req.file, '<<><>');
      if (!req.file) {
        return failure(res, new BadRequest('请选择要上传的文件。'));
      }
      // 记录附件信息
      await Attachment.create({
        ...req.file,
        userId: req.userId,
        fullpath: req.file.path + '/' + req.file.filename,
      });

      success(res, '上传成功。', { file: req.file.url });
    });
  } catch (error) {
    failure(res, error);
  }
});

// 多文件上传
router.post('/aliyunMultiple', function (req, res) {
  try {
    multipleFilesUpload(req, res, async function (error) {
      if (error) {
        return failure(res, error);
      }

      if (req.files.length === 0) {
        return failure(res, new BadRequest('请选择要上传的文件。'));
      }
      // 记录附件信息
      req.files.map(async (item) => {
        await Attachment.create({
          ...item,
          userId: req.userId,
          fullpath: item.path + '/' + item.filename,
        });
      });

      success(res, '上传成功。', { files: req.files });
    });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 获取直传阿里云 OSS 授权信息
 * GET /uploads/aliyun_direct
 */
router.get('/aliyun_direct', async function (req, res, next) {
  // 有效期
  const date = moment().add(1, 'days');

  // 自定义上传目录及文件名
  const key = `uploads/${uuidv4()}`;

  // 上传安全策略
  const policy = {
    expiration: date.toISOString(), // 限制有效期
    conditions: [
      ['content-length-range', 0, 5 * 1024 * 1024], // 限制上传文件的大小为：5MB
      { bucket: client.options.bucket }, // 限制上传的 bucket
      ['eq', '$key', key], // 限制上传的文件名
      ['in', '$content-type', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']], // 限制文件类型
    ],
  };

  // 签名
  const formData = await client.calculatePostSignature(policy);

  // bucket 域名（阿里云上传地址）
  const host =
    `https://${config.bucket}.${(await client.getBucketLocation()).location}.aliyuncs.com`.toString();

  // 返回参数
  const params = {
    expire: date.format('YYYY-MM-DD HH:mm:ss'),
    policy: formData.policy,
    signature: formData.Signature,
    accessid: formData.OSSAccessKeyId,
    host,
    key,
    url: host + '/' + key,
  };

  success(res, '获取阿里云 OSS 授权信息成功。', params);
});

module.exports = router;
