/* ==========================================
   نظام رفع الفيديوهات
   ========================================== */

let selectedVideoFile = null;

// ========== تهيئة منطقة الرفع ==========
document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('videoFileInput');

    if (!dropzone) return;

    // النقر لاختيار ملف
    dropzone.addEventListener('click', () => fileInput.click());

    // السحب والإفلات
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) {
            handleFileSelect(file);
        } else {
            showToast('الرجاء اختيار ملف فيديو صالح', 'error');
        }
    });

    // اختيار ملف
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFileSelect(file);
    });

    // عداد الأحرف
    const titleInput = document.getElementById('uploadTitle');
    const descInput = document.getElementById('uploadDescription');

    if (titleInput) {
        titleInput.addEventListener('input', (e) => {
            document.getElementById('titleCount').textContent = e.target.value.length;
        });
    }

    if (descInput) {
        descInput.addEventListener('input', (e) => {
            document.getElementById('descCount').textContent = e.target.value.length;
        });
    }

    // إرسال النموذج
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }
});

// ========== معالجة اختيار الملف ==========
function handleFileSelect(file) {
    // التحقق من الحجم
    if (file.size > MAX_FILE_SIZE) {
        showToast(`حجم الملف كبير جداً! الحد الأقصى ${MAX_FILE_SIZE / 1024 / 1024}MB`, 'error');
        return;
    }

    // التحقق من النوع
    if (!file.type.startsWith('video/')) {
        showToast('نوع الملف غير مدعوم', 'error');
        return;
    }

    selectedVideoFile = file;

    // إظهار المعاينة
    const previewVideo = document.getElementById('previewVideo');
    previewVideo.src = URL.createObjectURL(file);

    // إخفاء منطقة السحب وإظهار النموذج
    document.getElementById('uploadDropzone').style.display = 'none';
    document.getElementById('uploadForm').style.display = 'block';

    showToast('تم اختيار الفيديو بنجاح ✅', 'success');
}

// ========== رفع الفيديو ==========
async function handleUpload(e) {
    e.preventDefault();

    if (!currentUser) {
        showToast('يجب تسجيل الدخول أولاً', 'error');
        showModal('login');
        return;
    }

    if (!selectedVideoFile) {
        showToast('الرجاء اختيار فيديو', 'error');
        return;
    }

    const title = document.getElementById('uploadTitle').value.trim();
    const description = document.getElementById('uploadDescription').value.trim();
    const category = document.getElementById('uploadCategory').value;
    const protectDownload = document.getElementById('protectDownload')?.checked || false;
    const showWatermark = document.getElementById('showWatermark')?.checked || false;

    if (!title) {
        showToast('الرجاء إدخال عنوان الفيديو', 'error');
        return;
    }

    if (!category) {
        showToast('الرجاء اختيار تصنيف', 'error');
        return;
    }

    // إظهار شريط التقدم
    const btn = document.getElementById('publishBtn');
    btn.disabled = true;
    document.getElementById('uploadProgressSection').style.display = 'block';
    document.getElementById('uploadFileName').textContent = selectedVideoFile.name;

    try {
        // رفع الفيديو إلى Storage
        const fileName = `${Date.now()}_${selectedVideoFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

        showUploadStatus('جاري رفع الفيديو...');

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, selectedVideoFile, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw uploadError;

        // الحصول على الرابط العام
        const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(fileName);

        const videoUrl = urlData.publicUrl;

        document.getElementById('uploadProgressFill').style.width = '80%';
        document.getElementById('uploadPercent').textContent = '80%';
        showUploadStatus('جاري حفظ البيانات...');

        // حفظ البيانات في الجدول
        const { error: dbError } = await supabase
            .from(TABLES.VIDEOS)
            .insert({
                url: videoUrl,
                title: title,
                description: description,
                category: category,
                user_email: currentUser.email,
                user_id: currentUser.id,
                views: 0,
                likes: 0,
                protect_download: protectDownload,
                show_watermark: showWatermark
            });

        if (dbError) throw dbError;

        document.getElementById('uploadProgressFill').style.width = '100%';
        document.getElementById('uploadPercent').textContent = '100%';

        showToast('تم نشر الشرح بنجاح! 🎉', 'success');
        resetUpload();
        showSection('home');
        loadVideos();
        loadStats();

    } catch (error) {
        console.error('Upload error:', error);
        showToast('حدث خطأ أثناء الرفع: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

// ========== تحديث حالة الرفع ==========
function showUploadStatus(text) {
    document.getElementById('uploadStatus').textContent = text;
}

// ========== إعادة تعيين الرفع ==========
function resetUpload() {
    selectedVideoFile = null;

    document.getElementById('uploadDropzone').style.display = 'block';
    document.getElementById('uploadForm').style.display = 'none';
    document.getElementById('uploadProgressSection').style.display = 'none';
    document.getElementById('uploadProgressFill').style.width = '0%';
    document.getElementById('uploadPercent').textContent = '0%';

    document.getElementById('uploadTitle').value = '';
    document.getElementById('uploadDescription').value = '';
    document.getElementById('uploadCategory').value = '';
    document.getElementById('titleCount').textContent = '0';
    document.getElementById('descCount').textContent = '0';
    document.getElementById('previewVideo').src = '';
    document.getElementById('videoFileInput').value = '';

    if (document.getElementById('protectDownload')) {
        document.getElementById('protectDownload').checked = true;
    }
    if (document.getElementById('showWatermark')) {
        document.getElementById('showWatermark').checked = true;
    }
}

console.log('✅ Upload module loaded');