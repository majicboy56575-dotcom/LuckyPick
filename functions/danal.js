const crypto = require('crypto');
const querystring = require('querystring');
const iconv = require('iconv-lite');

// Danal Credit Card & EasyPay (KakaoPay, NaverPay, SamsungPay) Config
const DANAL_CARD_CONFIG = {
  CPID: process.env.DANAL_CARD_CPID || '9810030929',
  ENC_KEY: process.env.DANAL_CARD_ENC_KEY || '20ad459ab1ad2f6e541929d50d24765abb05850094a9629041bebb726814625d',
  ENC_IV: 'd7d02c92cb930b661f107cb92690fc83',
  TX_URL: 'https://tx-creditcard.danalpay.com/credit/'
};

// Danal Phone Micro-payment Config
const DANAL_PHONE_CONFIG = {
  CPID: process.env.DANAL_PHONE_CPID || 'A010002002',
  PWD: process.env.DANAL_PHONE_PWD || 'bbbbb',
  ITEM_CODE: '1270000000',
  START_URL: 'https://ui.teledit.com/Danal/Teledit/Web/Start.php'
};

const encryptDanal = (key, iv, text) => {
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(key, 'hex'),
    Buffer.from(iv, 'hex')
  );
  const encrypted = cipher.update(text);
  return Buffer.concat([encrypted, cipher.final()]).toString('base64');
};

const decryptDanal = (key, iv, text) => {
  const encryptedText = Buffer.from(text, 'base64');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(key, 'hex'),
    Buffer.from(iv, 'hex')
  );
  const decrypted = decipher.update(encryptedText);
  return Buffer.concat([decrypted, decipher.final()]).toString();
};

const createTxRequestParam = (config, params) => {
  const baseData = iconv.encode(
    Object.keys(params).map((key) => `${key}=${params[key]}`).join('&'),
    'euc-kr'
  );
  const encryptData = encryptDanal(config.ENC_KEY, config.ENC_IV, baseData);
  const requestData = {
    CPID: config.CPID,
    DATA: encryptData
  };
  return querystring.stringify(requestData);
};

const sendTx = async (config, params) => {
  const res = await fetch(config.TX_URL, {
    method: 'POST',
    headers: {
      'Content-type': 'application/x-www-form-urlencoded; charset=euc-kr'
    },
    body: createTxRequestParam(config, params)
  });

  const text = await res.text();
  let resData = querystring.parse(text);
  if ('DATA' in resData) {
    const decrypted = decryptDanal(config.ENC_KEY, config.ENC_IV, resData['DATA']);
    resData = querystring.parse(decrypted);
  }
  return resData;
};

/**
 * 1. Danal Credit Card / EasyPay (KakaoPay, etc.) Ready API
 */
async function readyDanalCardPayment({
  amount,
  itemName,
  orderId,
  userId,
  userEmail,
  returnUrl,
  cancelUrl
}) {
  const params = {
    SUBCPID: '',
    AMOUNT: Number(amount),
    CURRENCY: '410',
    ITEMNAME: itemName || '럭키픽 상품',
    USERAGENT: 'PC',
    ORDERID: orderId,
    OFFERPERIOD: '',
    USERNAME: userId || 'LuckyPick고객',
    USERID: userId || 'USERID',
    USEREMAIL: userEmail || '',
    CANCELURL: cancelUrl,
    RETURNURL: returnUrl,
    TXTYPE: 'AUTH',
    SERVICETYPE: 'DANALCARD',
    ISNOTI: 'N'
  };

  const result = await sendTx(DANAL_CARD_CONFIG, params);
  return result;
}

/**
 * 2. Danal Credit Card / EasyPay Confirm API
 */
async function confirmDanalCardPayment({ returnParams, amount }) {
  const decrypted = decryptDanal(
    DANAL_CARD_CONFIG.ENC_KEY,
    DANAL_CARD_CONFIG.ENC_IV,
    returnParams
  );
  const cpCgiData = querystring.parse(decrypted);

  if (cpCgiData['RETURNCODE'] === '0000') {
    const billResult = await sendTx(DANAL_CARD_CONFIG, {
      AMOUNT: Number(amount),
      TID: cpCgiData['TID'],
      TXTYPE: 'BILL',
      SERVICETYPE: 'DANALCARD'
    });
    return billResult;
  } else {
    return cpCgiData;
  }
}

/**
 * 3. Danal Phone Micro-payment Ready Parameters
 */
function readyDanalPhonePayment({ amount, itemName, orderId, returnUrl, cancelUrl }) {
  const itemAmt = String(amount);
  const itemInfo = `${DANAL_PHONE_CONFIG.ITEM_CODE[0]}|${itemAmt}|1|${DANAL_PHONE_CONFIG.ITEM_CODE}|${itemName || '럭키픽 상품'}`;
  
  return {
    startUrl: DANAL_PHONE_CONFIG.START_URL,
    params: {
      Command: 'ITEMSEND2',
      SERVICE: 'TELEDIT',
      ID: DANAL_PHONE_CONFIG.CPID,
      PWD: DANAL_PHONE_CONFIG.PWD,
      CPName: '럭키픽',
      ItemInfo: itemInfo,
      ItemName: itemName || '럭키픽 상품',
      ItemAmt: itemAmt,
      TargetURL: returnUrl,
      BackURL: cancelUrl,
      IsPreOtbill: 'N',
      IsSubscript: 'N'
    }
  };
}

module.exports = {
  DANAL_CARD_CONFIG,
  DANAL_PHONE_CONFIG,
  readyDanalCardPayment,
  confirmDanalCardPayment,
  readyDanalPhonePayment
};
