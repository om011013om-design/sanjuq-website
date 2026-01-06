/* ==========================================
   إعدادات Supabase - ملف الربط النهائي
   ========================================== */

// رابط المشروع الخاص بك
const SUPABASE_URL = 'https://ipxkjpwdbrlsswstmmtc.supabase.co';

// المفتاح النهائي الصحيح (Legacy Anon Key)
const SUPABASE_ANON_KEY = 'EyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlweGtqcHdkYnJsc3N3c3RtbXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDk0MjQsImV4cCI6MjA4MzI4NTQyNH0.1kRmRl6DXxbCwLVcBCNuiboaPKzgpKHf-M5gEoszZr0';

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
