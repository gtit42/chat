# ChatConnect - نشر على Vercel

## خطوات النشر على Vercel

### 1. إعداد المتغيرات البيئية
في لوحة تحكم Vercel، أضف المتغيرات التالية:

```
DATABASE_URL=your_neon_database_url
STRIPE_SECRET_KEY=your_stripe_secret_key  
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
REPL_ID=your_repl_id
NODE_ENV=production
```

### 2. إعداد قاعدة البيانات
- استخدم Neon PostgreSQL أو أي مزود PostgreSQL متوافق
- تأكد من أن قاعدة البيانات متاحة للوصول من Vercel

### 3. الرفع على GitHub
```bash
git init
git add .
git commit -m "Initial commit for Vercel deployment"
git remote add origin https://github.com/yourusername/chatconnect.git
git push -u origin main
```

### 4. ربط المشروع بـ Vercel
1. اذهب إلى vercel.com
2. اربط حساب GitHub الخاص بك
3. اختر المشروع
4. سيتم النشر تلقائياً

### 5. إعداد النطاق المخصص (اختياري)
- يمكنك ربط نطاق مخصص من إعدادات Vercel

## الميزات المتاحة بعد النشر

- ✅ دردشة فيديو مع 190+ دولة
- ✅ نظام الاشتراكات مع Stripe
- ✅ لوحة إدارة متقدمة
- ✅ نظام المطابقة الذكي
- ✅ حماية ونظام البلاغات

## ملاحظات مهمة

- تأكد من أن متغيرات البيئة صحيحة
- قاعدة البيانات يجب أن تكون متاحة للوصول العام
- Stripe يجب أن يكون في وضع الإنتاج للمدفوعات الحقيقية

## الدعم

إذا واجهت أي مشاكل، تحقق من:
1. سجلات Vercel (Vercel Dashboard > Functions)
2. متغيرات البيئة صحيحة
3. قاعدة البيانات متصلة بشكل صحيح