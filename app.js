const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');

require('dotenv').config();




// 路由
const routes = require('./config/routes');

// 启动定时任务
const initScheduleTasks = require('./tasks');
initScheduleTasks();

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(bodyParser.text({ type: '*/xml' }));
app.use(express.static(path.join(__dirname, 'public')));
// CORS 跨域配置
app.use(cors());

app.use(routes);

module.exports = app;
