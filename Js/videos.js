/* ==========================================
   نظام الفيديوهات
   ========================================== */

// الفيديو الحالي
let currentVideo = null;
let currentCategory = 'all';

// ========== تحميل الفيديوهات ==========
async function loadVideos(category = 'all') {
    const grid = document.getElementById('videosGrid');
    const loading = document.getElementById('loadingVideos');
    const noVideos = document.getElementById('noVideos');

    // إظهار التحميل
    grid.innerHTML = '';
    loading.style.display = 'block';
    noVideos.style.display = 'none';

    try {
        let query = supabase
            .from(TABLES.VIDEOS)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        // فلترة حسب التصنيف
        if (category !== 'all') {
            query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) throw error;

        loading.style.display = 'none';

        if (!data || data.length === 0) {
            noVideos.style.display = 'block';
            return;
        }

        data.forEach(video => {
            grid.appendChild(createVideoCard(video));
        });

    } catch (error) {
        console.error('Error loading videos:', error);
        loading.style.display = 'none';
        grid.innerHTML = `
            <div class="no-videos">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>حدث خطأ</h3>
                <p>لم نتمكن من تحميل الفيديوهات. حاول مرة أخرى.</p>
                <button class="btn btn-primary" onclick="loadVideos()">
                    <i class="fas fa-redo"></i> إعادة المحاولة
                </button>
            </div>
        `;
    }
}

// ========== إنشاء بطاقة فيديو ==========
function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.onclick = () => watchVideo(video);

    const email = video.user_email || 'مستخدم';
    const initial = email.charAt(0).toUpperCase();

    card.innerHTML = `
        <div class="video-thumbnail">
            <video src="${video.url}" preload="metadata" muted></video>
            <span class="video-duration">${video.duration || '00:00'}</span>
        </div>
        <div class="video-card-info">
            <h3 class="video-card-title">${escapeHtml(video.title || 'بدون عنوان')}</h3>
            <div class="video-card-meta">
                <div class="video-card-avatar">${initial}</div>
                <span>${email.split('@')[0]}</span>
            </div>
            <div class="video-card-stats">
                <span><i class="fas fa-eye"></i> ${formatNumber(video.views || 0)}</span>
                <span><i class="fas fa-heart"></i> ${formatNumber(video.likes || 0)}</span>
                <span><i class="fas fa-clock"></i> ${formatTimeAgo(video.created_at)}</span>
            </div>
        </div>
    `;

    return card;
}

// ========== مشاهدة فيديو ==========
async function watchVideo(video) {
    currentVideo = video;
    showSection('watch');

    // تحديث معلومات الفيديو
    document.getElementById('watchTitle').textContent = video.title || 'بدون عنوان';
    document.getElementById('watchViews').textContent = formatNumber(video.views || 0);
    document.getElementById('watchDate').textContent = formatTimeAgo(video.created_at);
    document.getElementById('watchLikes').textContent = formatNumber(video.likes || 0);
    document.getElementById('watchDescription').textContent = video.description || 'لا يوجد وصف';

    const email = video.user_email || 'مستخدم';
    const initial = email.charAt(0).toUpperCase();
    document.getElementById('uploaderName').textContent = email.split('@')[0];
    document.getElementById('uploaderAvatar').textContent = initial;

    // تحميل الفيديو
    const player = document.getElementById('mainPlayer');
    player.src = video.url;

    // العلامة المائية
    if (video.show_watermark && currentUser) {
        document.getElementById('videoWatermark').textContent =
            `شروحات سنجوق - ${currentUser.email}`;
    } else {
        document.getElementById('videoWatermark').textContent = '';
    }

    // تحديث عدد المشاهدات
    try {
        await supabase
            .from(TABLES.VIDEOS)
            .update({ views: (video.views || 0) + 1 })
            .eq('id', video.id);
    } catch (error) {
        console.error('Error updating views:', error);
    }

    // التحقق من الإعجاب
    checkIfLiked();
}

// ========== الإعجاب ==========
async function toggleLike() {
    if (!currentUser) {
        showToast('يجب تسجيل الدخول للإعجاب', 'warning');
        showModal('login');
        return;
    }

    if (!currentVideo) return;

    const likeBtn = document.getElementById('likeBtn');

    try {
        // التحقق من وجود إعجاب سابق
        const { data: existingLike } = await supabase
            .from('likes')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('video_id', currentVideo.id)
            .single();

        if (existingLike) {
            // إلغاء الإعجاب
            await supabase
                .from('likes')
                .delete()
                .eq('id', existingLike.id);

            await supabase
                .from(TABLES.VIDEOS)
                .update({ likes: Math.max(0, (currentVideo.likes || 1) - 1) })
                .eq('id', currentVideo.id);

            likeBtn.classList.remove('liked');
            likeBtn.querySelector('i').className = 'far fa-heart';
            currentVideo.likes = Math.max(0, (currentVideo.likes || 1) - 1);
        } else {
            // إضافة إعجاب
            await supabase
                .from('likes')
                .insert({
                    user_id: currentUser.id,
                    video_id: currentVideo.id
                });

            await supabase
                .from(TABLES.VIDEOS)
                .update({ likes: (currentVideo.likes || 0) + 1 })
                .eq('id', currentVideo.id);

            likeBtn.classList.add('liked');
            likeBtn.querySelector('i').className = 'fas fa-heart';
            currentVideo.likes = (currentVideo.likes || 0) + 1;
        }

        document.getElementById('watchLikes').textContent = formatNumber(currentVideo.likes);

    } catch (error) {
        console.error('Error toggling like:', error);
        showToast('حدث خطأ. حاول مرة أخرى.', 'error');
    }
}

// ========== التحقق من الإعجاب ==========
async function checkIfLiked() {
    if (!currentUser || !currentVideo) return;

    const likeBtn = document.getElementById('likeBtn');

    try {
        const { data } = await supabase
            .from('likes')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('video_id', currentVideo.id)
            .single();

        if (data) {
            likeBtn.classList.add('liked');
            likeBtn.querySelector('i').className = 'fas fa-heart';
        } else {
            likeBtn.classList.remove('liked');
            likeBtn.querySelector('i').className = 'far fa-heart';
        }
    } catch (error) {
        // No like found
        likeBtn.classList.remove('liked');
        likeBtn.querySelector('i').className = 'far fa-heart';
    }
}

// ========== مشاركة الفيديو ==========
function shareVideo() {
    if (!currentVideo) return;

    const url = window.location.origin + '?v=' + currentVideo.id;

    if (navigator.share) {
        navigator.share({
            title: currentVideo.title,
            text: 'شاهد هذا الشرح على شروحات سنجوق',
            url: url
        });
    } else {
        navigator.clipboard.writeText(url);
        showToast('تم نسخ الرابط! 📋', 'success');
    }
}

// ========== الإبلاغ عن فيديو ==========
async function reportVideo() {
    if (!currentUser) {
        showToast('يجب تسجيل الدخول للإبلاغ', 'warning');
        showModal('login');
        return;
    }

    if (!currentVideo) return;

    const reason = prompt('ما سبب الإبلاغ؟');
    if (!reason) return;

    try {
        await supabase
            .from('reports')
            .insert({
                video_id: currentVideo.id,
                reporter_id: currentUser.id,
                reason: reason
            });

        showToast('تم إرسال البلاغ. شكراً لك! 🙏', 'success');
    } catch (error) {
        console.error('Error reporting video:', error);
        showToast('حدث خطأ. حاول مرة أخرى.', 'error');
    }
}

// ========== تحميل فيديوهات المستخدم ==========
async function loadUserVideos() {
    if (!currentUser) return;

    const grid = document.getElementById('profileVideosGrid') || document.getElementById('myVideosGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="loading-videos"><div class="spinner"></div><p>جاري التحميل...</p></div>';

    try {
        const { data, error } = await supabase
            .from(TABLES.VIDEOS)
            .select('*')
            .eq('user_email', currentUser.email)
            .order('created_at', { ascending: false });

        if (error) throw error;

        grid.innerHTML = '';

        if (!data || data.length === 0) {
            grid.innerHTML = `
                <div class="no-videos" style="grid-column: 1/-1;">
                    <i class="fas fa-video-slash"></i>
                    <h3>لا توجد فيديوهات</h3>
                    <p>لم ترفع أي شرح بعد</p>
                    <button class="btn btn-primary" onclick="showSection('upload')">
                        <i class="fas fa-upload"></i> رفع شرح
                    </button>
                </div>
            `;
            return;
        }

        // تحديث الإحصائيات
        let totalViews = 0;
        let totalLikes = 0;
        data.forEach(v => {
            totalViews += v.views || 0;
            totalLikes += v.likes || 0;
        });

        const videosCount = document.getElementById('profileVideosCount');
        const viewsCount = document.getElementById('profileViewsCount');
        const likesCount = document.getElementById('profileLikesCount');

        if (videosCount) videosCount.textContent = data.length;
        if (viewsCount) viewsCount.textContent = formatNumber(totalViews);
        if (likesCount) likesCount.textContent = formatNumber(totalLikes);

        data.forEach(video => {
            const card = createVideoCard(video);
            
            // إضافة زر الحذف
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger delete-video-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteVideo(video);
            };
            card.querySelector('.video-thumbnail').appendChild(deleteBtn);
            
            grid.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading user videos:', error);
        grid.innerHTML = '<p style="text-align:center;color:#888;grid-column:1/-1;">حدث خطأ في التحميل</p>';
    }
}

// ========== حذف فيديو ==========
async function deleteVideo(video) {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;

    showLoader('جاري الحذف...');

    try {
        // حذف من الجدول
        const { error: dbError } = await supabase
            .from(TABLES.VIDEOS)
            .delete()
            .eq('id', video.id);

        if (dbError) throw dbError;

        // محاولة حذف الملف من Storage
        if (video.url) {
            const fileName = video.url.split('/').pop();
            await supabase.storage
                .from(STORAGE_BUCKET)
                .remove([fileName]);
        }

        showToast('تم حذف الفيديو بنجاح', 'success');
        loadUserVideos();
        loadVideos();

    } catch (error) {
        console.error('Error deleting video:', error);
        showToast('حدث خطأ أثناء الحذف', 'error');
    } finally {
        hideLoader();
    }
}

// ========== البحث ==========
async function searchVideos(event) {
    if (event && event.key && event.key !== 'Enter') return;

    const query = document.getElementById('searchInput').value.trim().toLowerCase();

    if (query.length < 2) {
        loadVideos(currentCategory);
        return;
    }

    const grid = document.getElementById('videosGrid');
    const loading = document.getElementById('loadingVideos');

    grid.innerHTML = '';
    loading.style.display = 'block';

    try {
        const { data, error } = await supabase
            .from(TABLES.VIDEOS)
            .select('*')
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        loading.style.display = 'none';

        if (!data || data.length === 0) {
            grid.innerHTML = `
                <div class="no-videos" style="grid-column: 1/-1;">
                    <i class="fas fa-search"></i>
                    <h3>لا توجد نتائج</h3>
                    <p>لم نجد شروحات تطابق "${escapeHtml(query)}"</p>
                </div>
            `;
            return;
        }

        data.forEach(video => {
            grid.appendChild(createVideoCard(video));
        });

    } catch (error) {
        console.error('Error searching:', error);
        loading.style.display = 'none';
    }
}

// ========== فلترة التصنيفات ==========
function filterByCategory(category) {
    currentCategory = category;

    // تحديث الأزرار
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });

    loadVideos(category);
}

// ========== تحميل الإحصائيات ==========
async function loadStats() {
    try {
        // عدد الفيديوهات
        const { count: videosCount } = await supabase
            .from(TABLES.VIDEOS)
            .select('*', { count: 'exact', head: true });

        document.getElementById('totalVideosCount').textContent = videosCount || 0;

        // عدد المستخدمين (من الفيديوهات)
        const { data: videos } = await supabase
            .from(TABLES.VIDEOS)
            .select('user_email');

        const uniqueUsers = new Set(videos?.map(v => v.user_email) || []);
        document.getElementById('totalUsersCount').textContent = uniqueUsers.size;

        // إجمالي المشاهدات
        const { data: viewsData } = await supabase
            .from(TABLES.VIDEOS)
            .select('views');

        let totalViews = 0;
        viewsData?.forEach(v => totalViews += v.views || 0);
        document.getElementById('totalViewsCount').textContent = formatNumber(totalViews);

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ========== دوال مساعدة ==========
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatTimeAgo(timestamp) {
    if (!timestamp) return 'الآن';

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    if (years > 0) return `منذ ${years} سنة`;
    if (months > 0) return `منذ ${months} شهر`;
    if (days > 0) return `منذ ${days} يوم`;
    if (hours > 0) return `منذ ${hours} ساعة`;
    if (minutes > 0) return `منذ ${minutes} دقيقة`;
    return 'الآن';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

console.log('✅ Videos module loaded');