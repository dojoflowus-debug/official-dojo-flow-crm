const sid = process.env.TWILIO_ACCOUNT_SID;
const auth = process.env.TWILIO_AUTH_TOKEN;
const msgSid = 'SM6899d5152323233289f6e1899542c189';

// Check message status
const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages/${msgSid}.json`, {
  headers: {
    Authorization: 'Basic ' + Buffer.from(`${sid}:${auth}`).toString('base64'),
  },
});
const data = await res.json();
console.log('Message status:', data.status);
console.log('To:', data.to);
console.log('From:', data.from);
console.log('Error code:', data.error_code);
console.log('Error message:', data.error_message);
console.log('Price:', data.price, data.price_unit);

// Also check account info
const accRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
  headers: {
    Authorization: 'Basic ' + Buffer.from(`${sid}:${auth}`).toString('base64'),
  },
});
const acc = await accRes.json();
console.log('\nAccount status:', acc.status);
console.log('Account type:', acc.type);
console.log('Account name:', acc.friendly_name);
