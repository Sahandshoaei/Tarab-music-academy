// اسکریپت خروجی تصویری وایرفریم‌ها — اجرا: node shoot.js
// پیش‌نیاز: npm i playwright && npx playwright install --with-deps chromium
const { chromium } = require('playwright');
const fs = require('fs');

const path = require('path');
const BASE = 'file://' + path.join(__dirname, 'index.html');
const OUT = path.join(__dirname, 'png');

const desktop = [
  ['cover', '01-cover'],
  ['login', '02-login'],
  ['dashboard', '03-dashboard'],
  ['calendar', '04-calendar'],
  ['classes', '05-classes'],
  ['class-form', '06-class-form'],
  ['session', '07-session-attendance'],
  ['students', '08-students'],
  ['student-form', '09-student-form'],
  ['student-profile', '10-student-profile'],
  ['teachers', '11-teachers'],
  ['teacher-form', '12-teacher-form'],
  ['terms', '13-terms'],
  ['catalog', '14-instruments-rooms'],
  ['settings', '15-settings'],
  ['sms-compose', '16-sms-compose'],
  ['sms-templates', '17-sms-templates'],
  ['sms-history', '18-sms-history'],
];
const mobile = ['login', 'dashboard', 'calendar', 'session', 'students', 'student-profile', 'sms-compose'];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const errors = [];

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => errors.push(`[desktop ${page.url()}] ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[console] ${m.text()}`); });

  for (const [route, file] of desktop) {
    await page.goto(`${BASE}#/${route}`);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/${file}.png`, fullPage: true });
    console.log('✓', file);
  }

  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  m.on('pageerror', (e) => errors.push(`[mobile] ${e.message}`));
  for (const route of mobile) {
    await m.goto(`${BASE}#/${route}`);
    await m.waitForTimeout(300);
    await m.screenshot({ path: `${OUT}/mobile-${route}.png`, fullPage: true });
    console.log('✓ mobile-' + route);
  }

  await browser.close();
  if (errors.length) {
    console.log('JS ERRORS:'); errors.forEach((e) => console.log(' -', e));
    process.exitCode = 1;
  } else {
    console.log('NO JS ERRORS ✔');
  }
})();
