/* ==========================================
   نظام المصادقة (التسجيل والدخول)
   ========================================== */

// المستخدم الحالي
let currentUser = null;
let currentUserData = null;

// ========== مراقبة حالة المصادقة ==========
supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event);
    
    if (session && session.user) {
        currentUser = session.user;
        await loadUserData();
        updateUIForLoggedInUser();
    } else {
        currentUser = null;
        currentUserData = null;
        updateUIForGuest();
    }
});

// ========== التحقق من المستخدم عند بدء التطبيق ==========
async function checkCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            console.log('No active session');
            return null;
        }
        
        if (user) {
            currentUser = user;
            await loadUserData();
            updateUIForLoggedInUser();
            return user;
        }
    } catch (error) {
        console.error('Error checking user:', error);
    }
    return null;
}

// ========== تحميل بيانات المستخدم ==========
async function loadUserData() {
    if (!currentUser) return;

    try {
        // محاولة جلب بيانات المستخدم من جدول users
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error loading user data:', error);
        }

        if (data) {
            currentUserData = data;
        } else {
            // إنشاء سجل جديد للمستخدم إذا لم يكن موجوداً
            currentUserData = {
                id: currentUser.id,
                email: currentUser.email,
                name: currentUser.user_metadata?.name || currentUser.email.split('@')[0]
            };
        }
    } catch (error) {
        console.error('Error in loadUserData:', error);
        currentUserData = {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.email.split('@')[0]
        };
    }
}

// ========== تحديث الواجهة للمستخدم المسجل ==========
function updateUIForLoggedInUser() {
    // إخفاء أزرار الضيف
    document.getElementById('guestNav').style.display = 'none';
    // إظهار قائمة المستخدم
    document.getElementById('userNav').style.display = 'flex';

    // تحديث معلومات المستخدم في الهيدر
    const email = currentUser?.email || '';
    const name = currentUserData?.name || email.split('@')[0];
    const initial = name.charAt(0).toUpperCase();

    document.getElementById('userInitial').textContent = initial;
    document.getElementById('headerUserName').textContent = name;
    document.getElementById('headerUserEmail').textContent = email;

    // تحديث زر البانر
    const heroBtn = document.getElementById('heroActionBtn');
    if (heroBtn) {
        heroBtn.innerHTML = '<i class="fas fa-upload"></i> رفع شرح';
        heroBtn.onclick = () => showSection('upload');
    }

    // تحديث صفحة الملف الشخصي
    updateProfilePage();
}

// ========== تحديث الواجهة للزائر ==========
function updateUIForGuest() {
    document.getElementById('guestNav').style.display = 'flex';
    document.getElementById('userNav').style.display = 'none';

    // إعادة زر البانر للوضع الافتراضي
    const heroBtn = document.getElementById('heroActionBtn');
    if (heroBtn) {
        heroBtn.innerHTML = '<i class="fas fa-rocket"></i> ابدأ الآن';
        heroBtn.onclick = () => showModal('register');
    }
}

// ========== إنشاء حساب جديد ==========
async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // التحقق من صحة البيانات
    if (name.length < 3) {
        showToast('الاسم يجب أن يكون 3 أحرف على الأقل', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showToast('كلمتا المرور غير متطابقتين', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }

    // تعطيل الزر أثناء التحميل
    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>';

    try {
        // إنشاء الحساب في Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name
                }
            }
        });

        if (error) throw error;

        // إغلاق النافذة
        hideModal('register');
        showToast('تم إنشاء الحساب بنجاح! مرحباً بك 🎉', 'success');

    } catch (error) {
        console.error('Register error:', error);
        showToast(getAuthErrorMessage(error.message), 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>إنشاء الحساب</span><i class="fas fa-arrow-left"></i>';
    }
}

// ========== تسجيل الدخول ==========
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // تعطيل الزر
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>';

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        hideModal('login');
        showToast('مرحباً بعودتك! 👋', 'success');

    } catch (error) {
        console.error('Login error:', error);
        showToast(getAuthErrorMessage(error.message), 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>تسجيل الدخول</span><i class="fas fa-arrow-left"></i>';
    }
}

// ========== تسجيل الخروج ==========
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        currentUser = null;
        currentUserData = null;
        
        showSection('home');
        hideUserDropdown();
        showToast('تم تسجيل الخروج بنجاح', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('حدث خطأ أثناء تسجيل الخروج', 'error');
    }
}

// ========== تحديث صفحة الملف الشخصي ==========
function updateProfilePage() {
    if (!currentUser) return;

    const email = currentUser.email || '';
    const name = currentUserData?.name || email.split('@')[0];
    const initial = name.charAt(0).toUpperCase();

    document.getElementById('profileInitial').textContent = initial;
    document.getElementById('profileName').textContent = name;
    document.getElementById('profileEmail').textContent = email;

    // تاريخ الانضمام
    if (currentUser.created_at) {
        const date = new Date(currentUser.created_at);
        document.getElementById('profileJoinDate').textContent =
            'انضم في: ' + date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
    }

    // تحميل فيديوهات المستخدم
    loadUserVideos();
}

// ========== رسائل الأخطاء ==========
function getAuthErrorMessage(message) {
    const messages = {
        'Invalid login credentials': 'بيانات الدخول غير صحيحة',
        'Email not confirmed': 'يرجى تأكيد بريدك الإلكتروني أولاً',
        'User already registered': 'البريد الإلكتروني مستخدم بالفعل',
        'Password should be at least 6 characters': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        'Invalid email': 'البريد الإلكتروني غير صالح',
        'Signup requires a valid password': 'يرجى إدخال كلمة مرور صالحة'
    };
    return messages[message] || message || 'حدث خطأ غير متوقع';
}

// ========== إظهار/إخفاء كلمة المرور ==========
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.parentElement.querySelector('.toggle-password i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// ========== قائمة المستخدم ==========
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('active');
}

function hideUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.remove('active');
    }
}

// إغلاق القائمة عند النقر خارجها
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
        hideUserDropdown();
    }
});

console.log('✅ Auth module loaded');