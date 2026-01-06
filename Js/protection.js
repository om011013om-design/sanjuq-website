/* ==========================================
   نظام حماية الفيديوهات
   ========================================== */

// ========== تهيئة الحماية ==========
document.addEventListener('DOMContentLoaded', initProtection);

function initProtection() {
    // منع النقر اليمين على الفيديو
    preventRightClick();
    
    // منع اختصارات لوحة المفاتيح
    preventKeyboardShortcuts();
    
    // مراقبة تغيير النافذة
    monitorVisibility();
    
    // منع الطباعة
    preventPrinting();
    
    // منع السحب
    preventDrag();
    
    console.log('🛡️ Protection initialized');
}

// ========== منع النقر اليمين ==========
function preventRightClick() {
    document.addEventListener('contextmenu', (e) => {
        if (e.target.tagName === 'VIDEO' || e.target.closest('.protected-video-container')) {
            e.preventDefault();
            showToast('القائمة المختصرة غير متاحة', 'warning');
            return false;
        }
    });
}

// ========== منع اختصارات لوحة المفاتيح ==========
function preventKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // منع Print Screen
        if (e.key === 'PrintScreen') {
            e.preventDefault();
            
            // محاولة مسح الحافظة
            try {
                navigator.clipboard.writeText('');
            } catch (err) {}
            
            blurVideo();
            showToast('لقطات الشاشة غير مسموحة! 🚫', 'error');
            
            setTimeout(unblurVideo, 2000);
            return false;
        }

        // منع Ctrl + S (حفظ)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            showToast('الحفظ غير مسموح!', 'warning');
            return false;
        }

        // منع Ctrl + P (طباعة)
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            showToast('الطباعة غير مسموحة!', 'warning');
            return false;
        }

        // منع Ctrl + Shift + I (Developer Tools)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            return false;
        }

        // منع F12 (Developer Tools)
        if (e.key === 'F12') {
            e.preventDefault();
            return false;
        }

        // منع Ctrl + U (View Source)
        if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
            e.preventDefault();
            return false;
        }

        // منع Ctrl + Shift + C (Inspect Element)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            return false;
        }

        // منع Ctrl + Shift + J (Console)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
            e.preventDefault();
            return false;
        }
    });
}

// ========== مراقبة تغيير النافذة ==========
function monitorVisibility() {
    // عند إخفاء الصفحة
    document.addEventListener('visibilitychange', () => {
        const video = document.getElementById('mainPlayer');
        if (!video) return;

        if (document.hidden) {
            // إيقاف الفيديو مؤقتاً
            if (!video.paused) {
                video.pause();
                video.dataset.wasPlaying = 'true';
            }
            blurVideo();
        } else {
            // إعادة التشغيل
            if (video.dataset.wasPlaying === 'true') {
                video.play().catch(() => {});
                video.dataset.wasPlaying = 'false';
            }
            unblurVideo();
        }
    });

    // عند فقدان التركيز
    window.addEventListener('blur', () => {
        blurVideo();
    });

    // عند استعادة التركيز
    window.addEventListener('focus', () => {
        unblurVideo();
    });
}

// ========== تشويش الفيديو ==========
function blurVideo() {
    const container = document.getElementById('videoContainer');
    if (container) {
        container.style.filter = 'blur(30px)';
        container.style.transition = 'filter 0.3s ease';
    }
}

function unblurVideo() {
    const container = document.getElementById('videoContainer');
    if (container) {
        container.style.filter = 'none';
    }
}

// ========== منع الطباعة ==========
function preventPrinting() {
    window.addEventListener('beforeprint', () => {
        document.body.style.display = 'none';
    });

    window.addEventListener('afterprint', () => {
        document.body.style.display = 'block';
    });
}

// ========== منع السحب ==========
function preventDrag() {
    document.addEventListener('dragstart', (e) => {
        if (e.target.tagName === 'VIDEO' || e.target.tagName === 'IMG') {
            e.preventDefault();
            return false;
        }
    });
}

// ========== كشف أدوات المطورين ==========
let devToolsOpen = false;

function detectDevTools() {
    const threshold = 160;

    const check = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;

        if (widthThreshold || heightThreshold) {
            if (!devToolsOpen) {
                devToolsOpen = true;
                blurVideo();
            }
        } else {
            if (devToolsOpen) {
                devToolsOpen = false;
                unblurVideo();
            }
        }
    };

    setInterval(check, 1000);
}

// تفعيل كشف أدوات المطورين
detectDevTools();

// ========== حماية إضافية للفيديو ==========
function setupVideoProtection(videoElement) {
    if (!videoElement) return;

    // منع التحميل
    videoElement.controlsList = 'nodownload';

    // منع Picture-in-Picture
    videoElement.disablePictureInPicture = true;

    // منع النقر اليمين
    videoElement.oncontextmenu = () => false;

    // إضافة حماية CSS
    videoElement.style.pointerEvents = 'auto';
    
    if (videoElement.parentElement) {
        videoElement.parentElement.style.cssText += `
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        `;
    }
}

// ========== تطبيق الحماية على الفيديو الرئيسي ==========
document.addEventListener('DOMContentLoaded', () => {
    const mainPlayer = document.getElementById('mainPlayer');
    if (mainPlayer) {
        setupVideoProtection(mainPlayer);
    }
});

// مراقبة إضافة فيديوهات جديدة
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.tagName === 'VIDEO') {
                setupVideoProtection(node);
            }
            // البحث في العناصر الفرعية
            if (node.querySelectorAll) {
                node.querySelectorAll('video').forEach(video => {
                    setupVideoProtection(video);
                });
            }
        });
    });
});

observer.observe(document.body, { childList: true, subtree: true });

// ========== منع نسخ النص ==========
document.addEventListener('copy', (e) => {
    const selection = window.getSelection().toString();
    if (selection.includes('شروحات سنجوق')) {
        e.preventDefault();
    }
});

// ========== حماية من التسجيل (محاولة) ==========
function detectScreenRecording() {
    // محاولة كشف تسجيل الشاشة عبر MediaDevices API
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            const hasScreenCapture = devices.some(device =>
                device.kind === 'videoinput' &&
                device.label.toLowerCase().includes('screen')
            );
            
            if (hasScreenCapture) {
                const video = document.getElementById('mainPlayer');
                if (video) {
                    video.pause();
                    blurVideo();
                }
                showToast('تم اكتشاف محاولة تسجيل!', 'error');
            }
        }).catch(() => {});
    }
}

// فحص دوري
setInterval(detectScreenRecording, 5000);

console.log('✅ Protection module loaded');