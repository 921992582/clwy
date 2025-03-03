const {AlipaySdk} = require('alipay-sdk');


const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APPID,
  privateKey: process.env.ALIPAY_APP_PRIVATE_KEY,
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
  // 增加沙箱网关地址
  gateway: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do',
});

module.exports = alipaySdk;
