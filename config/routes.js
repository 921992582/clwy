const express = require('express');
const router = express.Router();

const adminAuth = require('../middlewares/admin-auth');
const userAuth = require('../middlewares/user-auth');


// 前台路由文件
const indexRouter = require('../routes/index');
const categoriesRouter = require('../routes/categories');
const coursesRouter = require('../routes/courses');
const chaptersRouter = require('../routes/chapters');
const articlesRouter = require('../routes/articles');
const settingsRouter = require('../routes/settings');
const searchRouter = require('../routes/search');
const authRouter = require('../routes/auth');
const usersRouter = require('../routes/users');
const likesRouter = require('../routes/likes');
const uploadsRouter = require('../routes/uploads');
const captchaRouter = require('../routes/captcha');
const membershipsRouter = require('../routes/memberships');
const ordersRouter = require('../routes/orders');
const alipayRouter = require('../routes/alipay');
// 后台路由文件
const adminArticlesRouter = require('../routes/admin/articles');
const adminCategoriesRouter = require('../routes/admin/categories');
const adminSettingsRouter = require('../routes/admin/settings');
const adminUsersRouter = require('../routes/admin/users');
const adminCoursesRouter = require('../routes/admin/courses');
const adminChaptersRouter = require('../routes/admin/chapters');
const adminChartsRouter = require('../routes/admin/charts');
const adminAttachmentsRouter = require('../routes/admin/attachments');
const adminAuthRouter = require('../routes/admin/auth');
const adminSettingRouter = require('../routes/admin/settings');
const adminLogsRouter = require('../routes/admin/logs');
const adminMembershipsRouter = require('../routes/admin/memberships');
const adminOrdersRouter = require('../routes/admin/orders');
// 游戏路由
const Game = require('../routes/game/grade');






// 前台路由配置
router.use('/', indexRouter);
router.use('/categories', categoriesRouter);
router.use('/courses', coursesRouter);
router.use('/chapters', userAuth, chaptersRouter);
router.use('/articles', articlesRouter);
router.use('/settings', settingsRouter);
router.use('/search', searchRouter);
router.use('/auth', authRouter);
router.use('/users', userAuth, usersRouter);
router.use('/likes', userAuth, likesRouter);
router.use('/uploads', userAuth, uploadsRouter);
router.use('/orders', userAuth, ordersRouter);
router.use('/memberships', membershipsRouter);
router.use('/alipay', alipayRouter);

router.use('/game', Game);

router.use('/captcha', captchaRouter);

// 后台路由配置
router.use('/admin/articles', adminAuth, adminArticlesRouter);
router.use('/admin/categories', adminAuth, adminCategoriesRouter);
router.use('/admin/settings', adminAuth, adminSettingsRouter);
router.use('/admin/users', adminAuth, adminUsersRouter);
router.use('/admin/courses', adminAuth, adminCoursesRouter);
router.use('/admin/chapters', adminAuth, adminChaptersRouter);
router.use('/admin/charts', adminAuth, adminChartsRouter);
router.use('/admin/attachments', adminAuth, adminAttachmentsRouter);
router.use('/admin/logs', adminAuth, adminLogsRouter);
router.use('/admin/memberships', adminAuth, adminMembershipsRouter);
router.use('/admin/orders', adminAuth, adminOrdersRouter);
router.use('/admin/auth', adminAuthRouter);
router.use('/admin/setting', adminSettingRouter);


module.exports = router;