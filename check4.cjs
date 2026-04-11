const mysql = require('./node_modules/mysql2/promise');
require('./node_modules/dotenv').config();

mysql.createConnection(process.env.DATABASE_URL).then(async c => {
  const [u] = await c.execute("SELECT id, email, role FROM users WHERE email='demo@dojoflow.com' LIMIT 1");
  console.log('demo user:', JSON.stringify(u[0]));
  if (u[0]) {
    const [m] = await c.execute('SELECT organizationId FROM organization_users WHERE userId=? ORDER BY id', [u[0].id]);
    console.log('demo memberships:', JSON.stringify(m));
  }
  const [s] = await c.execute('SELECT organizationId, fluidpayApiKey FROM dojo_settings WHERE organizationId=1 LIMIT 1');
  console.log('org 1 settings:', s.length ? JSON.stringify({orgId: s[0].organizationId, hasKey: !!s[0].fluidpayApiKey}) : 'NOT FOUND');
  
  // Check how many users have openId set (SDK token users)
  const [owners] = await c.execute("SELECT id, email, role FROM users WHERE role='owner' LIMIT 10");
  console.log('Owner accounts:', JSON.stringify(owners.map(o => ({id: o.id, email: o.email}))));
  await c.end();
}).catch(e => console.error('Error:', e.message));
