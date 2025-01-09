const express = require('express');
const router = express.Router();
const {Game, GameUser, GameGrade,} = require('../../models');
const {success, failure} = require('../../utils/responses');
// const {NotFound} = require('http-errors');


/**
 * 更新成绩
 * GET /articles
 */
router.post('/', async function (req, res) {
  // 参数：userId avatar, username,gameName,gameGrade

  try {
    // 先查询 用户是否存在
    const {userId, avatar, username, gameName, grade} = req.body

    const IsExistUser = await GameUser.findOne({
      where: {
        id: userId
      }
    })

    // 用户是否存在
    if (!IsExistUser) {
      // 添加用户
      await GameUser.create({id: userId, name: username, avatar: avatar})
    }

    const IsExistGame = await Game.findOne({
      where: {
        name: gameName
      }
    })


    let gameId
    if (!IsExistGame) {
      // 添加游戏
      const newInfo = await Game.create({name: gameName})
      gameId = newInfo.id
    } else {
      gameId = IsExistGame.id

    }

    // 获取满足当前条件的记录
    const oldGrade = await GameGrade.findOne({
      where: {
        gameId: gameId,
        userId,
      }
    })

    // 如果关联表数据为空
    if (!oldGrade) {
      await GameGrade.create({gameId, userId, grade})
      success(res, '添加数据成功')
    } else {
      // 对比成绩
      if (grade > oldGrade.grade) {
        //   更新

        await GameGrade.update({
          grade
        }, {
          where: {
            gameId: gameId,
            userId: userId
          }
        })
        success(res, '更新成功', grade)
      } else {
        success(res, '不是最大结果无需更新')
      }
    }


  } catch (error) {
    failure(res, error);
  }
});

router.get('/', async function (req, res) {
  // currentPage pageSize gameName
  try {
    const query = req.query;
    const currentPage = Math.abs(Number(query.currentPage)) || 1;
    const pageSize = Math.abs(Number(query.pageSize)) || 10;
    const offset = (currentPage - 1) * pageSize;


    const IsExistGame = await Game.findOne({
      where: {
        name: query.gameName
      }
    })
    const gameList = await GameGrade.findAll({
      where: {
        gameId: IsExistGame.id
      },
      attributes: ['grade'],
      order: [['grade', 'desc']],
      limit: pageSize,
      offset,
      include: [{
        model: Game, attributes: ['name']
      }, {
        model: GameUser, attributes: ['name', 'avatar']
      }]
    })

    const formattedRankList = gameList.map(item => ({
      username: item.GameUser.name,
      game: item.Game.name,
      grade: item.grade,
      avatar: item.GameUser.avatar
    }));
    success(res, '排行榜1', formattedRankList)


  } catch
    (error) {
    failure(res, error);

  }
})


module.exports = router;
