const express = require('express');
const router = express.Router();
const {Course, Category, Chapter, User} = require('../models');
const {success, failure} = require('../utils/responses');
const {NotFound, Forbidden} = require('http-errors');
const {setKey, getKey} = require('../utils/redis');

/**
 * 查询章节详情
 * GET /chapters/:id
 */
router.get('/:id', async function (req, res) {
  try {
    const {id} = req.params;

    // 查询章节
    let chapter = await getKey(`chapter:${id}`);
    if (!chapter) {
      chapter = await Chapter.findByPk(id, {
        attributes: {exclude: ['CourseId']},
      });
      if (!chapter) {
        throw new NotFound(`ID: ${id}的章节未找到。`);
      }
      await setKey(`chapter:${id}`, chapter);
    }
    // 检查用户是否能浏览当前章节
    await checkUserRole(req, chapter);

    // 查询章节关联的课程
    let course = await getKey(`course:${chapter.courseId}`);
    if (!course) {
      course = await Course.findByPk(chapter.courseId, {
        attributes: {exclude: ['CategoryId', 'UserId']},
      });
      await setKey(`course:${chapter.courseId}`, course);
    }

    // 查询课程关联的用户
    let user = await getKey(`user:${course.userId}`);
    if (!user) {
      user = await User.findByPk(course.userId, {
        attributes: {exclude: ['password']},
      });
      await setKey(`user:${course.userId}`, user);
    }

    // 查询同属一个课程的所有章节
    let chapters = await getKey(`chapters:${course.id}`);
    if (!chapters) {
      chapters = await Chapter.findAll({
        attributes: {exclude: ['CourseId', 'content']},
        where: {courseId: course.id},
        order: [['rank', 'ASC'], ['id', 'DESC']]
      });
      await setKey(`chapters:${course.id}`, chapters);
    }

    success(res, '查询章节成功。', {chapter, course, user, chapters});
  } catch (error) {
    failure(res, error);
  }
});


/**
 * 检查用户是否能浏览当前章节
 * @param req
 * @param chapter
 * @returns {Promise<void>}
 */
async function checkUserRole(req, chapter) {
  // 如果章节是免费的

  console.log(chapter.free, 'sajfksjdflk')
  if (chapter.free) {
    return;
  }

  // 检查用户是否有权限访收费章节
  const allowedRoles = [1, 100]; // 大会员和管理员的角色ID
  const user = await User.findByPk(req.userId);
  if (!allowedRoles.includes(user.role)) {
    throw new Forbidden('您没有权限浏览，请先购买大会员后再访问。');
  }
}


module.exports = router;
