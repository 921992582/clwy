module.exports = {
  apps: [
    {
      name: "express-app",
      script: "./bin/www",
      watch: process.env.NODE_ENV === 'development', // 根据环境变量决定是否开启监听
      interpreter: "node",
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      }
    },
    {
      name: "mail-consumer",
      script: "./utils/mail-consumer.js",
      interpreter: "node",
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      }
    }
  ]
};