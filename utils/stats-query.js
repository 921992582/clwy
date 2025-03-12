const statsQueries = {
  order: "SELECT DATE_FORMAT(`createdAt`, '%Y-%m') AS `month`, COUNT(*) AS `value` FROM `Orders` GROUP BY `month` ORDER BY `month` ASC",
  user: "SELECT DATE_FORMAT(`createdAt`, '%Y-%m') AS `month`, COUNT(*) AS `value` FROM `Users` GROUP BY `month` ORDER BY `month` ASC",
  // 可以添加更多类型的统计查询
};

function getStatsQuery(type) {
  return statsQueries[type];
}

module.exports = {
  getStatsQuery
};