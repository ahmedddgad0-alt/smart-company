import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
// =====================================
// 1. تهيئة Firebase
// =====================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// =====================================
// 2. عناصر واجهة المستخدم
// =====================================

const authForm = document.getElementById("authForm");

const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");

const nameGroup = document.getElementById("nameGroup");
const confirmPasswordGroup =
    document.getElementById("confirmPasswordGroup");

const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput =
    document.getElementById("confirmPassword");

const submitButton = document.getElementById("submitButton");
const submitText = document.getElementById("submitText");

const switchModeButton = document.getElementById("switchMode");
const switchText = document.getElementById("switchText");

const authMessage = document.getElementById("authMessage");
const googleSignInButton =
    document.getElementById("googleSignInButton");

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
    prompt: "select_account"
});

// منع التحويل قبل اكتمال تجهيز بيانات مستخدم Google
let googleSignInInProgress = false;
// =====================================
// 3. حالة واجهة المصادقة
// =====================================

let isRegisterMode = false;
let isSubmitting = false;

// =====================================
// 4. عرض الرسائل
// =====================================

function showMessage(message, type = "error") {
    authMessage.textContent = message;
    authMessage.className = `message ${type}`;
}

function clearMessage() {
    authMessage.textContent = "";
    authMessage.className = "message hidden";
}

function setLoading(loading) {
    isSubmitting = loading;
    submitButton.disabled = loading;
    switchModeButton.disabled = loading;

    if (loading) {
        submitText.textContent = "جارٍ التنفيذ...";
    } else {
        submitText.textContent = isRegisterMode
            ? "إنشاء الحساب"
            : "تسجيل الدخول";
    }
}

// =====================================
// 5. ترجمة أخطاء Firebase
// =====================================

function getArabicError(error) {
    const code = error.code || "";

    const messages = {
        "auth/email-already-in-use":
            "هذا البريد الإلكتروني مسجل بالفعل. جرّب تسجيل الدخول.",

        "auth/invalid-email":
            "البريد الإلكتروني غير صحيح.",

        "auth/weak-password":
            "كلمة المرور ضعيفة. استخدم كلمة مرور أقوى.",

        "auth/invalid-credential":
            "البريد الإلكتروني أو كلمة المرور غير صحيحة.",

        "auth/user-not-found":
            "لا يوجد حساب بهذه البيانات.",

        "auth/wrong-password":
            "كلمة المرور غير صحيحة.",

        "auth/too-many-requests":
            "حدثت محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.",

        "auth/network-request-failed":
            "تعذر الاتصال بالإنترنت. تحقق من اتصالك وحاول مجددًا.",

        "auth/operation-not-allowed":
            "تسجيل الدخول بالبريد الإلكتروني غير مفعّل في Firebase.",

        "auth/invalid-api-key":
            "إعدادات Firebase غير صحيحة. راجع firebase-config.js.",

        "auth/configuration-not-found":
            "تحقق من إعدادات المصادقة في مشروع Firebase.",

        "auth/weak-password":
            "كلمة المرور لا تستوفي متطلبات الأمان."
    };

    return messages[code] ||
        `حدث خطأ أثناء تنفيذ العملية. رمز الخطأ: ${code || "غير معروف"}`;
}

// =====================================
// تسجيل الدخول باستخدام Google
// =====================================

if (googleSignInButton) {
    googleSignInButton.addEventListener("click", async () => {
        if (isSubmitting) return;

        clearMessage();

        isSubmitting = true;
        googleSignInInProgress = true;

        googleSignInButton.disabled = true;
        submitButton.disabled = true;
        switchModeButton.disabled = true;

        try {
            const result = await signInWithPopup(
                auth,
                googleProvider
            );

            const user = result.user;

            // التأكد من وجود بيانات المستخدم في Firestore
            const userRef = doc(db, "users", user.uid);
            const userSnapshot = await getDoc(userRef);

            if (!userSnapshot.exists()) {
                await setDoc(userRef, {
                    uid: user.uid,
                    name: user.displayName || "مستخدم جديد",
                    email: user.email || "",
                    createdAt: serverTimestamp()
                });
            }

            showMessage(
                "تم تسجيل الدخول باستخدام Google بنجاح!",
                "success"
            );

            googleSignInInProgress = false;

            // الانتقال بعد تجهيز البيانات
            window.location.replace("./dashboard.html");

        } catch (error) {
            console.error("Google sign-in error:", error);

            googleSignInInProgress = false;

            // إذا نجح تسجيل الدخول لكن فشل حفظ البيانات،
            // نترك المستخدم في الصفحة لعرض الخطأ.
            if (auth.currentUser) {
                try {
                    await signOut(auth);
                } catch (signOutError) {
                    console.error(
                        "Sign-out error:",
                        signOutError
                    );
                }
            }

            showMessage(getArabicError(error));

        } finally {
            isSubmitting = false;
            googleSignInButton.disabled = false;
            submitButton.disabled = false;
            switchModeButton.disabled = false;

            if (!auth.currentUser) {
                googleSignInInProgress = false;
            }
        }
    });
}

// =====================================
// 6. التبديل بين التسجيل وتسجيل الدخول
// =====================================

switchModeButton.addEventListener("click", () => {
    if (isSubmitting) return;

    isRegisterMode = !isRegisterMode;

    clearMessage();
    authForm.reset();

    nameGroup.classList.toggle("hidden", !isRegisterMode);

    confirmPasswordGroup.classList.toggle(
        "hidden",
        !isRegisterMode
    );

    fullNameInput.required = isRegisterMode;
    confirmPasswordInput.required = isRegisterMode;

    passwordInput.autocomplete = isRegisterMode
        ? "new-password"
        : "current-password";

    formTitle.textContent = isRegisterMode
        ? "أنشئ حسابك"
        : "أهلًا بعودتك";

    formSubtitle.textContent = isRegisterMode
        ? "ابدأ رحلتك في إدارة شركتك."
        : "سجّل الدخول للوصول إلى مساحة عملك.";

    switchText.textContent = isRegisterMode
        ? "لديك حساب بالفعل؟"
        : "ليس لديك حساب؟";

    switchModeButton.textContent = isRegisterMode
        ? "تسجيل الدخول"
        : "إنشاء حساب";

    setLoading(false);
});

// =====================================
// 7. إنشاء حساب أو تسجيل الدخول
// =====================================

authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    clearMessage();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showMessage("أدخل البريد الإلكتروني وكلمة المرور.");
        return;
    }

    if (isRegisterMode) {
        const fullName = fullNameInput.value.trim();
        const confirmPassword = confirmPasswordInput.value;

        if (!fullName) {
            showMessage("اكتب اسمك الكامل.");
            return;
        }

        if (password.length < 8) {
            showMessage("يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.");
            return;
        }

        if (password !== confirmPassword) {
            showMessage("كلمتا المرور غير متطابقتين.");
            return;
        }

        setLoading(true);

        try {
            const result = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            await updateProfile(result.user, {
                displayName: fullName
            });

            showMessage(
                "تم إنشاء حسابك بنجاح! سننتقل الآن إلى تجهيز مساحة عملك.",
                "success"
            );

        } catch (error) {
            console.error("Registration error:", error);
            showMessage(getArabicError(error));

        } finally {
            setLoading(false);
        }

    } else {
        setLoading(true);

        try {
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            showMessage(
                "تم تسجيل الدخول بنجاح!",
                "success"
            );

        } catch (error) {
            console.error("Login error:", error);
            showMessage(getArabicError(error));

        } finally {
            setLoading(false);
        }
    }
});

// =====================================
// 8. متابعة حالة تسجيل الدخول
// =====================================

onAuthStateChanged(auth, (user) => {
    if (user && !googleSignInInProgress) {
        window.location.replace("./dashboard.html");
    }
});

