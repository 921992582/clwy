const {sequelize} = require('../models');
const SSEHandler = require('../streams/sse-handler');

// 直接在 broadcast-service.js 中定义统计查询配置
const {getStatsQuery} = require('./stats-query');
// 存储不同类型的 SSE 处理程序
const sseHandlers = {};

async function broadcastStats(type) {
  try {
    if (!getStatsQuery([type])) {
      console.error(`Invalid stats type: ${type}`);
      return;
    }

    if (!sseHandlers[type]) {
      sseHandlers[type] = new SSEHandler();
    }

    const [results] = await sequelize.query(getStatsQuery([type]));
    const data = {
      months: results.map(item => item.month),
      values: results.map(item => item.value)
    };

    sseHandlers[type].broadcastData(data);
    console.log(`${type} stats broadcasted successfully`);
  } catch (error) {
    console.error(`Error broadcasting ${type} stats:`, error);
  }
}

function initSSEStream(type, res, req) {
  if (!getStatsQuery([type])) {
    console.error(`Invalid stats type: ${type}`);
    return;
  }
  if (!sseHandlers[type]) {
    sseHandlers[type] = new SSEHandler();
  }
  sseHandlers[type].initStream(res, req);

}
module.exports = {
  broadcastStats,
  initSSEStream
};