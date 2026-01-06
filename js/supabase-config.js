/* ==========================================
   إعدادات Supabase - ملف الربط النهائي
   ========================================== */

// رابط المشروع الخاص بك
const SUPABASE_URL = 'https://ipxkjpwdbrlsswstmmtc.supabase.co';

// المفتاح النهائي الصحيح (Legacy Anon Key)
const SUPABASE_ANON_KEY = 'sb_secret_3hfNxY-ZTfI9GCJdo8lIwA_uSTf9K2f';

// تهيئة الاتصال بالسيرفر
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// أسماء الجداول المتوافقة مع قاعدة بياناتك
const TABLES = {
    VIDEOS: 'videos',
    USERS: 'users',
    LIKES: 'likes',
    REPORTS: 'reports'
};

// اسم مخزن الفيديوهات (Bucket)
const STORAGE_BUCKET = 'videos';

// أقصى حجم للفيديو (50 ميجابايت)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

console.log('✅ تم الربط بنجاح مع سيرفر شروحات سنجوق');

