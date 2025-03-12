const tenpay = require('tenpay');

const config = {
  appid: process.env.WECHAT_APPID, // 小程序 appid
  mchid: process.env.WECHAT_MCH_ID, // 微信商户号
  partnerKey: process.env.WECHAT_MCH_KEY, // 微信支付安全密钥
  notify_url: process.env.WECHAT_NOTIFY_URL // 支付通知地址
};

// 调用 tenpay，生成微信 JSSDK 支付参数
const wechatSdk = new tenpay(config, true);

module.exports = wechatSdk;
