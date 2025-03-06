## 长乐未央 API

此项目为长乐未央公司开发的，专供学习`Node.js`的同学使用。项目使用了 Node.js + Express + MySQL + Sequelize ORM 开发。

项目课程地址：https://clwy.cn/courses/fullstack-node

让我们一起从零基础开始，学习接口开发。先从最基础的项目搭建、数据库的入门，再到完整的真实项目开发，一步步的和大家一起完成一个真实的项目。

## 配置环境变量

将`.env.example`文件拷贝为`.env`文件，并修改配置。

```txt
NODE_ENV=development
PORT=3000
SECRET=你的秘钥

ALIYUN_ACCESS_KEY_ID=阿里云的 AccessKey ID
ALIYUN_ACCESS_KEY_SECRET=阿里云的 AccessKey Secret
ALIYUN_BUCKET=阿里云 OSS 的 Bucket 名称
ALIYUN_REGION=阿里云 OSS Bucket 所在地域名称
```

- `NODE_ENV`配置为开发环境，如部署在生产环境可改为`production`。
- `PORT`配置为服务端口
- `SECRET`配置为秘钥。
- `ALIYUN`开头的配置，均为阿里云的配置。请注册阿里云云账号，创建存储空间，并创建`Access Key`。

```txt
MAILER_HOST=邮件服务器地址
MAILER_PORT=邮件服务器端口
MAILER_SECURE=465端口填写：true，否则填写：false
MAILER_USER=你的邮箱地址
MAILER_PASS=你的邮箱授权码或密码
```

- `MAILER`开头的配置，为邮件服务器的配置。
  RABBITMQ_URL=

- `RABBITMQ_URL`配置为消息队列服务器地址。

## 生成秘钥

在命令行中运行

```shell
node
```

进入交互模式后，运行

```shell
const crypto = require('crypto');
console.log(crypto.randomBytes(32).toString('hex'));
```

复制得到的秘钥，并填写到`.env`文件中的`SECRET`配置。

> PS：可以使用 `ctrl + c` 退出交互模式。

## 配置数据库

项目使用 Docker 容器运行 MySQL 数据库。安装好 Docker 后，可直接启动 MySQL。

```shell
docker-compose up -d
```

如需使用自行安装的 MySQL，需要修改`config/config.js`文件中的数据库用户名与密码。

```json
{
  "development": {
    "username": "您的数据库用户名",
    "password": "您的数据库密码"
  }
}
```

## 安装与运行

```shell
# 安装项目依赖包
npm i

# 创建数据库。如创建失败，可以手动建库。
npx sequelize-cli db:create --charset utf8mb4 --collate utf8mb4_general_ci

# 运行迁移，自动建表。
npx sequelize-cli db:migrate

# 运行种子，填充初始数据。
npx sequelize-cli db:seed:all

# 启动服务
npm start
```

访问地址：[http://localhost:3000](http://localhost:3000)，详情请看接口文档。

## 初始管理员账号

```txt
账号：admin
<<<<<<< HEAD
密码: 123123
=======
密码: 123456
>>>>>>> 294c4ec6399cef61d83b07d18a8f436ffe1deec3
```
