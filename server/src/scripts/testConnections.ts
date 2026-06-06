import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

dotenv.config();

async function testSMTP() {
  console.log('\n--- Testing SMTP ---');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful');
    console.log(`   Host: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
    console.log(`   User: ${process.env.SMTP_USER}`);
  } catch (error: any) {
    console.log('❌ SMTP connection failed:', error.message);
  }
}

async function testTwilio() {
  console.log('\n--- Testing Twilio ---');
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.log('❌ Twilio env vars missing');
    return;
  }

  try {
    const client = twilio(sid, token);
    const account = await client.api.accounts(sid).fetch();
    console.log('✅ Twilio connection successful');
    console.log(`   Account: ${account.friendlyName}`);
    console.log(`   Status:  ${account.status}`);
    console.log(`   From:    ${from}`);
  } catch (error: any) {
    console.log('❌ Twilio connection failed:', error.message);
  }
}

async function testRedis() {
  console.log('\n--- Testing Upstash Redis ---');
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/^"|"$/g, '');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.replace(/^"|"$/g, '');

  if (!url || !token) {
    console.log('❌ Redis env vars missing');
    return;
  }

  try {
    const res = await fetch(`${url}/ping`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json() as any;
    if (data.result === 'PONG') {
      console.log('✅ Upstash Redis connection successful');
      console.log(`   URL: ${url}`);
    } else {
      console.log('❌ Redis unexpected response:', data);
    }
  } catch (error: any) {
    console.log('❌ Redis connection failed:', error.message);
  }
}

(async () => {
  await testSMTP();
  await testTwilio();
  await testRedis();
  console.log('\nDone.\n');
})();
