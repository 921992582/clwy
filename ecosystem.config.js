module.exports = {
  apps: [
    {
      name: "express-app",
      script: "./bin/www",
      watch: true, // 开启文件监听
      interpreter: "node"
    },
    {
      name: "mail-consumer",
      script: "./utils/mail-consumer.js",
      interpreter: "node"
    }
  ]
};