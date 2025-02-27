const express = require('express');
const router = express.Router();
const {Chapter, Course} = require('../../models');
const {Op} = require('sequelize');
const {NotFound, BadRequest} = require('http-errors');
const {success, failure} = require('../../utils/responses');
const {delKey} = require('../../utils/redis');
/**
 * 查询章节列表
 * GET /admin/chapters
 */
router.get('/', async function (req, res) {
  try {
    const query = req.query;
    const currentPage = Math.abs(Number(query.currentPage)) || 1;
    const pageSize = Math.abs(Number(query.pageSize)) || 10;
    const offset = (currentPage - 1) * pageSize;

    if (!query.courseId) {
      throw new BadRequest('获取章节列表失败，课程ID不能为空。');
    }

    const condition = {
      ...getCondition(),
      where: {},
      order: [['rank', 'ASC'], ['id', 'ASC']],
      limit: pageSize,
      offset: offset
    };

    condition.where.courseId = query.courseId;

    if (query.title) {
      condition.where.title = {
        [Op.like]: `%${query.title}%`
      };
    }

    const {count, rows} = await Chapter.findAndCountAll(condition);
    success(res, '查询章节列表成功。', {
      chapters: rows,
      pagination: {
        total: count,
        currentPage,
        pageSize,
      }
    });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 查询章节详情
 * GET /admin/chapters/:id
 */
router.get('/:id', async function (req, res) {
  try {
    const chapter = await getChapter(req);
    success(res, '查询章节成功。', {chapter});
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 创建章节
 * POST /admin/chapters
 */
router.post('/', async function (req, res) {
  try {
    const body = filterBody(req);

    // 创建章节，并增加课程章节数
    const chapter = await Chapter.create(body);
    await Course.increment('chaptersCount', {where: {id: chapter.courseId}});
    await clearCache(chapter);
    success(res, '创建章节成功。', {chapter}, 201);
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 更新章节
 * PUT /admin/chapters/:id
 */
router.put('/:id', async function (req, res) {
  try {
    const chapter = await getChapter(req);
    const body = filterBody(req);

    await chapter.update(body);
    await clearCache(chapter);
    success(res, '更新章节成功。', {chapter});
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 删除章节
 * DELETE /admin/chapters/:id
 */
router.delete('/:id', async function (req, res) {
  try {
    const chapter = await getChapter(req);

    // 删除章节，并减少课程章节数
    await chapter.destroy();
    await Course.decrement('chaptersCount', {where: {id: chapter.courseId}});
    await clearCache(chapter);
    success(res, '删除章节成功。');
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 公共方法：关联课程数据
 * @returns {{include: [{as: string, model, attributes: string[]}], attributes: {exclude: string[]}}}
 */
function getCondition() {
  return {
    attributes: {exclude: ['CourseId']},
    include: [
      {
        model: Course,
        as: 'course',
        attributes: ['id', 'name']
      }
    ]
  }
}

/**
 * 公共方法：查询当前章节
 */
async function getChapter(req) {
  const {id} = req.params;
  const condition = getCondition();

  const chapter = await Chapter.findByPk(id, condition);
  if (!chapter) {
    throw new NotFound(`ID: ${id}的章节未找到。`)
  }

  return chapter;
}

/**
 * 公共方法：白名单过滤
 * @param req
 * @returns {{rank: (number|*), video: (string|boolean|MediaTrackConstraints|VideoConfiguration|*), title, courseId: (number|*), content}}
 */
function filterBody(req) {
  return {
    courseId: req.body.courseId,
    title: req.body.title,
    content: req.body.content,
    video: req.body.video,
    rank: req.body.rank,
    free: req.body.free
  };
}

/**
 * 清除缓存
 * @param chapter
 * @returns {Promise<void>}
 */
async function clearCache(chapter) {
  await delKey(`chapters:${chapter.courseId}`);
  await delKey(`chapter:${chapter.id}`);
}

module.exports = router;
