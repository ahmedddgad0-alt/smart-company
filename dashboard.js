import {
    initializeApp,
    getApps
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    documentId,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

import {
    firebaseConfig
} from "./firebase-config.js";

// =====================================
// 1. تهيئة Firebase
// =====================================

const app = getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

// =====================================
// 2. عناصر الصفحة
// =====================================

const userEmail = document.getElementById("userEmail");
const welcomeTitle = document.getElementById("welcomeTitle");

const logoutButton = document.getElementById("logoutButton");

const companyForm = document.getElementById("companyForm");
const companyNameInput = document.getElementById("companyName");
const companyActivityInput = document.getElementById("companyActivity");
const companyDescriptionInput =
    document.getElementById("companyDescription");

const createCompanyButton =
    document.getElementById("createCompanyButton");

const companyMessage = document.getElementById("companyMessage");
const companyList = document.getElementById("companyList");

// =====================================
// 3. حالة المستخدم
// =====================================

let currentUser = null;
let isCreatingCompany = false;
let authChecked = false;

function showMessage(message, type = "error") {
    companyMessage.textContent = message;
    companyMessage.className = `message ${type}`;
}

function getArabicError(error) {
    console.error("Smart Company error:", error);

    const messages = {
        "permission-denied":
            "تم رفض العملية بسبب قواعد الأمان. تأكد من نشر قواعد Firestore الصحيحة.",

        "unavailable":
            "الخدمة غير متاحة حاليًا. تحقق من الإنترنت وحاول مرة أخرى.",

        "network-request-failed":
            "تعذر الاتصال بالإنترنت. تحقق من اتصالك."
    };

    return messages[error.code] ||
        `حدث خطأ أثناء تنفيذ العملية. رمز الخطأ: ${error.code || "غير معروف"}`;
}

// =====================================
// 4. إنشاء بطاقة الشركة
// =====================================

// =====================================
// إنشاء بطاقة الشركة
// =====================================

function createCompanyCard(companyId, company, roleText) {
    const card = document.createElement("article");
    card.className = "company-card";

    const title = document.createElement("h3");
    title.textContent = company.name || "شركة بدون اسم";

    const activity = document.createElement("p");
    activity.textContent =
        `النشاط: ${company.activity || "غير محدد"}`;

    const description = document.createElement("p");
    description.textContent =
        company.description || "لا يوجد وصف للشركة.";

    const role = document.createElement("span");
    role.className = "role-badge";
    role.textContent = roleText;

    const enterButton = document.createElement("button");
    enterButton.type = "button";
    enterButton.textContent = "دخول الشركة ←";

    enterButton.style.cssText = `
        width: 100%;
        margin-top: 16px;
        padding: 12px;
        border: none;
        border-radius: 10px;
        background: #2563eb;
        color: white;
        font-size: 15px;
        font-weight: bold;
        cursor: pointer;
    `;

    enterButton.addEventListener("click", () => {
        window.location.href =
            `./company.html?id=${encodeURIComponent(companyId)}`;
    });

    card.append(
        title,
        activity,
        description,
        role,
        enterButton
    );

    return card;
}

// =====================================
// 5. تحميل الشركات المملوكة والمنضم إليها
// =====================================

// =====================================
// تحميل الشركات المملوكة والمنضم إليها
// =====================================

async function loadCompanies() {
    if (!currentUser) return;

    companyList.replaceChildren();

    const loading = document.createElement("p");
    loading.className = "loading";
    loading.textContent = "جارٍ تحميل الشركات...";
    companyList.appendChild(loading);

    try {
        const companiesMap = new Map();

        // 1. تحميل الشركات التي يملكها المستخدم
        const ownedQuery = query(
            collection(db, "companies"),
            where("ownerId", "==", currentUser.uid)
        );

        const ownedSnapshot = await getDocs(ownedQuery);

        ownedSnapshot.forEach((companyDocument) => {
            const company = companyDocument.data();

            companiesMap.set(companyDocument.id, {
                company,
                role:
                    company.generalManagerId === currentUser.uid
                        ? "المدير العام"
                        : "المالك"
            });
        });

        // 2. تحميل سجلات عضويات المستخدم
        const membershipsRef = collection(
            db,
            "users",
            currentUser.uid,
            "memberships"
        );

        const membershipsSnapshot = await getDocs(membershipsRef);

        // 3. جلب بيانات كل شركة انضم إليها المستخدم
        for (const membershipDocument of membershipsSnapshot.docs) {
            const membership = membershipDocument.data();
            const companyId = membership.companyId;

            if (!companyId || companiesMap.has(companyId)) {
                continue;
            }

            const companyRef = doc(db, "companies", companyId);
            const companySnapshot = await getDoc(companyRef);

            if (!companySnapshot.exists()) {
                continue;
            }

            companiesMap.set(companyId, {
                company: companySnapshot.data(),
                role: "موظف"
            });
        }

        companyList.replaceChildren();

        if (companiesMap.size === 0) {
            const empty = document.createElement("p");
            empty.className = "empty-state";
            empty.textContent =
                "لسه معندكش شركات. أنشئ شركتك الأولى أو انضم لشركة باستخدام دعوة.";

            companyList.appendChild(empty);
            return;
        }

        // 4. عرض الشركات
        companiesMap.forEach((item, companyId) => {
            const card = createCompanyCard(
                companyId,
                item.company,
                item.role
            );

            companyList.appendChild(card);
        });
        
} catch (error) {
    console.error("Load companies error:", {
        code: error.code,
        message: error.message,
        stack: error.stack
    });

    companyList.replaceChildren();

    const errorMessage = document.createElement("p");
    errorMessage.className = "message error";

    errorMessage.textContent =
        `خطأ: ${error.code || "غير معروف"} — ${error.message || "لا توجد تفاصيل"}`;

    companyList.appendChild(errorMessage);
}

}

// =====================================
// 6. إنشاء شركة
// =====================================

companyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
        showMessage("سجّل الدخول أولًا لإنشاء شركة.");
        return;
    }

    if (isCreatingCompany) return;

    const name = companyNameInput.value.trim();
    const activity = companyActivityInput.value.trim();
    const description = companyDescriptionInput.value.trim();

    if (name.length < 2 || name.length > 80) {
        showMessage("اسم الشركة يجب أن يكون بين حرفين و80 حرفًا.");
        return;
    }

    if (!activity || activity.length > 100) {
        showMessage("اكتب نشاط الشركة، بحد أقصى 100 حرف.");
        return;
    }

    if (description.length > 1000) {
        showMessage("وصف الشركة طويل جدًا.");
        return;
    }

    isCreatingCompany = true;
    createCompanyButton.disabled = true;
    createCompanyButton.textContent = "جارٍ إنشاء الشركة...";

    try {
        await addDoc(collection(db, "companies"), {
            name,
            activity,
            description,

            ownerId: currentUser.uid,
            generalManagerId: currentUser.uid,

            createdAt: serverTimestamp()
        });

        companyForm.reset();

        showMessage(
            "تم إنشاء شركتك بنجاح! أنت المدير العام للشركة.",
            "success"
        );

        await loadCompanies();

    } catch (error) {
        showMessage(getArabicError(error));

    } finally {
        isCreatingCompany = false;
        createCompanyButton.disabled = false;
        createCompanyButton.textContent = "+ إنشاء الشركة";
    }
});

// =====================================
// 7. تسجيل الخروج
// =====================================

logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;

    try {
        await signOut(auth);
        window.location.replace("./index.html");

    } catch (error) {
        showMessage(getArabicError(error));
        logoutButton.disabled = false;
    }
});

// =====================================
// 8. التحقق من تسجيل الدخول
// =====================================

onAuthStateChanged(auth, async (user) => {
    if (authChecked) return;
    authChecked = true;

    if (!user) {
        window.location.replace("./index.html");
        return;
    }

    currentUser = user;

    userEmail.textContent = user.email || "";

    welcomeTitle.textContent =
        `أهلًا ${user.displayName || "بك"} 👋`;

    await loadCompanies();
});

console.log("Smart Company dashboard initialized.");