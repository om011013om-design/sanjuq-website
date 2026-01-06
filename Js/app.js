/* ==========================================
   الملف الرئيسي للتطبيق
   ========================================== */

// ========== تهيئة التطبيق ==========
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 App starting...');

    // التحقق من المستخدم
    await checkCurrentUser();

    // تحميل الفيديوهات
    await loadVideos();

    // تحميل الإحصائيات
    await loadStats();

    // تهيئة التصنيفات
    initCategories();

    // التحقق من رابط الفيديو المباشر
    checkDirectVideoLink();

    console.log('✅ App initialized successfully');
});

// ========== التنقل بين الأقسام ==========
function showSection(sectionName) {
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // إظهار الصفحة المطلوبة
    const targetPage = document.getElementById(sectionName + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // تحميل البيانات حسب الصفحة
    switch (sectionName) {
        case 'home':
            loadVideos();
            break;
        case 'profile':
            if (!currentUser) {
                showModal('login');
                return;
            }
            updateProfilePage();
            break;
        case 'myVideos':
            if (!currentUser) {
                showModal('login');
                return;
            }
            loadUserVideos();
            break;
        case 'upload':
            if (!currentUser) {
                showModal('login');
                return;
            }
            resetUpload();
            break;
    }

    // إغلاق القوائم
    hideUserDropdown();
}

// ========== النوافذ المنبثقة ==========
function showModal(modalName) {
    const modal = document.getElementById(modalName + 'Modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalName) {
    const modal = document.getElementById(modalName + 'Modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function switchModal(from, to) {
    hideModal(from);
    setTimeout(() => showModal(to), 200);
}

// إغلاق النافذة عند النقر خارجها
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// إغلاق بـ Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
});

// ========== الإشعارات (Toast) ==========
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: 'check-circle',
        error: 'times-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };

    toast.innerHTML = `
        <i class="fas fa-${icons[type] || 'info-circle'}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // إزالة بعد 4 ثواني
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-100px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ========== التحميل الكامل ==========
function showLoader(text = 'جاري التحميل...') {
    document.getElementById('loaderText').textContent = text;
    document.getElementById('fullLoader').classList.add('active');
}

function hideLoader() {
    document.getElementById('fullLoader').classList.remove('active');
}

// ========== تهيئة التصنيفات ==========
function initCategories() {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            filterByCategory(category);
        });
    });
}

// ========== التحقق من رابط فيديو مباشر ==========
async function checkDirectVideoLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');

    if (videoId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.VIDEOS)
                .select('*')
                .eq('id', videoId)
                .single();

            if (data && !error) {
                watchVideo(data);
            } else {
                showToast('الفيديو غير موجود', 'error');
            }
        } catch (error) {
            console.error('Error loading video:', error);
        }
    }
}

// ========== قائمة الموبايل ==========
function toggleMobileMenu() {
    showToast('قائمة الموبايل قريباً', 'info');
}

console.log('✅ App module loaded');