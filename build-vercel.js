#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 بناء المشروع لـ Vercel...');

// إنشاء مجلد البناء
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// نسخ ملفات الخادم
console.log('📦 نسخ ملفات الخادم...');
execSync('cp -r server dist/', { stdio: 'inherit' });
execSync('cp -r shared dist/', { stdio: 'inherit' });

// نسخ package.json للجذر
console.log('📋 إعداد package.json...');
if (fs.existsSync('package.json.vercel')) {
  execSync('cp package.json.vercel package.json', { stdio: 'inherit' });
}

// بناء العميل
console.log('🎨 بناء واجهة المستخدم...');
try {
  execSync('cd client && npm install && npm run build', { stdio: 'inherit' });
  console.log('✅ تم بناء العميل بنجاح');
} catch (error) {
  console.error('❌ فشل في بناء العميل:', error.message);
  process.exit(1);
}

// بناء الخادم
console.log('⚙️ بناء الخادم...');
try {
  execSync('cd server && npm install && npm run build', { stdio: 'inherit' });
  console.log('✅ تم بناء الخادم بنجاح');
} catch (error) {
  console.error('❌ فشل في بناء الخادم:', error.message);
  process.exit(1);
}

console.log('🎉 تم بناء المشروع بنجاح! جاهز للنشر على Vercel');