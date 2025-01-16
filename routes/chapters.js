const express = require('express');
const router = express.Router();
const {Course, Category, Chapter, User} = require('../models');
const {success, failure} = require('../utils/responses');
const {NotFound} = require('http-errors');

/**
 * 查询章节详情
 * GET /chapters/:id
 */
router.get('/:id', async function (req, res) {
  try {
    const {id} = req.params;

    const chapter = await Chapter.findByPk(id, {
      attributes: {exclude: ['CourseId']}
    });
    if (!chapter) {
      throw new NotFound(`ID: ${id}的章节未找到。`)
    }

    // 查询章节关联的课程
    const course = await chapter.getCourse({
      attributes: ['id', 'name', 'userId'],
    });

    const [user, chapters] = await Promise.all([
      // 查询课程关联的用户
      course.getUser({
        attributes: ['id', 'username', 'nickname', 'avatar', 'company'],
      }),
      // 同属一个课程的所有章节
      Chapter.findAll({
        attributes: {exclude: ['CourseId', 'content']},
        where: {courseId: chapter.courseId},
        order: [['rank', 'ASC'], ['id', 'DESC']]
      })
    ]);

    success(res, '查询章节成功。', {chapter, course, user, chapters});
  } catch (error) {
    failure(res, error);
  }
});



module.exports = router;
