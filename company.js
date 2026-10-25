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
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";



import {
    getFirestore,
    doc,
    getDoc,
    collection,
    setDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    addDoc,
    onSnapshot,
    orderBy,
updateDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";




const app = getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig);

    const storage = getStorage(app);

const auth = getAuth(app);
async function testLockerAuthentication() {
const user = auth.currentUser;

if (!user) {
    console.log("Smart Company: سجّل الدخول أولًا للاختبار.");
    return;
}

try {
    const idToken = await user.getIdToken();

    const response = await fetch(
        "https://small-art-9cfc.gjkgfdryhhh.workers.dev/auth-check",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`
            },
            body: JSON.stringify({})
        }
    );

    const result = await response.json();

    console.log("Locker authentication test:", {
        status: response.status,
        success: result.success === true,
        authenticated: result.authenticated === true,
        message: result.message || null
    });
} catch (error) {
    console.error("Locker authentication test failed:", error.message);
}


}

window.testLockerAuthentication = testLockerAuthentication;

async function testLockerAccess(companyId, roomId) {
    const user = auth.currentUser;

    if (!user) {
        console.log("اختبار الخزانة: سجّل الدخول أولًا.");
        return;
    }

    try {
        const idToken = await user.getIdToken();

        const response = await fetch(
            `${LOCKER_WORKER_URL}/locker-access-check`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    companyId,
                    roomId
                })
            }
        );

        const result = await response.json();

        console.log("نتيجة اختبار صلاحيات الخزانة:", {
            status: response.status,
            success: result.success === true,
            authorized: result.authorized === true,
            message: result.message || null
        });
    } catch (error) {
        console.error(
            "فشل اختبار صلاحيات الخزانة:",
            error.message
        );
    }
}

window.testLockerAccess = testLockerAccess;


async function testLockerKVRoundtrip() {
    const user = auth.currentUser;

    if (!user) {
        console.log("يجب تسجيل الدخول أولًا.");
        return;
    }

    try {
        const idToken = await user.getIdToken();

        const response = await fetch(
            `${LOCKER_WORKER_URL}/test-kv-roundtrip`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({})
            }
        );

        const result = await response.json();

        console.log("نتيجة اختبار KV:", {
            status: response.status,
            ...result
        });
    } catch (error) {
        console.error(
            "فشل اختبار KV:",
            error.message
        );
    }
}

window.testLockerKVRoundtrip = testLockerKVRoundtrip;

async function testLockerShareCreate() {
    const user = auth.currentUser;

    if (!user) {
        console.log("يجب تسجيل الدخول أولًا.");
        return;
    }

    const companyId = "N7qH63LWLlSRqrRFW23v";
    const roomId = "hSRXa8vthQWIR0DI7iQDlzuLSZ03";

    // كلمة مرور تجريبية فقط، لا تستخدمها لحسابك الشخصي.
    const testPassword = "TestShare-2026!";

    try {
        const idToken = await user.getIdToken();

        const response = await fetch(
            `${LOCKER_WORKER_URL}/locker-share-create`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    companyId,
                    roomId,
                    sharePassword: testPassword,
                    durationMinutes: 60
                })
            }
        );

        const result = await response.json();

        console.log("نتيجة اختبار إنشاء المشاركة:", {
            status: response.status,
            success: result.success === true,
            shareId: result.shareId || null,
            expiresAt: result.expiresAt || null,
            message: result.message || null
        });
    } catch (error) {
        console.error(
            "فشل اختبار إنشاء المشاركة:",
            error.message
        );
    }
}

window.testLockerShareCreate = testLockerShareCreate;


async function testLockerShareVerify() {
    const user = auth.currentUser;

    if (!user) {
        console.log("يجب تسجيل الدخول أولًا.");
        return;
    }

   const shareIdInput = prompt("أدخل Share ID الخاص بسجل الاختبار:");
if (!shareIdInput) return;

const shareId = shareIdInput.trim();

if (!/^[0-9a-f-]{36}$/i.test(shareId)) {
    console.error("معرّف المشاركة غير صالح. استخدم Share ID كاملًا.");
    return;
} 

    const sharePassword = prompt("أدخل كلمة مرور الاختبار:");
    if (!sharePassword) return;

    try {
        const idToken = await user.getIdToken();

        const response = await fetch(
            `${LOCKER_WORKER_URL}/locker-share-verify`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    shareId,
                    sharePassword
                })
            }
        );

        const result = await response.json();

        console.log("نتيجة اختبار التحقق:", {
            httpStatus: response.status,
            success: result.success === true,
            passwordVerified: result.passwordVerified === true,
            filesAvailable: result.filesAvailable === true,
            status: result.status || null,
            message: result.message || null
        });
    } catch (error) {
        console.error("فشل اختبار التحقق:", error.message);
    }
}

window.testLockerShareVerify = testLockerShareVerify;

window.testLockerShareFiles = async function () {
    try {
        const shareId = prompt("أدخل Share ID:");
        if (!shareId) return;

        const sharePassword = prompt("أدخل كلمة مرور المشاركة:");
        if (!sharePassword) return;

        if (!auth.currentUser) {
            alert("سجّل الدخول إلى حسابك أولًا.");
            return;
        }

        const idToken = await auth.currentUser.getIdToken();

        console.log("🔐 جاري طلب الملفات المشفرة...");

        const response = await fetch(
            `${LOCKER_WORKER_URL}/locker-share-files`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    shareId: shareId.trim(),
                    sharePassword
                })
            }
        );

        const result = await response.json();

        console.log("📦 نتيجة استرجاع المشاركة:", {
            httpStatus: response.status,
            success: result.success,
            passwordVerified: result.passwordVerified,
            filesAvailable: result.filesAvailable,
            fileCount: Array.isArray(result.files)
                ? result.files.length
                : 0,
            message: result.message
        });

        if (!response.ok || !result.success) {
            alert("فشل استرجاع الملفات. راجع نتيجة الطلب في Console.");
            return;
        }

        if (!result.passwordVerified) {
            alert("لم يتم التحقق من كلمة مرور المشاركة.");
            return;
        }

        if (!Array.isArray(result.files) || result.files.length === 0) {
            alert("تم التحقق من كلمة المرور، لكن لا توجد ملفات متاحة.");
            return;
        }

        const decryptedFiles = [];

        for (const file of result.files) {
            if (typeof file.encryptedData !== "string") {
                throw new Error("بيانات الملف المشفّر غير صالحة.");
            }

            // فك ترميز حزمة التشفير، وليس الملف الأصلي
            const packageBytes = Uint8Array.from(
                atob(file.encryptedData),
                char => char.charCodeAt(0)
            );

            const encryptionPackage = JSON.parse(
                new TextDecoder().decode(packageBytes)
            );

            if (
                encryptionPackage.algorithm !== "AES-GCM" ||
                encryptionPackage.keyDerivation !== "PBKDF2-SHA256" ||
                encryptionPackage.iterations !== 100000
            ) {
                throw new Error("إعدادات التشفير غير متوقعة.");
            }

            const decodeBase64 = value =>
                Uint8Array.from(
                    atob(value),
                    char => char.charCodeAt(0)
                );

            const salt = decodeBase64(encryptionPackage.salt);
            const iv = decodeBase64(encryptionPackage.iv);
            const ciphertext = decodeBase64(
                encryptionPackage.ciphertext
            );

            // اشتقاق مفتاح فك التشفير داخل المتصفح
            const passwordKey = await crypto.subtle.importKey(
                "raw",
                new TextEncoder().encode(sharePassword),
                "PBKDF2",
                false,
                ["deriveKey"]
            );

            const aesKey = await crypto.subtle.deriveKey(
                {
                    name: "PBKDF2",
                    salt,
                    iterations: 100000,
                    hash: "SHA-256"
                },
                passwordKey,
                {
                    name: "AES-GCM",
                    length: 256
                },
                false,
                ["decrypt"]
            );

            const plaintextBuffer = await crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv
                },
                aesKey,
                ciphertext
            );

            const plaintext = new TextDecoder().decode(
                plaintextBuffer
            );

            decryptedFiles.push({
                fileId: file.fileId,
                fileName: file.fileName,
                mimeType: file.mimeType,
                plaintext
            });
        }

        // نعرض نتيجة الاختبار محليًا فقط
        console.log("✅ تم فك التشفير داخل المتصفح:", decryptedFiles);

        alert(
            `نجح الاختبار! تم استرجاع وفك تشفير ${decryptedFiles.length} ملف.`
        );

    } catch (error) {
        console.error("❌ فشل استرجاع أو فك تشفير الملفات:", error);

        alert(
            "فشل الاختبار. افتح Console واقرأ رسالة الخطأ."
        );
    }
};

async function testLockerEncryptedSave() {
    const user = auth.currentUser;

    if (!user) {
        console.error("يجب تسجيل الدخول أولًا.");
        return;
    }

    const shareIdInput = prompt(
        "أدخل Share ID لسجل مشاركة جديد:"
    );

    if (!shareIdInput) return;

    const shareId = shareIdInput.trim();

    if (!/^[0-9a-f-]{36}$/i.test(shareId)) {
        console.error("Share ID غير صالح.");
        return;
    }

    const password = prompt(
        "أدخل كلمة مرور سجل المشاركة:"
    );

    if (!password) return;

    // نص تجريبي فقط، وليس ملفًا حقيقيًا.
    const testText =
        "Smart Company encrypted sharing test.";

    try {
        const encoder = new TextEncoder();

        // إنشاء Salt و IV عشوائيين.
        const salt = crypto.getRandomValues(
            new Uint8Array(16)
        );

        const iv = crypto.getRandomValues(
            new Uint8Array(12)
        );

        // اشتقاق مفتاح من كلمة مرور المشاركة.
        const passwordKey = await crypto.subtle.importKey(
            "raw",
            encoder.encode(password),
            "PBKDF2",
            false,
            ["deriveKey"]
        );

        const encryptionKey = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            passwordKey,
            {
                name: "AES-GCM",
                length: 256
            },
            false,
            ["encrypt"]
        );

        // التشفير يحدث داخل المتصفح.
        const encryptedBytes = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv
            },
            encryptionKey,
            encoder.encode(testText)
        );

        function toBase64(bytes) {
            let binary = "";

            for (const byte of bytes) {
                binary += String.fromCharCode(byte);
            }

            return btoa(binary);
        }

        // تخزين معلومات فك التشفير داخل حزمة مشفرة النقل.
        // كلمة المرور نفسها لا تُرسل.
        const encryptedPackage = {
            version: 1,
            algorithm: "AES-GCM",
            keyDerivation: "PBKDF2-SHA256",
            iterations: 100000,
            salt: toBase64(salt),
            iv: toBase64(iv),
            ciphertext: toBase64(
                new Uint8Array(encryptedBytes)
            )
        };

        const encryptedData = toBase64(
            encoder.encode(
                JSON.stringify(encryptedPackage)
            )
        );

        // إرسال البيانات المشفرة فقط.
        const idToken = await user.getIdToken();

        const response = await fetch(
            `${LOCKER_WORKER_URL}/locker-share-file-save`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    shareId,
                    fileId: crypto.randomUUID(),
                    fileName: "encrypted-test.txt",
                    mimeType: "text/plain",
                    encryptedData
                })
            }
        );

        const result = await response.json();

        console.log("نتيجة اختبار الحفظ المشفر:", {
            httpStatus: response.status,
            success: result.success === true,
            fileId: result.fileId || null,
            message: result.message || null,
            plaintextSent: false,
            encryption: "AES-GCM"
        });
    } catch (error) {
        console.error(
            "فشل اختبار الحفظ المشفر:",
            error.message
        );
    }
}

async function shareOfficeLockerFiles({
    companyId,
    roomId,
    roomKey,
    fileIds
}) {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("يجب تسجيل الدخول أولًا.");
    }

    if (lockerOwnerUid !== user.uid) {
        throw new Error("مشاركة الملفات متاحة لصاحب الخزنة فقط.");
    }

    // تحميل أعضاء الشركة لاختيار الموظف المستلم.
    const membersRef = collection(
        db,
        "companies",
        companyId,
        "members"
    );

   
    let membersSnapshot;

try {
    membersSnapshot = await getDocs(membersRef);
} catch (error) {
    console.error("Employee list permission error:", error.code, error.message);
    throw new Error(
        "تعذر تحميل موظفي الشركة. تحقق من صلاحيات قراءة أعضاء الشركة في Firestore."
    );
}
    const employees = [];

  membersSnapshot.forEach((memberDocument) => {
const member = memberDocument.data();


// استبعاد المستخدم الحالي فقط، والسماح بجميع الأدوار الأخرى.
if (memberDocument.id === user.uid) {
    return;
}

employees.push({
    uid: memberDocument.id,
    name:
        member.name ||
        member.email ||
        memberDocument.id,
    role: member.role || "employee"
});


});

console.log("👥 Employees loaded:", employees);
console.log("👥 Members snapshot size:", membersSnapshot.size);
console.log("👤 Current user ID:", user.uid);

    if (employees.length === 0) {
        throw new Error("لا يوجد موظفون متاحون للاختيار في هذه الشركة.");
    }

    const employeeList = employees
        .map((employee, index) =>
            `${index + 1}. ${employee.name}`
        )
        .join("\n");

    const employeeChoice = prompt(
        "اكتب رقم الموظف الذي تريد مشاركة الملفات معه:\n\n" +
        employeeList
    );

    if (employeeChoice === null) {
        return;
    }

    const employeeIndex = Number(employeeChoice) - 1;

    if (
        !Number.isInteger(employeeIndex) ||
        employeeIndex < 0 ||
        employeeIndex >= employees.length
    ) {
        throw new Error("اختيار الموظف غير صحيح.");
    }

    const recipientUid = employees[employeeIndex].uid;
    if (
    typeof recipientUid !== "string" ||
    !recipientUid.trim() ||
    recipientUid === user.uid
) {
    throw new Error("يرجى اختيار موظف آخر لاستلام الملفات.");
}


    if (!Array.isArray(fileIds) || fileIds.length === 0) {
        throw new Error("لم يتم تحديد أي ملفات.");
    }

    if (fileIds.length > 10) {
        throw new Error("الحد الأقصى للمشاركة الواحدة هو 10 ملفات.");
    }

    const password = prompt(
        "أنشئ كلمة مرور للمشاركة (10 أحرف على الأقل):"
    );

    if (password === null) return;

    if (password.length < 10 || password.length > 128) {
        throw new Error("كلمة المرور يجب أن تكون بين 10 و128 حرفًا.");
    }

    const durationInput = prompt(
        "مدة صلاحية المشاركة بالدقائق (من 5 إلى 10080):",
        "60"
    );

    if (durationInput === null) return;

    const durationMinutes = Number(durationInput);

    if (
        !Number.isInteger(durationMinutes) ||
        durationMinutes < 5 ||
        durationMinutes > 10080
    ) {
        throw new Error("المدة يجب أن تكون بين 5 دقائق و7 أيام.");
    }

    const database = await openOfficeLockerDB();

    let files;

    try {
        const transaction = database.transaction(
            ["files"],
            "readonly"
        );

        const store = transaction.objectStore("files");

        files = await Promise.all(
            fileIds.map(id => new Promise((resolve, reject) => {
                const request = store.get(id);

                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error);
            }))
        );
    } finally {
        database.close();
    }

    if (files.some(file => !file)) {
        throw new Error("تعذرت قراءة أحد الملفات المحددة.");
    }

    // التأكد من أن كل ملف يتبع الخزنة الحالية.
    for (const file of files) {
        if (
            file.roomKey !== roomKey ||
            file.companyId !== companyId ||
            file.roomId !== roomId
        ) {
            throw new Error(
                `الملف "${file.name}" لا يتبع الخزنة الحالية.`
            );
        }

        if (!(file.blob instanceof Blob)) {
            throw new Error(
                `محتوى الملف "${file.name}" غير صالح.`
            );
        }
    }

    const encoder = new TextEncoder();

    function toBase64(bytes) {
        let binary = "";
        const chunkSize = 0x8000;

        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(
                i,
                Math.min(i + chunkSize, bytes.length)
            );

            binary += String.fromCharCode(...chunk);
        }

        return btoa(binary);
    }

    const preparedFiles = [];

    // تشفير جميع الملفات داخل المتصفح قبل إنشاء المشاركة.
    for (const file of files) {
        const salt = crypto.getRandomValues(
            new Uint8Array(16)
        );

        const iv = crypto.getRandomValues(
            new Uint8Array(12)
        );

        const passwordKey = await crypto.subtle.importKey(
            "raw",
            encoder.encode(password),
            "PBKDF2",
            false,
            ["deriveKey"]
        );

        const encryptionKey = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            passwordKey,
            {
                name: "AES-GCM",
                length: 256
            },
            false,
            ["encrypt"]
        );

        const plaintextBytes = await file.blob.arrayBuffer();

        const encryptedBytes = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv
            },
            encryptionKey,
            plaintextBytes
        );

        const encryptedPackage = {
            version: 1,
            algorithm: "AES-GCM",
            keyDerivation: "PBKDF2-SHA256",
            iterations: 100000,
            salt: toBase64(salt),
            iv: toBase64(iv),
            ciphertext: toBase64(
                new Uint8Array(encryptedBytes)
            )
        };

        const encryptedData = toBase64(
            encoder.encode(JSON.stringify(encryptedPackage))
        );

        // مسار الحفظ الحالي يقبل حتى مليون حرف تقريبًا.
        if (encryptedData.length > 1000000) {
            throw new Error(
                `الملف "${file.name}" أكبر من الحد التجريبي المسموح به.`
            );
        }

        preparedFiles.push({
            fileId: file.id,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            encryptedData
        });
    }

    const idToken = await user.getIdToken();

    // إنشاء سجل المشاركة.
    const createResponse = await fetch(
        `${LOCKER_WORKER_URL}/locker-share-create`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`
            },
body: JSON.stringify({
    companyId,
    roomId,
    recipientUid,
    sharePassword: password,
    durationMinutes
})
        }
    );

    const createResult = await createResponse.json();

    if (!createResponse.ok || createResult.success !== true) {
        throw new Error(
            createResult.message || "تعذر إنشاء المشاركة."
        );
    }

    const shareId = createResult.shareId;

    if (!shareId) {
        throw new Error("لم يُرجع الخادم معرّف المشاركة.");
    }

    // رفع النسخ المشفرة فقط.
    let savedCount = 0;

    for (const file of preparedFiles) {
        const saveResponse = await fetch(
            `${LOCKER_WORKER_URL}/locker-share-file-save`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    shareId,
                    fileId: file.fileId,
                    fileName: file.fileName,
                    mimeType: file.mimeType,
                    encryptedData: file.encryptedData
                })
            }
        );

        const saveResult = await saveResponse.json();

        if (!saveResponse.ok || saveResult.success !== true) {
            throw new Error(
                `فشل رفع الملف "${file.fileName}". ` +
                `معرّف المشاركة: ${shareId}. ` +
                (saveResult.message || "")
            );
        }

        savedCount++;
    }

    return {
        shareId,
        expiresAt: createResult.expiresAt,
        savedCount
    };
}

window.testLockerEncryptedSave = testLockerEncryptedSave;

async function testLockerOwnerCheck(companyId, roomId) {
const user = auth.currentUser;


if (!user) {
    console.log("اختبار الملكية: سجّل الدخول أولًا.");
    return;
}

try {
    const idToken = await user.getIdToken();

    const response = await fetch(
        `${LOCKER_WORKER_URL}/locker-owner-check`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`
            },
            body: JSON.stringify({
                companyId,
                roomId
            })
        }
    );

    const result = await response.json();

    console.log("نتيجة اختبار ملكية الخزانة:", {
        status: response.status,
        success: result.success === true,
        owner: result.owner === true,
        message: result.message || null
    });
} catch (error) {
    console.error(
        "فشل اختبار ملكية الخزانة:",
        error.message
    );
}


}

window.testLockerOwnerCheck = testLockerOwnerCheck;


window.getLockerTestUser = () => {
    const user = auth.currentUser;

    return user
        ? { uid: user.uid, email: user.email }
        : null;
};

const LOCKER_WORKER_URL =
    "https://small-art-9cfc.gjkgfdryhhh.workers.dev";
const db = getFirestore(app);

const companyNameElement = document.getElementById("companyName");
const content = document.getElementById("content");
const backButton = document.getElementById("backButton");
const navigation = document.getElementById("navigation");
const managementNavButton = document.getElementById(
    "managementNavButton"
);

const companyId = new URLSearchParams(window.location.search).get("id");

let currentCompany = null;

const sections = {
    overview: {
        title: "الرئيسية",
        icon: "🏠",
        description: "تابع المعلومات الأساسية لشركتك من مكان واحد."
    },
    employees: {
        title: "الموظفون",
        icon: "👥",
        description: "إدارة الموظفين ودعوة أعضاء جدد إلى الشركة."
    },
    departments: {
        title: "الأقسام",
        icon: "🏢",
        description: "تنظيم الشركة إلى أقسام وتحديد مسؤوليات كل قسم."
    },
    projects: {
        title: "المشاريع",
        icon: "📁",
        description: "إنشاء المشاريع وتنظيم العمل والفرق المسؤولة عنها."
    },
   tasks: {
title: currentCompany?.userRole === "owner" ? "المهام" : "مهامي",
icon: "✅",
description: currentCompany?.userRole === "owner"
? "توزيع المهام ومتابعة حالة تنفيذها."
: "عرض المهام المسندة إليك ومتابعة تقدمك في تنفيذها."
},
    "qa-center": {
        title: "QA Center",
        icon: "🧪",
        description: "تحليل مستقل لتغطية المتطلبات وحالات الاختبار وبيانات الجودة."
    },
  
    files: {
        title: "الملفات",
        icon: "📄",
        description: "مساحة لتنظيم ملفات الشركة ومستنداتها."
    },


    settings: {
        title: "الإعدادات",
        icon: "⚙️",
        description: "إعدادات الشركة وإدارة صلاحيات الوصول."
    }
};

function showError(message) {
    content.replaceChildren();

    const error = document.createElement("p");
    error.className = "message error";
    error.textContent = message;

    content.appendChild(error);
}

function showOverview() {
    content.replaceChildren();

    const welcome = document.createElement("section");
    welcome.className = "welcome";

    const title = document.createElement("h2");
    title.textContent = `أهلًا بك في ${currentCompany.name} 👋`;

    const description = document.createElement("p");
    description.textContent =
        currentCompany.description || "ابدأ بتنظيم العمل وإدارة شركتك.";

    const activity = document.createElement("p");
    activity.textContent = `نشاط الشركة: ${currentCompany.activity}`;

    const role = document.createElement("p");
    role.textContent = currentCompany.userRole === "owner"
    ? "صلاحيتك الحالية: المدير العام 👑"
    : "صلاحيتك الحالية: موظف 👨‍💻";
    welcome.append(title, description, activity, role);

    const sectionTitle = document.createElement("h2");
    sectionTitle.className = "section-title";
    sectionTitle.textContent = "إدارة الشركة";

    const grid = document.createElement("div");
    grid.className = "grid";

Object.entries(sections)
    .filter(([key]) => {
        // إخفاء الرئيسية من بطاقات الأقسام.
        if (key === "overview") {
            return false;
        }

        // أقسام الإدارة متاحة لمالك الشركة فقط.
        if (
            currentCompany.userRole !== "owner" &&
            ["employees", "settings"].includes(key)
        ) {
            return false;
        }

        return true;
    })
    .forEach(([key, section]) => {
            const card = document.createElement("button");
            card.type = "button";
            card.className = key === "qa-center" ? "module-card qa-center-module-card" : "module-card";

            const icon = document.createElement("span");
            icon.className = "module-icon";
            icon.textContent = section.icon;

            const heading = document.createElement("h3");
            heading.textContent = section.title;

            const text = document.createElement("p");
            text.textContent = section.description;

            card.append(icon, heading, text);

            card.addEventListener("click", () => {
                showSection(key);
            });

            grid.appendChild(card);
        });

    const status = document.createElement("p");
    status.className = "status";
    status.textContent =
        "تم تحميل بيانات شركتك. سنضيف وظائف كل قسم تدريجيًا.";

    content.append(welcome, sectionTitle, grid, status);
}




async function showEmployees() {
if (!currentCompany || !auth.currentUser) return;


navigation.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle(
        "active",
        button.dataset.section === "employees"
    );
});

content.replaceChildren();

// الحاوية الرئيسية
const panel = document.createElement("section");
panel.className = "welcome";
panel.style.cssText = "padding:24px;border-radius:16px;";

const title = document.createElement("h2");
title.textContent = "إدارة الموظفين";
title.style.marginBottom = "8px";

const description = document.createElement("p");
description.textContent = "اختر الخدمة التي تريد استخدامها.";

// شبكة البطاقات
const grid = document.createElement("div");
grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
    gap: 16px;
    margin-top: 24px;
    width: 100%;
    box-sizing: border-box;
`;

// إنشاء بطاقة بنفس تصميم بطاقات القسم
function createMenuCard(icon, label, cardDescription, onClick) {
    const card = document.createElement("button");

    card.type = "button";
    card.className = "department-feature-card";

    const cardIcon = document.createElement("span");
    cardIcon.className = "department-feature-icon";
    cardIcon.textContent = icon;

    const heading = document.createElement("strong");
    heading.textContent = label;

    const details = document.createElement("span");
    details.textContent = cardDescription;

    const arrow = document.createElement("span");
    arrow.className = "department-feature-arrow";
    arrow.textContent = "← فتح";

    card.append(cardIcon, heading, details, arrow);

    card.addEventListener("click", onClick);

    return card;
}
const currentRole = String(
currentCompany.userRole ||
currentCompany.role ||
currentCompany.memberRole ||
""
).trim().toLowerCase().replaceAll("-", "*").replaceAll(" ", "*");

const canManageEmployees = [
"owner",
"company_owner",
"general_manager",
"generalmanager",
"admin",
"company_admin",
"manager",
"company_manager",
"department_manager",
"junior_manager",
"small_manager",
"assistant_manager",
"department_head",
"head_of_department",
"departmenthead",
"section_head",
"team_leader"
].includes(currentRole);

if (canManageEmployees) {
grid.appendChild(
createMenuCard(
"✉️",
"إنشاء دعوة",
"أرسل دعوة للموظفين للانضمام إلى الشركة",
showInvitationsPage
)
);
}

grid.appendChild(
createMenuCard(
"👥",
"موظفو الشركة",
"اعرض الموظفين والمديرين ورؤساء الأقسام",
showEmployeesPage
)
);



panel.append(title, description, grid);
content.appendChild(panel);

// =====================================
// صفحة إنشاء الدعوات
// =====================================

async function showInvitationsPage() {
    content.replaceChildren();

    const page = document.createElement("section");
    page.className = "welcome";
    page.style.cssText = "padding:24px;border-radius:16px;";

    const heading = document.createElement("h2");
    heading.textContent = "✉️ إنشاء دعوة";

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "back-button";
    backButton.textContent = "← رجوع";
    backButton.addEventListener("click", showEmployees);

    const form = document.createElement("form");
    form.style.cssText = "margin-top:20px;max-width:450px;";

    const label = document.createElement("label");
    label.textContent = "البريد الإلكتروني للموظف";
    label.style.cssText = "display:block;margin-bottom:8px;";

    const emailInput = document.createElement("input");
    emailInput.type = "email";
    emailInput.required = true;
    emailInput.maxLength = 254;
    emailInput.placeholder = "employee@example.com";
    emailInput.autocomplete = "email";
    emailInput.style.cssText = `
        display:block;
        width:100%;
        box-sizing:border-box;
        padding:12px;
        border:1px solid #334155;
        border-radius:10px;
        background:#0b1120;
        color:white;
        margin-bottom:12px;
    `;

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "back-button";
    submit.textContent = "إنشاء الدعوة";

    const status = document.createElement("p");
    status.className = "status";
    status.setAttribute("role", "status");

    const listHeading = document.createElement("h3");
    listHeading.textContent = "الدعوات السابقة";
    listHeading.style.marginTop = "28px";

    const list = document.createElement("div");

    form.append(label, emailInput, submit);
    page.append(backButton, heading, form, status, listHeading, list);
    content.appendChild(page);

    async function loadInvitations() {
        list.replaceChildren();

        try {
            const invitationsQuery = query(
                collection(db, "invitations"),
                where("companyId", "==", currentCompany.id),
                where("createdBy", "==", auth.currentUser.uid)
            );

            const snapshot = await getDocs(invitationsQuery);

            if (snapshot.empty) {
                list.textContent = "لا توجد دعوات سابقة.";
                return;
            }

            snapshot.forEach((docSnap) => {
                const invitation = docSnap.data();
                const item = document.createElement("article");

                item.style.cssText = `
                    margin-top:10px;
                    padding:14px;
                    border:1px solid #334155;
                    border-radius:10px;
                    overflow-wrap:anywhere;
                `;

                const email = document.createElement("p");
                email.textContent =
                    `📧 ${invitation.email || "بريد غير متاح"}`;

                const code = document.createElement("p");
                code.textContent =
                    `🔑 كود الدعوة: ${invitation.code || "غير متاح"}`;

                const invitationStatus = document.createElement("p");
                invitationStatus.textContent =
                    `الحالة: ${
                        invitation.status === "pending"
                            ? "في انتظار القبول"
                            : invitation.status === "accepted"
                                ? "تم قبول الدعوة"
                                : invitation.status || "غير معروفة"
                    }`;

                item.append(email, code, invitationStatus);
                list.appendChild(item);
            });
        } catch (error) {
            console.error("Invitation loading error:", error);
            list.textContent = "تعذر تحميل الدعوات.";
        }
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim().toLowerCase();

        if (!email || !emailInput.checkValidity()) {
            status.textContent = "اكتب بريدًا إلكترونيًا صحيحًا.";
            return;
        }

        submit.disabled = true;
        status.textContent = "جارٍ إنشاء الدعوة...";

        try {
            const code = crypto.randomUUID()
                .replaceAll("-", "")
                .slice(0, 12)
                .toUpperCase();

            await setDoc(doc(db, "invitations", code), {
                companyId: currentCompany.id,
                companyName: currentCompany.name,
                email,
                code,
                status: "pending",
                createdBy: auth.currentUser.uid,
                createdAt: serverTimestamp()
            });

            status.textContent = "✅ تم إنشاء الدعوة بنجاح.";
            form.reset();

            await loadInvitations();
        } catch (error) {
            console.error("Invitation creation error:", error);

            status.textContent =
                error.code === "permission-denied"
                    ? "ليس لديك صلاحية إنشاء الدعوات."
                    : "تعذر إنشاء الدعوة. حاول مرة أخرى.";
        } finally {
            submit.disabled = false;
        }
    });

    await loadInvitations();
}

// =====================================
// صفحة موظفي الشركة
// =====================================

async function showEmployeesPage() {
    content.replaceChildren();

    const page = document.createElement("section");
    page.className = "welcome";
    page.style.cssText = "padding:24px;border-radius:16px;";

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "back-button";
    backButton.textContent = "← رجوع";
    backButton.addEventListener("click", showEmployees);

    const heading = document.createElement("h2");
    heading.textContent = "👥 موظفو الشركة";

    const status = document.createElement("p");
    status.className = "status";
    status.setAttribute("role", "status");
    status.textContent = "جارٍ تحميل الموظفين...";

    const list = document.createElement("div");
    list.style.cssText = `
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));
        gap:14px;
        margin-top:20px;
    `;

    page.append(backButton, heading, status, list);
    content.appendChild(page);

    function formatDate(timestamp) {
        if (!timestamp) return "غير متاح";

        const date = typeof timestamp.toDate === "function"
            ? timestamp.toDate()
            : new Date(timestamp);

        if (Number.isNaN(date.getTime())) {
            return "غير متاح";
        }

        return new Intl.DateTimeFormat("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric"
        }).format(date);
    }

 function getRoleInfo(member) {
const normalize = (value) => String(value || "")
.trim()
.toLowerCase()
.replaceAll("-", "*")
.replaceAll(" ", "*");


const role = normalize(
    member.role ||
    member.position ||
    member.jobTitle ||
    member.title
);

// مالك الشركة
if (["owner", "company_owner"].includes(role)) {
    return {
        label: "مالك الشركة",
        color: "#c084fc"
    };
}

// المدير العام
if ([
    "general_manager",
    "generalmanager",
    "admin",
    "company_admin"
].includes(role)) {
    return {
        label: "المدير العام",
        color: "#c084fc"
    };
}

// المدير الصغير
if ([
    "junior_manager",
    "small_manager",
    "assistant_manager"
].includes(role)) {
    return {
        label: "مدير صغير",
        color: "#fbbf24"
    };
}

// رئيس القسم
if ([
    "team_leader",
    "department_head",
    "head_of_department",
    "departmenthead",
    "section_head"
].includes(role)) {
    return {
        label: "رئيس قسم",
        color: "#38bdf8"
    };
}

// موظف عادي
return {
    label: "موظف",
    color: "#4ade80"
};


}


    try {
        const snapshot = await getDocs(
            collection(db, "companies", currentCompany.id, "members")
        );

        list.replaceChildren();

        const members = snapshot.docs
            .map((memberDoc) => ({
                uid: memberDoc.id,
                ...memberDoc.data()
            }))
            .filter((member) => member.uid !== currentCompany.ownerId);

        members.sort((a, b) => {
            const dateA = a.joinedAt?.toMillis?.() || 0;
            const dateB = b.joinedAt?.toMillis?.() || 0;
            return dateB - dateA;
        });

        if (members.length === 0) {
            status.textContent = "لا يوجد موظفون في الشركة حتى الآن.";
            return;
        }

        status.textContent = `عدد الموظفين: ${members.length}`;

        members.forEach((member) => {
            const card = document.createElement("article");

            card.style.cssText = `
                padding:18px;
                border:1px solid #334155;
                border-radius:14px;
                background:#111827;
                min-width:0;
                overflow-wrap:anywhere;
            `;

            const name = document.createElement("h3");
            name.textContent =
                member.name ||
                member.displayName ||
                member.fullName ||
                member.email ||
                "اسم غير متاح";

            name.style.cssText = "margin:0 0 12px;font-size:17px;";

            const email = document.createElement("p");
            email.textContent =
                `📧 ${member.email || "البريد الإلكتروني غير متاح"}`;

            email.style.cssText = `
                margin:8px 0;
                color:#cbd5e1;
                font-size:13px;
            `;

            const date = document.createElement("p");
            date.textContent =
                `📅 تاريخ الانضمام: ${formatDate(member.joinedAt)}`;

            date.style.cssText = `
                margin:8px 0;
                color:#94a3b8;
                font-size:13px;
            `;

            const roleInfo = getRoleInfo(member);
            const role = document.createElement("span");

            role.textContent = roleInfo.label;
            role.style.cssText = `
                display:inline-block;
                margin-top:8px;
                padding:6px 11px;
                border-radius:20px;
                background:${roleInfo.color}20;
                color:${roleInfo.color};
                font-size:12px;
                font-weight:700;
            `;

            card.append(name, email, date, role);
            list.appendChild(card);
        });
    } catch (error) {
        console.error("Employees loading error:", error);

        status.textContent =
            "تعذر تحميل الموظفين. تحقق من صلاحيات Firestore.";
    }
}


}







async function showDepartments() {
    if (!currentCompany || !auth.currentUser) return;

    const companyId = currentCompany.id;
  
const role = currentCompany.userRole;

console.log("Department permission diagnostic:", {
    userId: auth.currentUser?.uid,
    companyId: currentCompany.id,
    userRole: currentCompany.userRole,
    canCreateDepartment: [
        "owner",
        "junior_manager"
    ].includes(currentCompany.userRole)
});

const canCreateDepartment = [
    "owner",
    "junior_manager"
].includes(role);

// إضافة الموظفين للأقسام تظل للمالك فقط.
const isOwner = role === "owner";



    content.replaceChildren();

    const panel = document.createElement("section");
    panel.className = "welcome";

    const title = document.createElement("h2");
    title.textContent = "🏢 أقسام الشركة";

    const description = document.createElement("p");
    
description.textContent = canCreateDepartment
    ? "أنشئ الأقسام وأدر فرق الشركة."
    : "اعرض أقسام الشركة التي يمكنك الوصول إليها.";

    const form = document.createElement("form");
    form.style.marginTop = "20px";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "اسم القسم، مثل: البرمجة";
    nameInput.required = true;
    nameInput.maxLength = 80;
    nameInput.style.cssText = `
        display: block;
        width: 100%;
        max-width: 450px;
        box-sizing: border-box;
        padding: 13px;
        margin-bottom: 12px;
        border-radius: 9px;
        border: 1px solid #334155;
        background: #0b1120;
        color: white;
    `;

    const createButton = document.createElement("button");
    createButton.type = "submit";
    createButton.className = "back-button";
    createButton.textContent = "إنشاء القسم";

    const message = document.createElement("p");
    message.className = "status";
    message.setAttribute("role", "status");

    const listTitle = document.createElement("h3");
    listTitle.textContent = "أقسام الشركة الحالية";
    listTitle.style.marginTop = "30px";

    const departmentList = document.createElement("div");

   if (canCreateDepartment) {
    form.append(nameInput, createButton);
}

    panel.append(
        title,
        description,
        form,
        message,
        listTitle,
        departmentList
    );

    content.appendChild(panel);

    // إنشاء قسم جديد
   
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!canCreateDepartment || !auth.currentUser) {
        message.textContent = "ليس لديك صلاحية إنشاء الأقسام.";
        return;
    }

    const name = nameInput.value.trim();

    if (name.length < 2 || name.length > 80) {
        message.textContent = "اسم القسم يجب أن يكون بين حرفين و80 حرفًا.";
        return;
    }

    createButton.disabled = true;
    message.textContent = "جارٍ إنشاء القسم...";

    try {
 
const currentUser = auth.currentUser;

// جلب بيانات الملف الشخصي من Firestore
const profileSnapshot = await getDoc(
    doc(db, "users", currentUser.uid)
);

const profileData = profileSnapshot.exists()
    ? profileSnapshot.data()
    : {};

const profileName = profileData.name?.trim() || "";
const profileEmail = profileData.email || currentUser.email || "";

await addDoc(collection(db, "departments"), {
    companyId,
    name,

    // بيانات المنشئ من الملف الشخصي
    createdBy: currentUser.uid,
    createdByName: profileName || profileEmail || "غير متاح",
    createdByEmail: profileEmail,

    // تاريخ الإنشاء
    createdAt: serverTimestamp()
});



        message.textContent = "✅ تم إنشاء القسم بنجاح.";
        form.reset();

        await loadDepartments();
    } catch (error) {
       console.error("Create department error:", {
    code: error.code,
    message: error.message,
    userId: auth.currentUser?.uid,
    companyId
});
        message.textContent =
            "تعذر إنشاء القسم. تحقق من قواعد Firestore.";
    } finally {
        createButton.disabled = false;
    }
});



    async function loadDepartments() {

        const currentUserId = auth.currentUser?.uid;
        departmentList.replaceChildren();

        const loading = document.createElement("p");
        loading.textContent = "جارٍ تحميل الأقسام...";
        departmentList.appendChild(loading);

        try {
            const departmentsQuery = query(
                collection(db, "departments"),
                where("companyId", "==", companyId)
            );

            const snapshot = await getDocs(departmentsQuery);

            departmentList.replaceChildren();

            if (snapshot.empty) {
                const empty = document.createElement("p");
                empty.textContent = "لم يتم إنشاء أقسام حتى الآن.";
                departmentList.appendChild(empty);
                return;
            }

            // صاحب الشركة فقط يستطيع تحميل قائمة أعضاء الشركة كاملة.
           let employees = [];

const membersSnapshot = await getDocs(
    collection(db, "companies", companyId, "members")
);



employees = membersSnapshot.docs
.filter((memberDoc) => {
return memberDoc.id !== currentUserId;
})
.map((memberDoc) => ({
uid: memberDoc.id,
...memberDoc.data()
}));



            for (const departmentDoc of snapshot.docs) {
                const department = departmentDoc.data();
                const departmentId = departmentDoc.id;

                const card = document.createElement("article");
                card.className = "project-card";
                card.style.marginTop = "16px";

const departmentName = document.createElement("h3");
departmentName.textContent = `🏢 ${department.name}`;

// بيانات منشئ القسم
const departmentCreator = document.createElement("p");
departmentCreator.className = "department-creator-info";


// البحث عن منشئ القسم ضمن أعضاء الشركة
const creatorMember = employees.find(
    (member) => member.uid === department.createdBy
);

const creatorName =
    department.createdByName ||
    department.createdByEmail ||
    creatorMember?.name ||
    creatorMember?.displayName ||
    creatorMember?.email ||
    "غير متاح";

departmentCreator.textContent = `👤 أنشأ القسم: ${creatorName}`;


// تاريخ ووقت إنشاء القسم
const departmentCreatedAt = document.createElement("p");
departmentCreatedAt.className = "department-created-at";

if (department.createdAt) {
    const createdDate =
        typeof department.createdAt.toDate === "function"
            ? department.createdAt.toDate()
            : new Date(department.createdAt);

    if (!Number.isNaN(createdDate.getTime())) {
        const date = createdDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });

        const time = createdDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });

        departmentCreatedAt.textContent =
            `📅 تاريخ الإنشاء: ${date} | 🕒 ${time}`;
    } else {
        departmentCreatedAt.textContent = "📅 تاريخ الإنشاء غير متاح";
    }
} else {
    departmentCreatedAt.textContent = "📅 تاريخ الإنشاء غير متاح";
}


const openDepartmentButton = document.createElement("button");
openDepartmentButton.type = "button";
openDepartmentButton.className = "project-tasks-button";
openDepartmentButton.textContent = "📂 فتح القسم";

openDepartmentButton.addEventListener("click", () => {
    openDepartmentDetails(departmentId, department.name);
});
                const departmentDescription = document.createElement("p");
                departmentDescription.textContent =
                    "أعضاء الفريق المسجلون في هذا القسم:";

                const membersList = document.createElement("div");

 
card.append(
    departmentName,
    departmentCreator,
    departmentCreatedAt,
    openDepartmentButton,
    departmentDescription,
    membersList
);
 


                const departmentMembersRef = collection(
                    db,
                    "departments",
                    departmentId,
                    "members"
                );

                const canManageDepartmentMembers = [
    "owner",
    "junior_manager"
].includes(currentCompany.userRole);

if (canManageDepartmentMembers) {
                    const departmentMembersSnapshot = await getDocs(
                        departmentMembersRef
                    );

                    const assignedIds = new Set(
                        departmentMembersSnapshot.docs.map(
                            (memberDoc) => memberDoc.id
                        )
                    );

                    if (assignedIds.size === 0) {
                        const empty = document.createElement("p");
                        empty.textContent = "لم تتم إضافة موظفين لهذا القسم بعد.";
                        membersList.appendChild(empty);
                    }

                
departmentMembersSnapshot.forEach((memberDoc) => {
    const memberData = memberDoc.data();

    const employee = employees.find(
        (item) => item.uid === memberDoc.id
    );

    const employeeName =
        memberData.name?.trim() ||
        employee?.name?.trim() ||
        employee?.displayName?.trim() ||
        employee?.email?.trim() ||
        "موظف بدون اسم";

    const memberItem = document.createElement("p");
    memberItem.textContent = `👤 ${employeeName}`;

    membersList.appendChild(memberItem);


});



                    const employeeLabel = document.createElement("label");
                    employeeLabel.textContent = "إضافة موظف للقسم:";
                    employeeLabel.style.display = "block";
                    employeeLabel.style.marginTop = "16px";

                    const employeeSelect = document.createElement("select");
                    employeeSelect.style.cssText = `
                        display: block;
                        width: 100%;
                        max-width: 450px;
                        padding: 12px;
                        margin: 8px 0;
                        border-radius: 9px;
                    `;

                    const defaultOption = document.createElement("option");
                    defaultOption.value = "";
                    defaultOption.textContent = "اختر موظفًا";
                    employeeSelect.appendChild(defaultOption);

    employees
.filter((employee) => !assignedIds.has(employee.uid))
.forEach((employee) => {
const option = document.createElement("option");
option.value = employee.uid;

    const employeeName =
        employee.name?.trim() ||
        employee.displayName?.trim() ||
        employee.fullName?.trim() ||
        employee.email?.trim() ||
        "عضو بدون اسم";

    const role = String(
        employee.role ||
        employee.position ||
        employee.jobTitle ||
        employee.title ||
        "employee"
    )
        .trim()
        .toLowerCase()
        .replaceAll("-", "_")
        .replaceAll(" ", "_");

    const roleLabels = {
        owner: "رئيس الشركة",
        company_owner: "رئيس الشركة",
        general_manager: "المدير العام",
        generalmanager: "المدير العام",
        junior_manager: "المدير الصغير",
        small_manager: "المدير الصغير",
        assistant_manager: "المدير المساعد",
        department_head: "رئيس قسم",
        head_of_department: "رئيس قسم",
        departmenthead: "رئيس قسم",
        section_head: "رئيس قسم",
        team_leader: "رئيس فريق",
        employee: "موظف",
        staff: "موظف",
        worker: "موظف"
    };

    const roleLabel = roleLabels[role] || "عضو بالشركة";

    option.textContent = `${employeeName} — ${roleLabel}`;
    employeeSelect.appendChild(option);
});



                    const addButton = document.createElement("button");
                    addButton.type = "button";
                    addButton.className = "back-button";
                    addButton.textContent = "إضافة للقسم";

                    const addMessage = document.createElement("p");
                    addMessage.setAttribute("role", "status");

                    addButton.addEventListener("click", async () => {
                        const userId = employeeSelect.value;

                        if (!userId) {
                            addMessage.textContent = "اختر موظفًا أولًا.";
                            return;
                        }

                        if (!employees.some((employee) => employee.uid === userId)) {
                            addMessage.textContent = "الموظف المختار غير موجود ضمن أعضاء الشركة.";
                            return;
                        }

                        addButton.disabled = true;
                        addMessage.textContent = "جارٍ إضافة الموظف...";

                        try {
                         const selectedEmployee = employees.find(
    (employee) => employee.uid === userId
);

if (!selectedEmployee) {
    throw new Error("لم يتم العثور على بيانات الموظف المختار.");
}

const employeeName =
    selectedEmployee.name?.trim() ||
    selectedEmployee.displayName?.trim() ||
    selectedEmployee.email?.trim() ||
    `موظف ${userId.slice(0, 6)}`;

await setDoc(
    doc(
        db,
        "departments",
        departmentId,
        "members",
        userId
    ),
    {
        uid: userId,
        name: employeeName,
        addedBy: auth.currentUser.uid,
        addedAt: serverTimestamp()
    }
);

                            addMessage.textContent = "✅ تمت إضافة الموظف للقسم.";

                            await loadDepartments();
                        } catch (error) {
                            console.error("Add department member error:", error);

                            addMessage.textContent =
                                error.code === "permission-denied"
                                    ? "قواعد Firestore رفضت الإضافة. تأكد من نشر قواعد أعضاء الأقسام."
                                    : "تعذرت إضافة الموظف. حاول مرة أخرى.";
                        } finally {
                            addButton.disabled = false;
                        }
                    });

                    card.append(
                        employeeLabel,
                        employeeSelect,
                        addButton,
                        addMessage
                    );
                } else {
                    // الموظف يقرأ عضويته هو فقط حسب قواعد الأمان الحالية.
                    const myMembership = await getDoc(
                        doc(
                            db,
                            "departments",
                            departmentId,
                            "members",
                            auth.currentUser.uid
                        )
                    );

                    const status = document.createElement("p");
                    status.textContent = myMembership.exists()
                        ? "✅ أنت عضو في هذا القسم."
                        : "أنت غير مضاف إلى هذا القسم.";

                    membersList.appendChild(status);
                }

                departmentList.appendChild(card);
            }
        } catch (error) {
            console.error("Load departments error:", error);

            departmentList.replaceChildren();

            const errorText = document.createElement("p");
            errorText.textContent =
                "تعذر تحميل الأقسام أو أعضاء الشركة. تحقق من صلاحيات Firestore.";
            departmentList.appendChild(errorText);
        }
    }

    await loadDepartments();
}


async function openDepartmentDetails(departmentId, departmentName) {
    if (!currentCompany || !auth.currentUser) return;

    content.replaceChildren();

    const panel = document.createElement("section");
    panel.className = "welcome";

    const title = document.createElement("h2");
    title.textContent = `🏢 ${departmentName}`;

    const description = document.createElement("p");
    description.textContent = "تفاصيل القسم والمهام المرتبطة به.";


// شريط أدوات القسم
const departmentToolbar = document.createElement("div");
departmentToolbar.className = "department-toolbar";

departmentToolbar.style.cssText = `
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:12px;
    flex-wrap:wrap;
    margin:16px 0;
`;

const departmentMenuButton = document.createElement("button");
departmentMenuButton.type = "button";
departmentMenuButton.textContent = "⋮ خيارات القسم";
departmentMenuButton.className = "back-button";
departmentMenuButton.setAttribute("aria-expanded", "false");

const departmentMenu = document.createElement("div");
departmentMenu.style.cssText = `
    display:none;
    padding:12px;
    margin-bottom:16px;
    border:1px solid #d1d5db;
    border-radius:10px;
    gap:8px;
    flex-wrap:wrap;
`;

const showMembersButton = document.createElement("button");
showMembersButton.type = "button";
showMembersButton.textContent = "👥 أعضاء القسم";
showMembersButton.className = "back-button";

const showTasksButton = document.createElement("button");
showTasksButton.type = "button";
showTasksButton.textContent = "📋 مهام القسم";
showTasksButton.className = "back-button";

departmentMenu.append(showMembersButton, showTasksButton);

departmentMenuButton.addEventListener("click", () => {
    const isOpen = departmentMenu.style.display === "flex";

    departmentMenu.style.display = isOpen ? "none" : "flex";
    departmentMenuButton.setAttribute("aria-expanded", String(!isOpen));
});

// ===============================
// الصفحة الرئيسية للقسم
// ===============================

const departmentHome = document.createElement("div");
departmentHome.className = "department-home";

const departmentCards = document.createElement("div");
departmentCards.className = "department-feature-cards";

function createMenuCard(icon, label, description, onClick) {
const card = document.createElement("button");


card.type = "button";
card.className = "department-feature-card";

const cardIcon = document.createElement("span");
cardIcon.className = "department-feature-icon";
cardIcon.textContent = icon;

const heading = document.createElement("strong");
heading.textContent = label;

const details = document.createElement("span");
details.textContent = description;

const arrow = document.createElement("span");
arrow.className = "department-feature-arrow";
arrow.textContent = "← فتح";

card.append(cardIcon, heading, details, arrow);

card.addEventListener("click", onClick);

return card;


}


const openChatCard = createMenuCard(
    "💬",
    "محادثة القسم",
    "تواصل مع أعضاء الفريق وأرسل الرسائل",
    () => {
        showDepartmentWorkspace(
            departmentChat,
            "💬 محادثة القسم"
        );
    }
);

const openCreateTaskCard = createMenuCard(
    "➕",
    "إنشاء مهمة",
    "أنشئ مهمة جديدة وحدد الموظفين المسؤولين",
    () => {
        showDepartmentWorkspace(
            taskForm,
            "➕ إنشاء مهمة جديدة"
        );
    }
);

const openTasksCard = createMenuCard(
    "📋",
    "مهام القسم",
    "تابع مهام القسم وحالة تنفيذها",
    () => {
        showDepartmentWorkspace(
            departmentTasksPanel,
            "📋 مهام القسم"
        );
    }
);

departmentCards.append(
    openChatCard,
    openCreateTaskCard,
    openTasksCard
);

const departmentWorkspace = document.createElement("div");
departmentWorkspace.className = "department-workspace";

const workspaceHeading = document.createElement("h3");
workspaceHeading.className = "department-workspace-heading";

const workspaceBackButton = document.createElement("button");
workspaceBackButton.type = "button";
workspaceBackButton.className = "back-button";
workspaceBackButton.textContent = "→ العودة إلى قائمة القسم";

function showDepartmentWorkspace(section, headingText) {
    departmentHome.hidden = true;
    departmentWorkspace.hidden = false;

    workspaceHeading.textContent = headingText;

    departmentWorkspace.replaceChildren(
        workspaceBackButton,
        workspaceHeading,
        section
    );

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function showDepartmentHome() {
    departmentWorkspace.hidden = true;
    departmentHome.hidden = false;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

workspaceBackButton.addEventListener("click", showDepartmentHome);

departmentHome.appendChild(departmentCards);

// منطقة محادثة الفريق
const departmentChat = document.createElement("section");
departmentChat.className = "department-chat";
departmentChat.style.cssText = `
    border:1px solid #d1d5db;
    border-radius:12px;
    padding:16px;
    margin:16px 0;
`;

const chatTitle = document.createElement("h3");
chatTitle.textContent = "💬 محادثة الفريق";

const chatNotice = document.createElement("p");
chatNotice.textContent =
    "مساحة التواصل بين أعضاء القسم.";

const chatMessages = document.createElement("div");
chatMessages.className = "department-chat-messages";
chatMessages.setAttribute("aria-live", "polite");
chatMessages.style.cssText = `
    min-height:120px;
    max-height:360px;
    overflow-y:auto;
    overflow-wrap:anywhere;
    padding:10px 0;
`;

const chatComposer = document.createElement("form");
chatComposer.className = "department-chat-composer";
chatComposer.style.cssText = `
    display:flex;
    gap:8px;
    flex-wrap:wrap;
`;

const chatInput = document.createElement("input");
chatInput.type = "text";
chatInput.placeholder = "اكتب رسالة للفريق...";
chatInput.maxLength = 2000;
chatInput.autocomplete = "off";
chatInput.setAttribute("aria-label", "رسالة الفريق");
chatInput.style.cssText = `
    flex:1;
    min-width:0;
    padding:12px;
`;

const chatSendButton = document.createElement("button");
chatSendButton.type = "submit";
chatSendButton.className = "department-chat-send-button";
chatSendButton.textContent = "➤";
chatSendButton.title = "إرسال الرسالة";
chatSendButton.setAttribute("aria-label", "إرسال الرسالة");

// زر تسجيل الصوت
// حاوية أدوات الصوت بجوار مدخل الرسالة
const voiceControls = document.createElement("div");
voiceControls.className = "department-voice-controls";

// زر الميكروفون
const voiceRecordButton = document.createElement("button");
voiceRecordButton.type = "button";
voiceRecordButton.className = "department-voice-record-button";
voiceRecordButton.innerHTML = "🎙";
voiceRecordButton.setAttribute("aria-label", "تسجيل رسالة صوتية");
voiceRecordButton.title = "تسجيل رسالة صوتية";

// زر حذف التسجيل
const voiceDeleteButton = document.createElement("button");
voiceDeleteButton.type = "button";
voiceDeleteButton.className = "department-voice-delete-button";
voiceDeleteButton.textContent = "🗑";
voiceDeleteButton.title = "حذف التسجيل";
voiceDeleteButton.setAttribute("aria-label", "حذف التسجيل");
voiceDeleteButton.hidden = true;

// زر إرسال التسجيل
const voiceSendButton = document.createElement("button");
voiceSendButton.type = "button";
voiceSendButton.className = "department-voice-send-button";
voiceSendButton.textContent = "➤";
voiceSendButton.title = "إرسال التسجيل الصوتي";
voiceSendButton.setAttribute("aria-label", "إرسال التسجيل الصوتي");
voiceSendButton.hidden = true;

// حالة التسجيل
const voiceRecordingStatus = document.createElement("span");
voiceRecordingStatus.className = "department-voice-status";
voiceRecordingStatus.setAttribute("role", "status");

// ترتيب أدوات كتابة الرسائل
chatComposer.style.display = "flex";
chatComposer.style.alignItems = "center";
chatComposer.style.gap = "8px";
chatComposer.style.direction = "rtl";

// إضافة العناصر مرة واحدة فقط
chatComposer.append(
    voiceRecordButton,
    chatInput,
    chatSendButton,
    voiceDeleteButton
);
// حالة التسجيل أسفل شريط الرسائل
chatComposer.appendChild(voiceRecordingStatus);

// حالة المحادثة
const chatStatus = document.createElement("p");
chatStatus.setAttribute("role", "status");

departmentChat.append(
    chatTitle,
    chatNotice,
    chatMessages,
    chatComposer,
    chatStatus
);

openChatCard.addEventListener("click", () => {
    showDepartmentWorkspace(
        departmentChat,
        "💬 محادثة القسم"
    );

    // إظهار واجهة المحادثة فورًا
    departmentChat.style.display = "flex";
    chatMessages.style.display = "flex";

    // وضع المؤشر داخل حقل الرسالة
    requestAnimationFrame(() => {
        chatInput.focus({ preventScroll: true });
    });
});

// الاستماع المباشر لرسائل القسم
const departmentMessagesRef = collection(
    db,
    "departments",
    departmentId,
    "messages"
);

const departmentMessagesQuery = query(
    departmentMessagesRef,
    orderBy("createdAt", "asc")
);

let unsubscribeDepartmentMessages = null;

unsubscribeDepartmentMessages = onSnapshot(
    departmentMessagesQuery,
    (snapshot) => {
        chatMessages.replaceChildren();

        if (snapshot.empty) {
            const emptyMessage = document.createElement("div");
            emptyMessage.className = "department-chat-empty";
            emptyMessage.textContent =
                "💬 لا توجد رسائل حتى الآن. اكتب أول رسالة لبدء المحادثة.";
            chatMessages.appendChild(emptyMessage);
            return;
        }

        // سيب باقي كود عرض الرسائل زي ما هو

        snapshot.forEach((messageDoc) => {
            const message = messageDoc.data();

         const isOwnMessage =
    message.senderId === auth.currentUser?.uid;

const messageCard = document.createElement("div");

messageCard.className = isOwnMessage
    ? "department-message department-message-own"
    : "department-message department-message-other";

const sender = document.createElement("strong");

sender.className = "department-message-sender";

sender.textContent = isOwnMessage
    ? "أنت"
    : (message.senderName || "عضو الفريق");


const messageText = document.createElement("p");
messageText.className = "department-message-text";

if (message.type === "audio" && message.fileURL) {
    // مشغل الصوت
    const voicePlayer = document.createElement("div");
    voicePlayer.className = "whatsapp-voice";

    // عنصر الصوت
    const audioPlayer = document.createElement("audio");
    audioPlayer.preload = "metadata";
    audioPlayer.src = message.fileURL;

    // زر التشغيل والإيقاف
    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.className = "whatsapp-voice-play";
    playButton.textContent = "▶";
    playButton.setAttribute("aria-label", "تشغيل التسجيل الصوتي");

    // الموجات الصوتية
    const waveWrapper = document.createElement("div");
    waveWrapper.className = "whatsapp-wave-wrapper";

    const wave = document.createElement("div");
    wave.className = "whatsapp-voice-wave";
    wave.setAttribute("role", "slider");
    wave.setAttribute("aria-label", "موضع التسجيل الصوتي");
    wave.setAttribute("aria-valuemin", "0");
    wave.setAttribute("aria-valuemax", "100");
    wave.setAttribute("aria-valuenow", "0");
    wave.setAttribute("tabindex", "0");

    // إنشاء أعمدة الموجات
    const barHeights = [
        9, 15, 23, 13, 19, 29, 17, 11,
        25, 34, 20, 14, 28, 18, 37, 24,
        13, 21, 31, 16, 26, 11, 35, 19,
        28, 14, 23, 33, 17, 10, 25, 20,
        30, 13, 22, 36, 18, 27, 12, 24
    ];

    const bars = [];

    barHeights.forEach((height, index) => {
        const bar = document.createElement("span");
        bar.className = "whatsapp-wave-bar";
        bar.style.height = `${height}px`;

        wave.appendChild(bar);
        bars.push(bar);
    });

    waveWrapper.appendChild(wave);

    // الوقت
    const timeRow = document.createElement("div");
    timeRow.className = "whatsapp-time-row";

    const currentTime = document.createElement("span");
    currentTime.className = "whatsapp-current-time";
    currentTime.textContent = "0:00";

    const durationTime = document.createElement("span");
    durationTime.className = "whatsapp-duration-time";
    durationTime.textContent = "0:00";

    timeRow.append(currentTime, durationTime);

    // ترتيب المشغل
    const voiceContent = document.createElement("div");
    voiceContent.className = "whatsapp-voice-content";

    voiceContent.append(waveWrapper, timeRow);

    voicePlayer.append(
        playButton,
        voiceContent
    );

    voicePlayer.appendChild(audioPlayer);
    messageText.appendChild(voicePlayer);

    // تحويل الثواني إلى دقائق وثوانٍ
    function formatVoiceTime(seconds) {
        if (!Number.isFinite(seconds) || seconds < 0) {
            return "0:00";
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
    }

    // تحديث الموجات حسب تقدم الصوت
    function updateVoiceProgress() {
        const duration = audioPlayer.duration;

        if (!Number.isFinite(duration) || duration <= 0) {
            return;
        }

        const progress = Math.min(
            100,
            (audioPlayer.currentTime / duration) * 100
        );

        const activeBars = Math.floor(
            (progress / 100) * bars.length
        );

        bars.forEach((bar, index) => {
            bar.classList.toggle(
                "is-played",
                index < activeBars
            );
        });

        wave.setAttribute("aria-valuenow", String(Math.round(progress)));

        currentTime.textContent = formatVoiceTime(
            audioPlayer.currentTime
        );

        durationTime.textContent = formatVoiceTime(duration);
    }

    // تحميل مدة التسجيل
    audioPlayer.addEventListener("loadedmetadata", () => {
        durationTime.textContent = formatVoiceTime(
            audioPlayer.duration
        );

        updateVoiceProgress();
    });

    // تحديث أثناء التشغيل
    audioPlayer.addEventListener("timeupdate", updateVoiceProgress);

    // تشغيل وإيقاف
    playButton.addEventListener("click", async () => {
        if (audioPlayer.paused) {
            try {
                await audioPlayer.play();
            } catch (error) {
                console.error("Voice playback error:", error);
                currentTime.textContent = "تعذر التشغيل";
            }
        } else {
            audioPlayer.pause();
        }
    });

    audioPlayer.addEventListener("play", () => {
        playButton.textContent = "❚❚";
        playButton.setAttribute("aria-label", "إيقاف التسجيل مؤقتًا");
        voicePlayer.classList.add("is-playing");
    });

    audioPlayer.addEventListener("pause", () => {
        playButton.textContent = "▶";
        playButton.setAttribute("aria-label", "تشغيل التسجيل الصوتي");
        voicePlayer.classList.remove("is-playing");
    });

    audioPlayer.addEventListener("ended", () => {
        audioPlayer.currentTime = 0;
        updateVoiceProgress();
    });

    // الانتقال إلى أي نقطة بالضغط على الموجات
    function seekVoice(event) {
        if (
            !Number.isFinite(audioPlayer.duration) ||
            audioPlayer.duration <= 0
        ) {
            return;
        }

        const rect = wave.getBoundingClientRect();

        if (!rect.width) return;

        const position = Math.max(
            0,
            Math.min(1, (event.clientX - rect.left) / rect.width)
        );

        audioPlayer.currentTime = position * audioPlayer.duration;
        updateVoiceProgress();
    }

    wave.addEventListener("click", seekVoice);

    // دعم تحريك موضع التسجيل بلوحة المفاتيح
    wave.addEventListener("keydown", (event) => {
        if (
            !Number.isFinite(audioPlayer.duration) ||
            audioPlayer.duration <= 0
        ) {
            return;
        }

        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();

            const direction = event.key === "ArrowRight" ? 1 : -1;

            audioPlayer.currentTime = Math.max(
                0,
                Math.min(
                    audioPlayer.duration,
                    audioPlayer.currentTime + direction * 5
                )
            );

            updateVoiceProgress();
        }
    });

} else {
    messageText.textContent = message.text || "";
}



const messageTime = document.createElement("time");
messageTime.className = "department-message-time";

if (message.createdAt?.toDate) {
    const date = message.createdAt.toDate();

    messageTime.dateTime = date.toISOString();

    messageTime.textContent = date.toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

messageCard.append(sender, messageText, messageTime);
chatMessages.appendChild(messageCard);
        });

        chatMessages.scrollTop = chatMessages.scrollHeight;
    },
    (error) => {
        console.error(
            "Department chat listener error:",
            error.code,
            error.message
        );

        chatStatus.textContent =
            error.code === "permission-denied"
                ? "ليس لديك صلاحية لقراءة محادثة هذا القسم."
                : "تعذر تحميل رسائل المحادثة.";
    }
);

// إرسال رسالة جديدة
chatComposer.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (departmentVoiceSending) return;

    // الحالة الأولى: التسجيل ما زال يعمل، والضغط على ➤ يعني إيقافه وإرساله
    if (departmentVoiceRecorder?.state === "recording") {
        departmentVoiceSending = true;
        chatSendButton.disabled = true;
        voiceDeleteButton.disabled = true;

        voiceRecordingStatus.textContent =
            "⏳ جارٍ إنهاء التسجيل وتجهيزه للإرسال...";

        const recorder = departmentVoiceRecorder;

        recorder.addEventListener("stop", async () => {
            try {
                if (departmentVoiceCancelled) return;

                // انتظر حتى تصبح بيانات التسجيل جاهزة
                departmentVoiceReadyToSend = true;

                if (!departmentVoiceChunks.length) {
                    throw new Error("التسجيل فارغ. حاول التسجيل مرة أخرى.");
                }

                await sendDepartmentVoice();

            } catch (error) {
                console.error("Send recorded voice error:", error);

                voiceRecordingStatus.textContent =
                    `تعذر إرسال التسجيل: ${error.message}`;

            } finally {
                departmentVoiceSending = false;
                chatSendButton.disabled = false;
                voiceDeleteButton.disabled = false;
            }
        }, { once: true });

        recorder.stop();
        return;
    }

    // الحالة الثانية: التسجيل انتهى بالفعل وأصبح جاهزًا للإرسال
    if (departmentVoiceReadyToSend && departmentVoiceChunks.length > 0) {
        departmentVoiceSending = true;
        chatSendButton.disabled = true;

        try {
            await sendDepartmentVoice();
        } catch (error) {
            console.error("Send ready voice error:", error);

            voiceRecordingStatus.textContent =
                `تعذر إرسال التسجيل: ${error.message}`;
        } finally {
            departmentVoiceSending = false;
            chatSendButton.disabled = false;
        }

        return;
    }

    // الحالة الثالثة: إرسال رسالة نصية بالطريقة المعتادة
    const text = chatInput.value.trim();
    const user = auth.currentUser;

    if (!user || !text) return;

    chatSendButton.disabled = true;
    chatStatus.textContent = "جارٍ إرسال الرسالة...";

    try {
        let senderName = "عضو الفريق";

        const currentMemberSnapshot = await getDocs(
            collection(db, "departments", departmentId, "members")
        );

        const currentMember = currentMemberSnapshot.docs.find(
            (memberDoc) => memberDoc.id === user.uid
        );

        if (currentMember) {
            const memberData = currentMember.data();

            if (
                typeof memberData.name === "string" &&
                memberData.name.trim()
            ) {
                senderName = memberData.name.trim();
            }
        } else if (currentCompany.userRole === "owner") {
            senderName = "مدير الشركة";
        } else {
            throw new Error(
                "يجب أن تكون عضوًا في هذا القسم لإرسال الرسائل."
            );
        }

        await addDoc(departmentMessagesRef, {
            text,
            senderId: user.uid,
            senderName,
            createdAt: serverTimestamp()
        });

        chatInput.value = "";
        chatStatus.textContent = "";
        chatInput.focus();

    } catch (error) {
        console.error(
            "Send department message error:",
            error.code,
            error.message
        );

        chatStatus.textContent =
            error.code === "permission-denied"
                ? "رفضت قواعد Firestore إرسال الرسالة. تأكد من عضويتك في القسم."
                : `تعذر إرسال الرسالة: ${error.message}`;

    } finally {
        chatSendButton.disabled = false;
    }
});


// ============================================
// 🎙️ تسجيل وإرسال الرسائل الصوتية للقسم
// ============================================

let departmentVoiceRecorder = null;
let departmentVoiceStream = null;
let departmentVoiceChunks = [];
let departmentVoiceStarting = false;
let departmentVoiceReadyToSend = false;
let departmentVoiceSending = false;
let departmentVoiceCancelled = false;

// بدء التسجيل عند الضغط على الميكروفون
voiceRecordButton.addEventListener("click", async () => {
    if (departmentVoiceStarting || departmentVoiceSending) return;

    if (departmentVoiceRecorder?.state === "recording") return;

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        voiceRecordingStatus.textContent =
            "المتصفح لا يدعم تسجيل الصوت أو أن الاتصال غير آمن.";
        return;
    }

    const user = auth.currentUser;

    if (!user) {
        voiceRecordingStatus.textContent = "سجّل الدخول أولًا.";
        return;
    }

    departmentVoiceStarting = true;
    departmentVoiceCancelled = false;
    departmentVoiceReadyToSend = false;

    voiceRecordButton.disabled = true;
    voiceRecordingStatus.textContent = "🎤 جارٍ تشغيل الميكروفون...";

    try {
        // التحقق من عضوية المستخدم في القسم
        const membersSnapshot = await getDocs(
            collection(db, "departments", departmentId, "members")
        );

        const currentMember = membersSnapshot.docs.find(
            memberDoc => memberDoc.id === user.uid
        );

        if (!currentMember && currentCompany.userRole !== "owner") {
            throw new Error("يجب أن تكون عضوًا في هذا القسم لإرسال الصوت.");
        }

        departmentVoiceStream =
            await navigator.mediaDevices.getUserMedia({ audio: true });

        // قد يكون المستخدم ألغى العملية أثناء طلب إذن الميكروفون
        if (departmentVoiceCancelled) {
            departmentVoiceStream.getTracks().forEach(track => track.stop());
            departmentVoiceStream = null;
            return;
        }

        departmentVoiceChunks = [];

        let recorderOptions = {};

        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
            recorderOptions.mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
            recorderOptions.mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
            recorderOptions.mimeType = "audio/ogg;codecs=opus";
        }

        departmentVoiceRecorder = Object.keys(recorderOptions).length
            ? new MediaRecorder(departmentVoiceStream, recorderOptions)
            : new MediaRecorder(departmentVoiceStream);

        const recorder = departmentVoiceRecorder;

      recorder.ondataavailable = (event) => {
    if (event.data?.size > 0 && !departmentVoiceCancelled) {
        departmentVoiceChunks.push(event.data);
    }
};

        recorder.onerror = event => {
            console.error(
                "Department voice recorder error:",
                event.error
            );

            voiceRecordingStatus.textContent =
                "حدث خطأ أثناء تسجيل الصوت.";
        };

        // لا نرفع الصوت هنا؛ الرفع يحصل فقط عند الضغط على إرسال
    recorder.onstop = async () => {
    if (departmentVoiceCancelled) return;

    departmentVoiceReadyToSend = true;

    voiceRecordingStatus.textContent = "✅ التسجيل جاهز للإرسال.";

    voiceRecordButton.hidden = false;
    voiceRecordButton.disabled = false;

    chatSendButton.hidden = false;
    chatSendButton.disabled = false;

    voiceDeleteButton.hidden = false;
    voiceDeleteButton.disabled = false;

    voiceSendButton.hidden = true;
};
        recorder.start(100);

// يظل الميكروفون وزر الإرسال ظاهرين أثناء التسجيل
voiceRecordButton.hidden = false;
voiceRecordButton.disabled = false;

chatSendButton.hidden = false;
chatSendButton.disabled = false;

// إظهار زر حذف التسجيل فقط
voiceDeleteButton.hidden = false;
voiceDeleteButton.disabled = false;

// إخفاء زر الإرسال الصوتي المنفصل
voiceSendButton.hidden = true;

        voiceRecordingStatus.textContent =
            "🔴 جاري التسجيل... اضغط إرسال عند الانتهاء.";

    } catch (error) {
        console.error("Department voice start error:", error);

        departmentVoiceStream?.getTracks().forEach(track => track.stop());
        departmentVoiceStream = null;

        departmentVoiceRecorder = null;
        departmentVoiceChunks = [];
        departmentVoiceReadyToSend = false;

        voiceRecordButton.hidden = false;
        voiceRecordButton.disabled = false;

        voiceDeleteButton.hidden = true;
        voiceSendButton.hidden = true;

        voiceRecordingStatus.textContent =
            error.message || "تعذر بدء تسجيل الصوت.";

    } finally {
        departmentVoiceStarting = false;
    }
});


// حذف التسجيل وإلغاءه
voiceDeleteButton.addEventListener("click", () => {
    if (departmentVoiceSending) return;

    departmentVoiceCancelled = true;
    departmentVoiceReadyToSend = false;

    const recorder = departmentVoiceRecorder;

    if (recorder && recorder.state !== "inactive") {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.stop();
    }

    departmentVoiceStream?.getTracks().forEach(track => track.stop());

    departmentVoiceStream = null;
    departmentVoiceRecorder = null;
    departmentVoiceChunks = [];

    voiceRecordButton.hidden = false;
    voiceRecordButton.disabled = false;

    voiceDeleteButton.hidden = true;
    voiceSendButton.hidden = true;

    voiceDeleteButton.disabled = false;
    voiceSendButton.disabled = false;

    voiceRecordingStatus.textContent = "🗑️ تم إلغاء التسجيل.";
});


// إرسال التسجيل إلى Cloudinary ثم حفظ بياناته في Firestore
voiceSendButton.addEventListener("click", async () => {
    if (departmentVoiceSending) return;

    if (departmentVoiceRecorder?.state === "recording") {
        const recorder = departmentVoiceRecorder;

        departmentVoiceSending = true;
        voiceSendButton.disabled = true;
        voiceDeleteButton.disabled = true;

        voiceRecordingStatus.textContent = "⏳ جاري تجهيز التسجيل...";

        recorder.addEventListener("stop", async () => {
            departmentVoiceSending = false;
            await sendDepartmentVoice();
        }, { once: true });

        recorder.stop();
        return;
    }

    if (!departmentVoiceReadyToSend || !departmentVoiceChunks.length) {
        voiceRecordingStatus.textContent =
            "لا يوجد تسجيل صوتي جاهز للإرسال.";
        return;
    }

    await sendDepartmentVoice();
});


// رفع التسجيل وحفظ الرسالة
async function sendDepartmentVoice() {


    departmentVoiceSending = true;
    voiceSendButton.disabled = true;
    voiceDeleteButton.disabled = true;

    try {
        const user = auth.currentUser;

        if (!user) {
            throw new Error("انتهت جلسة تسجيل الدخول. سجّل الدخول مجددًا.");
        }

        if (!departmentVoiceChunks.length) {
            throw new Error("التسجيل فارغ.");
        }

        const mimeType =
            departmentVoiceRecorder?.mimeType ||
            departmentVoiceChunks[0]?.type ||
            "audio/webm";

        const audioBlob = new Blob(departmentVoiceChunks, {
            type: mimeType
        });

        if (!audioBlob.size) {
            throw new Error("التسجيل فارغ.");
        }

        if (audioBlob.size > 25 * 1024 * 1024) {
            throw new Error("حجم التسجيل أكبر من 25 ميجابايت.");
        }

        const extension = mimeType.includes("ogg") ? "ogg" : "webm";

        const audioFile = new File(
            [audioBlob],
            `department_voice_${Date.now()}.${extension}`,
            { type: mimeType }
        );

        // الحصول على اسم المرسل
        let senderName = "عضو الفريق";

        const membersSnapshot = await getDocs(
            collection(db, "departments", departmentId, "members")
        );

        const currentMember = membersSnapshot.docs.find(
            memberDoc => memberDoc.id === user.uid
        );

        if (currentMember) {
            const memberData = currentMember.data();

            if (typeof memberData.name === "string" && memberData.name.trim()) {
                senderName = memberData.name.trim();
            }
        } else if (currentCompany.userRole === "owner") {
            senderName = "مدير الشركة";
        } else {
            throw new Error("لم نتمكن من التحقق من عضويتك في القسم.");
        }

        // رفع الصوت إلى Cloudinary
        const cloudName = "h5h5n2b0";
        const uploadPreset = "tamny_uploads";

        const uploadURL =
            `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

        const formData = new FormData();

        formData.append("file", audioFile);
        formData.append("upload_preset", uploadPreset);
        formData.append("folder", "smart-company/department-voice");

        voiceRecordingStatus.textContent = "☁️ جاري رفع التسجيل...";

        const response = await fetch(uploadURL, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const errorDetails = await response.text();

            console.error("Cloudinary upload error:", errorDetails);

            throw new Error("تعذر رفع التسجيل الصوتي.");
        }

        const cloudinaryData = await response.json();

        if (!cloudinaryData.secure_url) {
            throw new Error("لم يُرجع Cloudinary رابط التسجيل.");
        }

        // حفظ بيانات الرسالة الصوتية
        voiceRecordingStatus.textContent =
            "💬 جاري حفظ الرسالة...";

        await addDoc(departmentMessagesRef, {
            text: "",
            type: "audio",
            fileURL: cloudinaryData.secure_url,
            fileName: audioFile.name,
            fileType: audioFile.type,
            fileSize: audioFile.size,
            senderId: user.uid,
            senderName,
            createdAt: serverTimestamp()
        });

        voiceRecordingStatus.textContent =
            "✅ تم إرسال التسجيل الصوتي.";

        resetDepartmentVoiceControls();

    } catch (error) {
        console.error("Department voice send error:", error);

        voiceRecordingStatus.textContent =
            error.message || "تعذر إرسال التسجيل الصوتي.";

        voiceSendButton.disabled = false;
        voiceDeleteButton.disabled = false;

    } finally {
        departmentVoiceSending = false;
    }
}


// إعادة واجهة الصوت إلى حالتها الأصلية
function resetDepartmentVoiceControls() {
    departmentVoiceStream?.getTracks().forEach(track => track.stop());

    departmentVoiceStream = null;
    departmentVoiceRecorder = null;
    departmentVoiceChunks = [];

    departmentVoiceReadyToSend = false;
    departmentVoiceCancelled = false;

    voiceRecordButton.hidden = false;
    voiceRecordButton.disabled = false;

    voiceDeleteButton.hidden = true;
    voiceSendButton.hidden = true;

    voiceDeleteButton.disabled = false;
    voiceSendButton.disabled = false;
}


// مراجع سريعة لمناطق القسم
const departmentMembersSection = document.createElement("section");
const departmentTasksSection = document.createElement("section");

departmentMembersSection.id = "department-members-section";
departmentTasksSection.id = "department-tasks-section";

showMembersButton.addEventListener("click", () => {
    departmentMembersSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
    departmentMenu.style.display = "none";
    departmentMenuButton.setAttribute("aria-expanded", "false");
});

showTasksButton.addEventListener("click", () => {
    departmentTasksSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
    departmentMenu.style.display = "none";
    departmentMenuButton.setAttribute("aria-expanded", "false");
});



// نموذج إنشاء مهمة من داخل القسم
const createTaskTitle = document.createElement("h3");
createTaskTitle.textContent = "➕ إنشاء مهمة جديدة";

const taskTitleInput = document.createElement("input");
taskTitleInput.type = "text";
taskTitleInput.placeholder = "عنوان المهمة";
taskTitleInput.maxLength = 120;
taskTitleInput.required = true;
taskTitleInput.style.cssText =
    "display:block;width:100%;max-width:450px;padding:12px;margin:8px 0;";

const taskDescriptionInput = document.createElement("textarea");
taskDescriptionInput.placeholder = "وصف المهمة";
taskDescriptionInput.style.cssText =
    "display:block;width:100%;max-width:450px;padding:12px;margin:8px 0;";

const taskDueDateInput = document.createElement("input");
taskDueDateInput.type = "date";
taskDueDateInput.style.cssText =
    "display:block;padding:12px;margin:8px 0;";

const taskProjectSelect = document.createElement("select");
taskProjectSelect.style.cssText =
    "display:block;width:100%;max-width:450px;padding:12px;margin:8px 0;";

const projectDefaultOption = document.createElement("option");
projectDefaultOption.value = "";
projectDefaultOption.textContent = "اختر المشروع";
taskProjectSelect.appendChild(projectDefaultOption);

const taskEmployeesTitle = document.createElement("h4");
taskEmployeesTitle.textContent = "👥 إسناد المهمة للموظفين";

const taskEmployeesList = document.createElement("div");
taskEmployeesList.textContent = "جارٍ تحميل أعضاء القسم...";

const taskForm = document.createElement("div");
taskForm.className = "department-task-form";

const createTaskButton = document.createElement("button");
createTaskButton.type = "button";
createTaskButton.className = "back-button";
createTaskButton.textContent = "إنشاء المهمة";

const createTaskMessage = document.createElement("p");
createTaskMessage.setAttribute("role", "status");

    const membersTitle = document.createElement("h3");
    membersTitle.textContent = "👥 أعضاء القسم";

const tasksTitle = document.createElement("h3");
tasksTitle.textContent = "📋 مهام القسم";

const departmentTasksList = document.createElement("div");
departmentTasksList.className = "project-list";
departmentTasksList.textContent = "جارٍ تحميل مهام القسم...";

const departmentTasksPanel = document.createElement("section");
departmentTasksPanel.className = "department-tasks-panel";

departmentTasksPanel.append(
    tasksTitle,
    departmentTasksList
);

openTasksCard.addEventListener("click", () => {
    showDepartmentWorkspace(
        departmentTasksPanel,
        "📋 مهام القسم"
    );
});

    const membersList = document.createElement("div");
    membersList.className = "project-list";
    membersList.textContent = "جارٍ تحميل أعضاء القسم...";

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "back-button";
    backButton.textContent = "→ العودة إلى الأقسام";
    backButton.addEventListener("click", showDepartments);

taskForm.append(
    createTaskTitle,
    taskTitleInput,
    taskDescriptionInput,
    taskDueDateInput,
    taskProjectSelect,
    taskEmployeesTitle,
    taskEmployeesList,
    createTaskButton,
    createTaskMessage
);

openCreateTaskCard.addEventListener("click", () => {
    showDepartmentWorkspace(
        taskForm,
        "➕ إنشاء مهمة جديدة"
    );
});






departmentToolbar.append(departmentMenuButton);

departmentWorkspace.hidden = true;

panel.append(
    title,
    description,
    departmentToolbar,
    departmentMenu,
    departmentHome,
    departmentWorkspace,
    departmentMembersSection,
    membersTitle,
    membersList,
    departmentTasksSection,
    backButton
);



    const projectsSnapshot = await getDocs(
    collection(db, "companies", currentCompany.id, "projects")
);

projectsSnapshot.forEach((projectDoc) => {
    const project = projectDoc.data();

    const option = document.createElement("option");
    option.value = projectDoc.id;
    option.textContent = project.name || "مشروع بدون اسم";

    taskProjectSelect.appendChild(option);
});

departmentTasksList.replaceChildren();

let taskCount = 0;

for (const projectDoc of projectsSnapshot.docs) {
    const tasksSnapshot = await getDocs(
        collection(
            db,
            "companies",
            currentCompany.id,
            "projects",
            projectDoc.id,
            "tasks"
        )
    );


tasksSnapshot.forEach((taskDoc) => {
    const task = taskDoc.data();

    if (task.departmentId !== departmentId) return;

    taskCount++;

    const taskItem = document.createElement("div");
    taskItem.className = "project-card";

    const taskName = document.createElement("h4");
    taskName.textContent = `📌 ${task.title || "مهمة بدون عنوان"}`;

    const statusNames = {
        pending: "⏳ قيد الانتظار",
        in_progress: "🔄 قيد التنفيذ",
        completed: "✅ مكتملة"
    };

    const taskStatus = document.createElement("p");
    taskStatus.textContent =
        `الحالة: ${statusNames[task.status] || "غير محددة"}`;

    const assignedItem = document.createElement("p");
    assignedItem.textContent =
        `👤 الموظف المسؤول: ${task.assignedTo || "غير محدد"}`;

    taskItem.append(taskName, taskStatus, assignedItem);
    departmentTasksList.appendChild(taskItem);
});


}

if (taskCount === 0) {
    departmentTasksList.textContent =
        "لا توجد مهام مرتبطة بهذا القسم حاليًا.";
}

    content.appendChild(panel);

    try {
        const membersSnapshot = await getDocs(
            collection(db, "departments", departmentId, "members")
        );

        if (!panel.isConnected) return;

        membersList.replaceChildren();

        if (membersSnapshot.empty) {
            membersList.textContent =
                "لا يوجد أعضاء في هذا القسم حتى الآن.";
           
                taskEmployeesList.textContent =
    "لا يوجد أعضاء في هذا القسم لإسناد المهام إليهم.";
           
                return;
        }

        for (const memberDoc of membersSnapshot.docs) {
const memberData = memberDoc.data();

const employeeName =
    typeof memberData.name === "string" && memberData.name.trim()
        ? memberData.name.trim()
        : `موظف ${memberDoc.id.slice(0, 6)}`;

            const memberItem = document.createElement("p");
            memberItem.textContent =
                `👤 ${employeeName || "موظف بدون اسم"}`;

            membersList.appendChild(memberItem);

            const employeeOption = document.createElement("label");


employeeOption.className = "department-task-employee-option";


const employeeCheckbox = document.createElement("input");



employeeCheckbox.type = "checkbox";



employeeCheckbox.value = memberDoc.id;



employeeCheckbox.className = "department-task-employee";



const employeeLabel = document.createElement("span");



employeeLabel.textContent =



    employeeName || "موظف بدون اسم";



employeeOption.append(employeeCheckbox, employeeLabel);



taskEmployeesList.appendChild(employeeOption);
        }
    } catch (error) {
        console.error(
            "Load department details error:",
            error.code,
            error.message
        );

        membersList.textContent =
            `تعذر تحميل الأعضاء: ${error.code || error.message}`;
    }

    createTaskButton.addEventListener("click", async () => {
    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    const dueDate = taskDueDateInput.value;
    const projectId = taskProjectSelect.value;

    const selectedEmployees = [
        ...taskEmployeesList.querySelectorAll(
            ".department-task-employee:checked"
        )
    ].map((checkbox) => checkbox.value);

   if (
    !["owner", "junior_manager"].includes(
        currentCompany.userRole
    )
) {
    createTaskMessage.textContent =
        "ليس لديك صلاحية إنشاء المهام.";
    return;
}

    if (!title || title.length < 2) {
        createTaskMessage.textContent =
            "اكتب عنوان المهمة، ويجب ألا يقل عن حرفين.";
        return;
    }

    if (!projectId) {
        createTaskMessage.textContent =
            "اختر المشروع الذي ستُحفظ المهمة بداخله.";
        return;
    }

    if (selectedEmployees.length === 0) {
        createTaskMessage.textContent =
            "اختر موظفًا واحدًا على الأقل.";
        return;
    }

    createTaskButton.disabled = true;
    createTaskMessage.textContent = "جارٍ إنشاء المهام...";

    try {
        const departmentMembersSnapshot = await getDocs(
            collection(db, "departments", departmentId, "members")
        );

        const validMemberIds = new Set(
            departmentMembersSnapshot.docs.map((item) => item.id)
        );

        if (
            selectedEmployees.some(
                (employeeId) => !validMemberIds.has(employeeId)
            )
        ) {
            throw new Error(
                "يوجد موظف مختار غير مسجل في هذا القسم."
            );
        }

        const tasksRef = collection(
            db,
            "companies",
            currentCompany.id,
            "projects",
            projectId,
            "tasks"
        );

    await addDoc(tasksRef, {
    title,
    description,
    departmentId,
    departmentName,
    assignedTo: selectedEmployees[0],
    assignedToList: selectedEmployees,
    dueDate,
    status: "pending",
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp()
});

        createTaskMessage.textContent =
            `✅ تم إنشاء ${selectedEmployees.length} مهمة بنجاح.`;

        taskTitleInput.value = "";
        taskDescriptionInput.value = "";
        taskDueDateInput.value = "";

        taskEmployeesList
            .querySelectorAll(".department-task-employee")
            .forEach((checkbox) => {
                checkbox.checked = false;
            });

        await openDepartmentDetails(departmentId, departmentName);

    } catch (error) {
        console.error(
            "Create department task error:",
            error.code,
            error.message
        );

        createTaskMessage.textContent =
            error.code === "permission-denied"
                ? "رفضت قواعد Firestore إنشاء المهمة. راجع صلاحيات إنشاء المهام."
                : `تعذر إنشاء المهمة: ${error.message}`;
    } finally {
        createTaskButton.disabled = false;
    }
});

}
// ==========================================
// عرض جميع مهام الشركة
// ==========================================


async function showTasks() {
    if (!currentCompany || !auth.currentUser) return;

    const currentUserId = auth.currentUser.uid;
    const companyId = currentCompany.id;

    content.replaceChildren();

    // ذاكرة مؤقتة للمهام حتى تظهر فورًا عند فتح القسم مرة أخرى
    if (!showTasks.tasksCache) {
        showTasks.tasksCache = new Map();
    }

    const cacheKey = `${companyId}_${currentUserId}`;
    const tasksCache = showTasks.tasksCache;

    // ============================================================
    // إعداد الصفحة
    // ============================================================

    const panel = document.createElement("section");
    panel.className = "welcome tasks-page";

    const title = document.createElement("h2");
    title.textContent = "📋 إدارة المهام";

    const description = document.createElement("p");
    description.textContent = "اختر نوع المهام التي تريد عرضها.";

    const menu = document.createElement("div");
    menu.className = "tasks-menu";

    const generalButton = document.createElement("button");
    generalButton.type = "button";
    generalButton.className = "tasks-menu-card tasks-general-card";
    generalButton.innerHTML = `
        <span class="tasks-menu-icon">📋</span>
        <span class="tasks-menu-title">المهام العامة</span>
        <span class="tasks-menu-description">عرض المهام العامة في الشركة</span>
    `;

    const myTasksButton = document.createElement("button");
    myTasksButton.type = "button";
    myTasksButton.className = "tasks-menu-card tasks-personal-card";
    myTasksButton.innerHTML = `
        <span class="tasks-menu-icon">👤</span>
        <span class="tasks-menu-title">إدارة مهامي</span>
        <span class="tasks-menu-description">مهامي ومهام قسمي مع إمكانية تغيير الحالة</span>
    `;

    const createTaskButton = document.createElement("button");
    createTaskButton.type = "button";
    createTaskButton.className = "tasks-menu-card tasks-create-card";
    createTaskButton.innerHTML = `
        <span class="tasks-menu-icon">➕</span>
        <span class="tasks-menu-title">إنشاء مهمة جديدة</span>
        <span class="tasks-menu-description">أنشئ مهمة لموظف محدد أو لقسم داخل الشركة.</span>
    `;

    menu.append(generalButton, myTasksButton, createTaskButton);

    const listSection = document.createElement("section");
    listSection.className = "tasks-list-section";
    listSection.hidden = true;

    const listHeader = document.createElement("div");
    listHeader.className = "tasks-list-header";

    const listTitle = document.createElement("h3");

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "tasks-back-button";
    backButton.textContent = "← رجوع";

    backButton.addEventListener("click", () => {
        listSection.hidden = true;
        menu.hidden = false;
    });

    listHeader.append(listTitle, backButton);

    const tasksContainer = document.createElement("div");
    tasksContainer.className = "tasks-grid";

    const loadingMessage = document.createElement("p");
    loadingMessage.className = "tasks-message";
    loadingMessage.hidden = true;

    listSection.append(listHeader, loadingMessage, tasksContainer);
    panel.append(title, description, menu, listSection);
    content.appendChild(panel);

    // ============================================================
    // تحميل المهام والأقسام
    // ============================================================

    async function fetchAllTasksAndDepartments() {
        const projectsSnapshot = await getDocs(
            collection(db, "companies", companyId, "projects")
        );

        const allTasks = [];

        // تحميل مهام المشاريع بالتوازي بدل انتظار كل مشروع منفردًا
        const projectResults = await Promise.all(
            projectsSnapshot.docs.map(async (projectDoc) => {
                try {
                    const tasksSnapshot = await getDocs(
                        collection(
                            db,
                            "companies",
                            companyId,
                            "projects",
                            projectDoc.id,
                            "tasks"
                        )
                    );

                    return tasksSnapshot.docs.map((taskDoc) => ({
                        id: taskDoc.id,
                        projectId: projectDoc.id,
                        projectName:
                            projectDoc.data().name || "مشروع بدون اسم",
                        ...taskDoc.data()
                    }));
                } catch (error) {
                    console.error(
                        `تعذر تحميل مهام المشروع ${projectDoc.id}:`,
                        error
                    );
                    return [];
                }
            })
        );

        for (const projectTasks of projectResults) {
            allTasks.push(...projectTasks);
        }

        const myDepartmentIds = new Set();

        try {
            const departmentsSnapshot = await getDocs(
                query(
                    collection(db, "departments"),
                    where("companyId", "==", companyId)
                )
            );

            const departmentMemberships = await Promise.all(
                departmentsSnapshot.docs.map(async (departmentDoc) => {
                    try {
                        const memberSnapshot = await getDoc(
                            doc(
                                db,
                                "departments",
                                departmentDoc.id,
                                "members",
                                currentUserId
                            )
                        );

                        return memberSnapshot.exists()
                            ? departmentDoc.id
                            : null;
                    } catch (error) {
                        console.error(
                            "تعذر التحقق من عضوية القسم:",
                            error
                        );
                        return null;
                    }
                })
            );

            departmentMemberships.forEach((departmentId) => {
                if (departmentId) {
                    myDepartmentIds.add(departmentId);
                }
            });
        } catch (error) {
            console.error("تعذر تحميل أقسام الموظف:", error);
        }

        return { allTasks, myDepartmentIds };
    }

    // ============================================================
    // عرض المهام
    // ============================================================

    function renderTasksFromData(mode, data) {
        if (!panel.isConnected) return;

        const { allTasks, myDepartmentIds } = data;

        tasksContainer.replaceChildren();

        let filteredTasks;

        if (mode === "general") {
            filteredTasks = allTasks;
        } else {
            filteredTasks = allTasks.filter((task) => {
                const departmentId = task.departmentId || "";

                const assignedIds = [
                    ...(Array.isArray(task.assignedToList)
                        ? task.assignedToList
                        : []),
                    task.assignedTo
                ].filter(Boolean);

                return (
                    assignedIds.includes(currentUserId) ||
                    (
                        Boolean(departmentId) &&
                        myDepartmentIds.has(departmentId)
                    )
                );
            });
        }

        if (filteredTasks.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "tasks-empty";
            emptyMessage.textContent =
                mode === "general"
                    ? "لا توجد مهام عامة حاليًا."
                    : "لا توجد مهام مسندة إليك أو إلى أقسامك حاليًا.";

            tasksContainer.appendChild(emptyMessage);
            return;
        }

        for (const task of filteredTasks) {
            const taskCard = document.createElement("article");
            taskCard.className = "tasks-item-card";

            const projectLabel = document.createElement("p");
            projectLabel.className = "tasks-project-label";
            projectLabel.textContent =
                `📁 المشروع: ${task.projectName}`;

            const taskTitle = document.createElement("h3");
            taskTitle.textContent = task.title || "مهمة بدون اسم";

            const departmentLabel = document.createElement("p");
            departmentLabel.className = "tasks-assignee-label";

            if (task.departmentId) {
                departmentLabel.textContent =
                    `🏢 القسم: ${task.departmentName?.trim() || "قسم غير محدد"}`;
            } else if (
                task.assignedTo ||
                task.assignedToList?.length
            ) {
                const employeeId =
                    task.assignedTo || task.assignedToList[0];

                departmentLabel.textContent =
                    `👤 الموظف المسؤول: ${employeeId}`;

                getDoc(
                    doc(
                        db,
                        "companies",
                        companyId,
                        "members",
                        employeeId
                    )
                )
                    .then((employeeSnapshot) => {
                        if (!employeeSnapshot.exists()) return;
                        if (!departmentLabel.isConnected) return;

                        const employee = employeeSnapshot.data();

                        departmentLabel.textContent =
                            `👤 الموظف المسؤول: ${
                                employee.name?.trim() ||
                                employee.email?.trim() ||
                                employeeId
                            }`;
                    })
                    .catch(() => {});
            } else {
                departmentLabel.textContent = "🌐 مهمة عامة";
            }

            const statusNames = {
                pending: "قيد الانتظار",
                in_progress: "قيد التنفيذ",
                completed: "مكتملة"
            };

            const statusLabel = document.createElement("p");
            statusLabel.className = "tasks-status-label";

            function updateStatusLabel() {
                statusLabel.textContent =
                    `📊 الحالة: ${statusNames[task.status] || "غير محددة"}`;

                statusLabel.dataset.status =
                    task.status || "unknown";
            }

            updateStatusLabel();

            const details = document.createElement("div");
            details.className = "tasks-item-details";
            details.hidden = true;

            const taskDescription = document.createElement("p");
            taskDescription.textContent =
                `📝 الوصف: ${task.description?.trim() || "لا يوجد وصف للمهمة."}`;

            const dueDate = document.createElement("p");
            dueDate.textContent =
                `📅 موعد التسليم: ${task.dueDate || "غير محدد"}`;

            const createdAtLabel = document.createElement("p");
            let createdAtText = "غير مسجل";

            if (task.createdAt) {
                const createdAtDate =
                    typeof task.createdAt.toDate === "function"
                        ? task.createdAt.toDate()
                        : new Date(task.createdAt);

                if (!Number.isNaN(createdAtDate.getTime())) {
                    const date = createdAtDate.toLocaleDateString(
                        "en-GB",
                        {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                        }
                    );

                    const time = createdAtDate.toLocaleTimeString(
                        "en-US",
                        {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true
                        }
                    );

                    createdAtText = `${date} ${time}`;
                }
            }

            createdAtLabel.textContent =
                `🕒 تاريخ ووقت إنشاء المهمة: ${createdAtText}`;

            details.append(
                taskDescription,
                dueDate,
                createdAtLabel
            );

            const detailsButton = document.createElement("button");
            detailsButton.type = "button";
            detailsButton.className = "tasks-action-button";
            detailsButton.textContent = "🔎 عرض التفاصيل";

            detailsButton.addEventListener("click", () => {
                details.hidden = !details.hidden;
                detailsButton.textContent = details.hidden
                    ? "🔎 عرض التفاصيل"
                    : "إخفاء التفاصيل";
            });

            taskCard.append(
                projectLabel,
                departmentLabel,
                taskTitle,
                statusLabel,
                detailsButton,
                details
            );

            if (mode === "mine") {
                const statusSelect = document.createElement("select");
                statusSelect.className = "tasks-status-select";
                statusSelect.setAttribute(
                    "aria-label",
                    `تغيير حالة المهمة ${task.title || ""}`
                );

                const statusOptions = {
                    pending: "⏳ قيد الانتظار",
                    in_progress: "🔄 قيد التنفيذ",
                    completed: "✅ مكتملة"
                };

                for (const [value, label] of Object.entries(statusOptions)) {
                    statusSelect.add(new Option(label, value));
                }

                statusSelect.value =
                    statusNames[task.status] ? task.status : "pending";

                statusSelect.addEventListener("change", async () => {
                    const newStatus = statusSelect.value;
                    statusSelect.disabled = true;

                    try {
                        await updateDoc(
                            doc(
                                db,
                                "companies",
                                companyId,
                                "projects",
                                task.projectId,
                                "tasks",
                                task.id
                            ),
                            { status: newStatus }
                        );

                        task.status = newStatus;
                        updateStatusLabel();

                        // تحديث المهمة في الذاكرة المؤقتة أيضًا
                        const cachedData = tasksCache.get(cacheKey);

                        if (cachedData) {
                            const cachedTask = cachedData.allTasks.find(
                                (item) =>
                                    item.id === task.id &&
                                    item.projectId === task.projectId
                            );

                            if (cachedTask) {
                                cachedTask.status = newStatus;
                            }
                        }
                    } catch (error) {
                        console.error(
                            "Update task status error:",
                            error
                        );

                        alert("تعذر تحديث حالة المهمة.");
                        statusSelect.value = task.status || "pending";
                    } finally {
                        statusSelect.disabled = false;
                    }
                });

                taskCard.appendChild(statusSelect);
            }

            tasksContainer.appendChild(taskCard);
        }
    }

    async function renderTasks(mode) {
        menu.hidden = true;
        listSection.hidden = false;
        tasksContainer.replaceChildren();

        // لا تعرض رسالة تحميل المهام
        loadingMessage.hidden = true;

        listTitle.textContent =
            mode === "general"
                ? "📋 المهام العامة"
                : "👤 إدارة مهامي";

        // عرض البيانات المحفوظة فورًا إذا كانت متاحة
        const cachedData = tasksCache.get(cacheKey);

        if (cachedData) {
            renderTasksFromData(mode, cachedData);
        }

        try {
            const freshData = await fetchAllTasksAndDepartments();

            if (!panel.isConnected) return;

            tasksCache.set(cacheKey, freshData);

            // تحديث العرض في الخلفية دون رسالة تحميل
            renderTasksFromData(mode, freshData);
        } catch (error) {
            console.error("Render tasks error:", error);

            if (!cachedData) {
                const errorMessage = document.createElement("p");
                errorMessage.className = "tasks-message";
                errorMessage.textContent =
                    "تعذر تحميل المهام. تحقق من الاتصال والصلاحيات.";

                tasksContainer.replaceChildren(errorMessage);
            }
        }
    }

    // ============================================================
    // إنشاء مهمة جديدة
    // ============================================================

    createTaskButton.addEventListener("click", async () => {
        if (
            !["owner", "junior_manager", "team_leader"]
                .includes(currentCompany.userRole)
        ) {
            alert("ليس لديك صلاحية إنشاء المهام.");
            return;
        }

        menu.hidden = true;
        listSection.hidden = false;
        tasksContainer.replaceChildren();
        loadingMessage.hidden = true;

        listTitle.textContent = "➕ إنشاء مهمة جديدة";

        const form = document.createElement("form");
        form.className = "department-task-form";

        const formTitle = document.createElement("h3");
        formTitle.textContent = "📝 بيانات المهمة";

        const taskTitleInput = document.createElement("input");
        taskTitleInput.type = "text";
        taskTitleInput.placeholder = "عنوان المهمة";
        taskTitleInput.maxLength = 120;
        taskTitleInput.required = true;

        const taskDescriptionInput = document.createElement("textarea");
        taskDescriptionInput.placeholder = "وصف المهمة";
        taskDescriptionInput.maxLength = 5000;

        const taskDueDateInput = document.createElement("input");
        taskDueDateInput.type = "date";
        taskDueDateInput.setAttribute("aria-label", "موعد التسليم");

        const projectSelect = document.createElement("select");
        projectSelect.required = true;
        projectSelect.add(
            new Option("اختر المشروع", "")
        );

        const assignmentType = document.createElement("select");
        assignmentType.setAttribute(
            "aria-label",
            "نوع إسناد المهمة"
        );
        assignmentType.add(new Option("اختر نوع الإسناد", ""));
        assignmentType.add(new Option("👤 موظف محدد", "employee"));
        assignmentType.add(new Option("🏢 قسم كامل", "department"));
        assignmentType.required = true;

        const assigneeSelect = document.createElement("select");
        assigneeSelect.required = true;
        assigneeSelect.hidden = true;

        const saveButton = document.createElement("button");
        saveButton.type = "submit";
        saveButton.className = "back-button";
        saveButton.textContent = "إنشاء المهمة";
        saveButton.disabled = true;

        const message = document.createElement("p");
        message.className = "tasks-message";

        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.className = "tasks-back-button";
        cancelButton.textContent = "إلغاء";

        cancelButton.addEventListener("click", () => {
            listSection.hidden = true;
            menu.hidden = false;
        });

        form.append(
            formTitle,
            taskTitleInput,
            taskDescriptionInput,
            taskDueDateInput,
            projectSelect,
            assignmentType,
            assigneeSelect,
            saveButton,
            message,
            cancelButton
        );

        tasksContainer.appendChild(form);

        let employees = [];
        let departments = [];

        try {
            const [
                projectsSnapshot,
                membersSnapshot,
                departmentsSnapshot
            ] = await Promise.all([
                getDocs(
                    collection(db, "companies", companyId, "projects")
                ),
                getDocs(
                    collection(db, "companies", companyId, "members")
                ),
                getDocs(
                    query(
                        collection(db, "departments"),
                        where("companyId", "==", companyId)
                    )
                )
            ]);

            if (!form.isConnected) return;

            for (const projectDoc of projectsSnapshot.docs) {
                const project = projectDoc.data();

                projectSelect.add(
                    new Option(
                        project.name || "مشروع بدون اسم",
                        projectDoc.id
                    )
                );
            }

            employees = membersSnapshot.docs
                .filter((memberDoc) => memberDoc.id !== currentUserId)
                .map((memberDoc) => {
                    const member = memberDoc.data();

                    return {
                        uid: memberDoc.id,
                        ...member,
                        name:
                            member.name?.trim() ||
                            member.email?.trim() ||
                            memberDoc.id
                    };
                });

            departments = departmentsSnapshot.docs
                .filter(
                    (departmentDoc) =>
                        departmentDoc.data().companyId === companyId
                )
                .map((departmentDoc) => ({
                    id: departmentDoc.id,
                    ...departmentDoc.data()
                }));

            saveButton.disabled = false;
        } catch (error) {
            console.error("Load task form data error:", error);
            message.textContent = "تعذر تحميل بيانات النموذج.";
            return;
        }

        function refreshAssigneeOptions() {
            assigneeSelect.replaceChildren();
            assigneeSelect.hidden = !assignmentType.value;

            if (!assignmentType.value) {
                assigneeSelect.required = false;
                return;
            }

            assigneeSelect.required = true;

            assigneeSelect.add(
                new Option(
                    assignmentType.value === "employee"
                        ? "اختر الموظف المسؤول"
                        : "اختر القسم",
                    ""
                )
            );

            const options =
                assignmentType.value === "employee"
                    ? employees.map((employee) => ({
                        id: employee.uid,
                        name: employee.name
                    }))
                    : departments.map((department) => ({
                        id: department.id,
                        name: department.name?.trim() || "قسم بدون اسم"
                    }));

            for (const item of options) {
                assigneeSelect.add(
                    new Option(item.name, item.id)
                );
            }
        }

        assignmentType.addEventListener(
            "change",
            refreshAssigneeOptions
        );

        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const titleVal = taskTitleInput.value.trim();
            const descVal = taskDescriptionInput.value.trim();
            const projectId = projectSelect.value;
            const type = assignmentType.value;
            const assigneeId = assigneeSelect.value;

            if (titleVal.length < 2) {
                message.textContent =
                    "اكتب عنوانًا للمهمة يتكون من حرفين على الأقل.";
                return;
            }

            if (!projectId || !type || !assigneeId) {
                message.textContent =
                    "أكمل اختيار المشروع ونوع الإسناد والجهة المسؤولة.";
                return;
            }

            saveButton.disabled = true;
            message.textContent = "جارٍ إنشاء المهمة...";

            try {
                const taskData = {
                    title: titleVal,
                    description: descVal,
                    dueDate: taskDueDateInput.value || "",
                    status: "pending",
                    createdBy: currentUserId,
                    createdAt: serverTimestamp()
                };

                if (type === "employee") {
                    taskData.assignedTo = assigneeId;
                    taskData.assignedToList = [assigneeId];
                    taskData.departmentId = "";
                    taskData.departmentName = "";
                } else {
                    const selectedDepartment = departments.find(
                        (department) => department.id === assigneeId
                    );

                    taskData.departmentId = assigneeId;
                    taskData.departmentName =
                        selectedDepartment?.name || "";
                    taskData.assignedTo = "";
                    taskData.assignedToList = [];
                }

                const taskRef = await addDoc(
                    collection(
                        db,
                        "companies",
                        companyId,
                        "projects",
                        projectId,
                        "tasks"
                    ),
                    taskData
                );

                message.textContent = "✅ تم إنشاء المهمة بنجاح.";

                // تحديث الذاكرة وإظهار المهمة فورًا في المرة التالية
                tasksCache.delete(cacheKey);

                form.reset();
                refreshAssigneeOptions();

                console.log("Task created:", taskRef.id);
            } catch (error) {
                console.error("Create task error:", error);

                message.textContent =
                    "فشل إنشاء المهمة: " +
                    (error.message || "خطأ غير معروف");
            } finally {
                saveButton.disabled = false;
            }
        });
    });

    // ربط أزرار القائمة
    generalButton.addEventListener("click", () => {
        renderTasks("general");
    });

    myTasksButton.addEventListener("click", () => {
        renderTasks("mine");
    });
}



// ============================================
// 👔 الإدارة والترقيات
// ============================================

async function showManagement() {
    if (!currentCompany || !auth.currentUser) return;

    const role = currentCompany.userRole;

    // الإدارة متاحة للمالك والمدير الصغير فقط.
    if (!["owner", "junior_manager"].includes(role)) {
        showError("ليس لديك صلاحية الوصول إلى قسم الإدارة.");
        return;
    }

    content.replaceChildren();

    const panel = document.createElement("section");
    panel.className = "welcome";

    const title = document.createElement("h2");
    title.textContent = "👔 الإدارة والترقيات";

    const description = document.createElement("p");
    description.textContent =
        role === "owner"
            ? "إدارة المناصب الإدارية وترقية الموظفين."
            : "ترقية الموظفين إلى رؤساء أقسام.";

    const message = document.createElement("p");
    message.setAttribute("role", "status");
    message.textContent = "جارٍ تحميل الموظفين...";

    const employeeList = document.createElement("div");

    panel.append(title, description, message, employeeList);
    content.appendChild(panel);

    try {
        const membersRef = collection(
            db,
            "companies",
            currentCompany.id,
            "members"
        );

        const snapshot = await getDocs(membersRef);

        if (!panel.isConnected) return;

        employeeList.replaceChildren();

        if (snapshot.empty) {
            message.textContent = "لا يوجد موظفون في الشركة حتى الآن.";
            return;
        }

        message.textContent = "";


        
snapshot.forEach((memberDocument) => {
    const member = memberDocument.data();
    const memberId = memberDocument.id;
    const memberRole = member.role || "employee";

    const card = document.createElement("article");
    card.className = "project-card";

    const name = document.createElement("h3");
    name.textContent =
        member.name ||
        member.displayName ||
        member.email ||
        "موظف بدون اسم";

    const roleLabel = document.createElement("p");

    const roleNames = {
        employee: "👨‍💻 موظف",
        team_leader: "🏢 رئيس قسم",
        junior_manager: "👔 مدير صغير"
    };

    roleLabel.textContent =
        `المنصب الحالي: ${roleNames[memberRole] || memberRole}`;

    card.append(name, roleLabel);

    // إنشاء مجموعة أزرار تغيير المنصب.
    const roleButtonsContainer = document.createElement("div");
  roleButtonsContainer.style.cssText = ` display: flex; flex-direction: row; flex-wrap: nowrap; align-items: center; gap: 5px; margin-top: 10px; width: 100%; `;

    // تحديد الأدوار التي يستطيع المستخدم الحالي تعيينها.
    const canManageRoles =
        role === "owner" ||
        role === "junior_manager";

    const roleOptions = [
        {
            value: "employee",
            label: "تحويل إلى موظف"
        },
        {
            value: "team_leader",
            label: "تحويل إلى رئيس قسم"
        },
        {
            value: "junior_manager",
            label: "تحويل إلى مدير صغير"
        }
    ];

    if (canManageRoles && memberRole !== "owner") {
        roleOptions.forEach((option) => {
            const roleButton = document.createElement("button");

            roleButton.type = "button";
            roleButton.className = "project-tasks-button";
            roleButton.textContent = option.label;

            // تعطيل الزر المطابق للمنصب الحالي.
            const isCurrentRole = memberRole === option.value;

            roleButton.disabled = isCurrentRole;

            if (isCurrentRole) {
                roleButton.style.opacity = "0.4";
                roleButton.style.cursor = "not-allowed";
                roleButton.style.filter = "grayscale(1)";
                roleButton.title = "هذا هو المنصب الحالي بالفعل";
            }

            // صلاحيات المالك والمدير الصغير.
            // المدير الصغير لا يستطيع تعيين مدير صغير آخر أو تغييره.
            if (
                role === "junior_manager" &&
                option.value === "junior_manager"
            ) {
                roleButton.disabled = true;
                roleButton.style.opacity = "0.4";
                roleButton.style.cursor = "not-allowed";
                roleButton.style.filter = "grayscale(1)";
                roleButton.title =
                    "تعيين المدير الصغير من صلاحيات مالك الشركة";
            }

            roleButton.addEventListener("click", async () => {
                if (roleButton.disabled) return;

                const targetRole = option.value;

                if (targetRole === memberRole) return;

                const confirmation = confirm(
                    `هل تريد تغيير منصب ${
                        member.name ||
                        member.displayName ||
                        member.email ||
                        "هذا الموظف"
                    } إلى: ${roleNames[targetRole]}؟`
                );

                if (!confirmation) return;

                // تعطيل الأزرار أثناء تنفيذ العملية لمنع التكرار.
                const buttons = roleButtonsContainer.querySelectorAll("button");

                buttons.forEach((button) => {
                    button.disabled = true;
                });

                try {
                    await updateDoc(
                        doc(
                            db,
                            "companies",
                            currentCompany.id,
                            "members",
                            memberId
                        ),
                        {
                            role: targetRole
                        }
                    );

                    alert("تم تغيير المنصب بنجاح.");

                    // إعادة تحميل الإدارة لإظهار المنصب والأزرار الجديدة.
                    await showManagement();

                } catch (error) {
                    console.error(
                        "Management role update error:",
                        error
                    );

                    alert(
                        "تعذر تغيير المنصب. تحقق من صلاحيات Firestore."
                    );

                    // إعادة تفعيل الأزرار إذا فشلت العملية.
                    buttons.forEach((button) => {
                        button.disabled = false;
                    });
                }
            });

            roleButtonsContainer.appendChild(roleButton);
        });

        card.appendChild(roleButtonsContainer);
    }

    employeeList.appendChild(card);
});



    } catch (error) {
        console.error("Load management error:", error);

       
    }
}


function showQACenter() {
    document.body.classList.remove("qa-analysis-fullscreen");
    content.replaceChildren();

    const panel = document.createElement("section");
    panel.className = "welcome qa-center-panel";
    panel.style.cssText = "padding:clamp(20px,3vw,34px);max-width:none;width:100%;box-sizing:border-box;min-height:60vh;";

    const heading = document.createElement("h2");
    heading.textContent = "🧪 QA Center";
    heading.style.cssText = "margin:0 0 8px;font-size:clamp(22px,2.5vw,30px);text-align:center;";

    const subtitle = document.createElement("p");
    subtitle.textContent = "مركز مستقل لتحليل بيانات المتطلبات والاختبارات وتقييم تغطية الجودة.";
    subtitle.style.cssText = "margin:0 auto 26px;max-width:720px;text-align:center;line-height:1.9;color:#94a3b8;";

    const launchCard = document.createElement("div");
    launchCard.style.cssText = [
        "max-width:760px", "margin:0 auto", "padding:clamp(24px,4vw,42px)",
        "box-sizing:border-box", "border:1px solid #334b78", "border-radius:22px",
        "background:radial-gradient(circle at 85% 10%,rgba(59,130,246,.20),transparent 38%),linear-gradient(135deg,#17264a 0%,#111827 72%)",
        "text-align:center", "box-shadow:0 18px 45px rgba(0,0,0,.18)"
    ].join(";");

    const icon = document.createElement("div");
    icon.textContent = "📊";
    icon.setAttribute("aria-hidden", "true");
    icon.style.cssText = "font-size:52px;margin-bottom:14px;";

    const cardTitle = document.createElement("h3");
    cardTitle.textContent = "تحليل بيانات";
    cardTitle.style.cssText = "margin:0 0 12px;font-size:clamp(22px,2.5vw,28px);color:#f8fafc;";

    const description = document.createElement("p");
    description.textContent = "افتح أداة QA Coverage Auditor كاملة، وأدخل بيانات المتطلبات والاختبارات لتحليل التغطية واكتشاف الفجوات وإعداد التقارير.";
    description.style.cssText = "max-width:600px;margin:0 auto 24px;line-height:1.9;color:#cbd5e1;";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.textContent = "📊  فتح تحليل البيانات";
    openButton.style.cssText = "display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:50px;padding:13px 26px;border:1px solid #60a5fa;border-radius:12px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;font-size:16px;font-weight:800;cursor:pointer;box-shadow:0 8px 22px rgba(37,99,235,.25);transition:transform .2s,filter .2s;";
    openButton.addEventListener("mouseenter", () => { openButton.style.filter = "brightness(1.12)"; openButton.style.transform = "translateY(-2px)"; });
    openButton.addEventListener("mouseleave", () => { openButton.style.filter = "none"; openButton.style.transform = "none"; });
    openButton.addEventListener("click", () => showQADataAnalysis(panel));

    const privacyNote = document.createElement("p");
    privacyNote.textContent = "بيانات التحليل مستقلة ومحفوظة محليًا في هذا المتصفح، ولا ترتبط ببيانات الموظفين أو مشروعات الشركة.";
    privacyNote.style.cssText = "margin:20px 0 0;font-size:12px;line-height:1.8;color:#94a3b8;";

    launchCard.append(icon, cardTitle, description, openButton, privacyNote);

    const back = document.createElement("button");
    back.type = "button";
    back.className = "back-button";
    back.textContent = "العودة إلى الرئيسية";
    back.style.cssText = "display:block;margin:24px auto 0;";
    back.addEventListener("click", () => navigation.querySelector('[data-section="overview"]')?.click());

    panel.append(heading, subtitle, launchCard, back);
    content.appendChild(panel);
}

function showQADataAnalysis(panel) {
    if (!panel || !content.contains(panel)) return;
    document.body.classList.add("qa-analysis-fullscreen");
    panel.replaceChildren();
    panel.style.cssText = "padding:0;margin:0;max-width:none;width:100%;height:100%;min-height:0;box-sizing:border-box;";

    const toolbar = document.createElement("div");
    toolbar.style.cssText = "position:fixed;top:12px;right:12px;z-index:2147483647;display:flex;align-items:center;justify-content:flex-start;padding:0;margin:0;background:transparent;border:0;";

    const back = document.createElement("button");
    back.type = "button";
    back.className = "back-button qa-analysis-home-button";
    back.textContent = "← عودة للرئيسية";
    back.setAttribute("aria-label", "العودة إلى الصفحة الرئيسية في Smart Company");
    back.style.cssText = "min-height:42px;padding:10px 16px;border:1px solid #49648d;border-radius:12px;background:rgba(15,23,42,.96);color:#f8fafc;font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 5px 20px rgba(0,0,0,.3);";
    back.addEventListener("click", () => {
        document.body.classList.remove("qa-analysis-fullscreen");
        navigation.querySelector('[data-section="overview"]')?.click();
    });

    const frame = document.createElement("iframe");
    frame.title = "QA Coverage Auditor — تحليل البيانات";
    frame.src = "./qa-center/index.html";
    frame.loading = "eager";
    frame.style.cssText = "position:fixed;inset:0;display:block;width:100vw;height:100vh;height:100dvh;margin:0;padding:0;border:0;border-radius:0;background:#0b1020;z-index:2147483000;";
    frame.setAttribute("allowfullscreen", "true");

    toolbar.appendChild(back);
    panel.append(frame, toolbar);
}

function showSection(sectionKey) {
    const section = sections[sectionKey];

    if (!section || !currentCompany) {
        return;
    }

    const role = currentCompany.userRole;


// السماح للمالك والمدير الصغير ورئيس القسم بفتح قسم الموظفين.
const employeeManagementRoles = [
    "owner",
    "junior_manager",
    "department_head",
    "head_of_department",
    "departmenthead",
    "section_head",
    "team_leader"
];

if (
    sectionKey === "employees" &&
    !employeeManagementRoles.includes(role)
) {
    // الموظف العادي يستطيع فتح القسم لعرض الموظفين فقط.
    const allowedEmployeeRoles = [
        "employee",
        "staff",
        "worker"
    ];

    if (!allowedEmployeeRoles.includes(role)) {
        showError("ليس لديك صلاحية الوصول إلى هذا القسم.");
        return;
    }
}


    // التحقق من صلاحيات الإدارة قبل تغيير القسم النشط.
    if (sectionKey === "management") {
        if (!["owner", "junior_manager"].includes(role)) {
            showError("ليس لديك صلاحية الوصول إلى قسم الإدارة.");
            return;
        }

        navigation.querySelectorAll(".nav-button").forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.section === sectionKey
            );
        });

        showManagement();
        return;
    }

    navigation.querySelectorAll(".nav-button").forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.section === sectionKey
        );
    });

    if (sectionKey === "overview") {
        showOverview();
        return;
    }

    if (sectionKey === "employees") {
        showEmployees();
        return;
    }

    if (sectionKey === "tasks") {
        showTasks();
        return;
    }

    if (sectionKey === "projects") {
        showProjects();
        return;
    }

    if (sectionKey === "departments") {
        showDepartments();
        return;
    }

    if (sectionKey === "chat") {
        showChatOffice();
        return;
    }

    if (sectionKey === "files") {
    showFiles();
    return;
}

    if (sectionKey === "settings") {
        showSettings();
        return;
    }

    if (sectionKey === "qa-center") {
        showQACenter();
        return;
    }

    // الأقسام التي لم تُربط بوظائفها بعد.
    content.replaceChildren();

    const panel = document.createElement("section");
    panel.className = "welcome";

    const icon = document.createElement("h2");
    icon.textContent = `${section.icon} ${section.title}`;

    const description = document.createElement("p");
    description.textContent = section.description;

    const status = document.createElement("p");
    status.className = "status";
    status.textContent =
        "واجهة هذا القسم جاهزة مبدئيًا، لكن وظائفه لم تُربط بقاعدة البيانات بعد.";

    const back = document.createElement("button");
    back.className = "back-button";
    back.textContent = "العودة إلى الرئيسية";

    back.addEventListener("click", () => {
        navigation.querySelector('[data-section="overview"]').click();
    });

    panel.append(icon, description, status, back);
    content.appendChild(panel);
}




navigation.addEventListener("click", (event) => {
    const button = event.target.closest(".nav-button");

    if (!button) return;

    const sectionKey = button.dataset.section;

    console.log("تم الضغط على القسم:", sectionKey);

    if (sectionKey === "management") {
        console.log("فتح قسم الإدارة");

        if (typeof showManagement !== "function") {
            console.error("الدالة showManagement غير موجودة!");
            return;
        }

        showManagement();
        return;
    }

    showSection(sectionKey);
});



backButton.addEventListener("click", () => {
    window.location.href = "./dashboard.html";
});

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace("./index.html");
        return;
    }

    if (!companyId) {
        showError("رابط الشركة غير مكتمل. ارجع إلى صفحة شركاتي وافتح الشركة من هناك.");
        return;
    }

    try {
        const companyReference = doc(db, "companies", companyId);
        const companySnapshot = await getDoc(companyReference);

        if (!companySnapshot.exists()) {
            showError("الشركة غير موجودة أو لا تملك صلاحية الوصول إليها.");
            return;
        }

        const companyData = companySnapshot.data();

    // تحديد ما إذا كان المستخدم مالك الشركة.
const isOwner = companyData.ownerId === user.uid;

// التحقق من عضوية المستخدم إذا لم يكن مالك الشركة.
let memberData = null;

if (!isOwner) {
const memberReference = doc(
db,
"companies",
companyId,
"members",
user.uid
);


const memberSnapshot = await getDoc(memberReference);

if (!memberSnapshot.exists()) {
    showError("ليس لديك صلاحية الوصول إلى مساحة العمل هذه.");
    return;
}

memberData = memberSnapshot.data();


}

// حفظ بيانات الشركة ودور المستخدم الحالي.
currentCompany = {
id: companySnapshot.id,
...companyData,
userRole: isOwner ? "owner" : memberData.role
};

const managementNavButton = document.getElementById(
    "managementNavButton"
);


if (managementNavButton) {
    managementNavButton.hidden = ![
        "owner",
        "junior_manager"
    ].includes(currentCompany.userRole);
}
console.log("Workspace access granted:", {
companyId,
role: currentCompany.userRole
});


// إظهار زر الإدارة للمالك والمدير الصغير فقط.



    
        companyNameElement.textContent = currentCompany.name;
        showOverview();

        console.log("Smart Company workspace loaded.");
    } catch (error) {
        console.error("Workspace loading error:", error);

        showError(
            error.code === "permission-denied"
                ? "تم رفض الوصول إلى الشركة. تحقق من قواعد أمان Firestore."
                : "تعذر تحميل الشركة. تحقق من اتصال الإنترنت ثم حاول مرة أخرى."
        );
    }
});

console.log("Smart Company workspace initialized.");


async function showProjects() {
    if (!currentCompany) return;

    content.replaceChildren();

    // ============================================================
    // الصفحة الرئيسية لقسم المشاريع
    // ============================================================

    const panel = document.createElement("section");
    panel.className = "welcome projects-home";

    const title = document.createElement("h2");
    title.textContent = "📁 مشاريع الشركة";

    const description = document.createElement("p");
    description.textContent =
        "اختر عرض المشاريع العامة للشركة أو إنشاء مشروع جديد.";

    const cards = document.createElement("div");
    cards.className = "projects-menu";

    // بطاقة المشاريع العامة
    const allProjectsCard = document.createElement("button");
    allProjectsCard.type = "button";
    allProjectsCard.className =
        "projects-menu-card projects-all-card";

    allProjectsCard.innerHTML = `
        <span class="projects-menu-icon">📂</span>
        <span class="projects-menu-title">المشاريع العامة</span>
        <span class="projects-menu-description">
            عرض جميع مشاريع الشركة ومتابعتها.
        </span>
    `;

    cards.appendChild(allProjectsCard);

 
// بطاقة إنشاء مشروع للمالك والمدير الصغير ورئيس القسم
let createProjectCard = null;

if (
    ["owner", "junior_manager", "team_leader"]
        .includes(currentCompany.userRole)
) {


        createProjectCard = document.createElement("button");
        createProjectCard.type = "button";
        createProjectCard.className =
            "projects-menu-card projects-create-card";

        createProjectCard.innerHTML = `
            <span class="projects-menu-icon">➕</span>
            <span class="projects-menu-title">إنشاء مشروع</span>
            <span class="projects-menu-description">
                أنشئ مشروعًا جديدًا للشركة.
            </span>
        `;

        cards.appendChild(createProjectCard);
    }

    const backHomeButton = document.createElement("button");
    backHomeButton.type = "button";
    backHomeButton.className = "back-button";
    backHomeButton.textContent = "العودة إلى الرئيسية";

    backHomeButton.addEventListener("click", () => {
        navigation.querySelector(
            '[data-section="overview"]'
        )?.click();
    });

    panel.append(
        title,
        description,
        cards,
        backHomeButton
    );

    content.appendChild(panel);

    // ============================================================
    // واجهة فرعية مشتركة
    // ============================================================

    function showProjectsSubpage(headingText) {
        const subpage = document.createElement("section");
        subpage.className = "welcome projects-subpage";

        const header = document.createElement("div");
        header.className = "projects-subpage-header";

        const heading = document.createElement("h2");
        heading.textContent = headingText;

        const backButton = document.createElement("button");
        backButton.type = "button";
        backButton.className = "back-button";
        backButton.textContent = "← رجوع";

        backButton.addEventListener("click", () => {
            content.replaceChildren(panel);
        });

        header.append(heading, backButton);
        subpage.appendChild(header);

        content.replaceChildren(subpage);

        return subpage;
    }

    // ============================================================
    // عرض جميع مشاريع الشركة
    // ============================================================

    allProjectsCard.addEventListener("click", async () => {
        const projectsPage =
            showProjectsSubpage("📂 المشاريع العامة للشركة");

        const loadingMessage = document.createElement("p");
        loadingMessage.textContent = "جارٍ تحميل المشاريع...";

        const projectList = document.createElement("div");
        projectList.className = "project-list";

        projectsPage.append(loadingMessage, projectList);

        try {
            await loadProjectsList(projectList);

            if (!projectsPage.isConnected) return;

            loadingMessage.remove();

            if (projectList.children.length === 0) {
                const emptyMessage = document.createElement("p");
                emptyMessage.className = "projects-empty";
                emptyMessage.textContent =
                    "لا توجد مشاريع مسجلة في الشركة حتى الآن.";

                projectList.appendChild(emptyMessage);
            }
        } catch (error) {
            console.error("Load company projects error:", error);

            loadingMessage.textContent =
                "تعذر تحميل المشاريع. حاول مرة أخرى.";
        }
    });

    // ============================================================
    // نموذج إنشاء مشروع جديد
    // ============================================================

    if (createProjectCard) {
        createProjectCard.addEventListener("click", () => {
          if (
    !["owner", "junior_manager", "team_leader"]
        .includes(currentCompany.userRole)
) {
    alert("ليس لديك صلاحية إنشاء المشاريع.");
    return;
}

            const formPage =
                showProjectsSubpage("➕ إنشاء مشروع جديد");

            const form = document.createElement("form");
            form.className = "project-form";

            const nameLabel = document.createElement("label");
            nameLabel.textContent = "اسم المشروع";

            const nameInput = document.createElement("input");
            nameInput.type = "text";
            nameInput.placeholder = "اكتب اسم المشروع";
            nameInput.required = true;
            nameInput.maxLength = 100;

            nameLabel.appendChild(nameInput);

            const descriptionLabel = document.createElement("label");
            descriptionLabel.textContent = "وصف المشروع";

            const descriptionInput = document.createElement("textarea");
            descriptionInput.placeholder = "اكتب وصف المشروع";
            descriptionInput.rows = 4;
            descriptionInput.maxLength = 5000;

            descriptionLabel.appendChild(descriptionInput);

            const createButton = document.createElement("button");
            createButton.type = "submit";
            createButton.className = "back-button";
            createButton.textContent = "💾 حفظ المشروع";

            const message = document.createElement("p");
            message.setAttribute("role", "status");
            message.setAttribute("aria-live", "polite");

            form.append(
                nameLabel,
                descriptionLabel,
                createButton,
                message
            );

            formPage.appendChild(form);

            form.addEventListener("submit", async (event) => {
                event.preventDefault();

                if (
                  !currentCompany ||
!["owner", "junior_manager", "team_leader"]
    .includes(currentCompany.userRole) ||
!auth.currentUser
                ) {
                    message.textContent =
    "ليس لديك صلاحية إنشاء المشاريع.";
                    return;
                }

                const name = nameInput.value.trim();
                const projectDescription =
                    descriptionInput.value.trim();

                if (name.length < 2) {
                    message.textContent =
                        "اسم المشروع لازم يكون حرفين على الأقل.";
                    return;
                }

                createButton.disabled = true;
                message.textContent = "جارٍ إنشاء المشروع...";

                try {
                    const projectsRef = collection(
                        db,
                        "companies",
                        currentCompany.id,
                        "projects"
                    );

                    const projectRef = doc(projectsRef);

                    await setDoc(projectRef, {
                        name,
                        description: projectDescription,
                        status: "active",
                        createdBy: auth.currentUser.uid,
                        createdAt: serverTimestamp()
                    });

                    message.textContent =
                        "✅ تم إنشاء المشروع بنجاح.";

                    form.reset();

                    // تحديث قائمة المشاريع حتى يظهر المشروع الجديد.
                    // لا ننتقل تلقائيًا إلى صفحة أخرى.
                } catch (error) {
                    console.error("Create project error:", error);

                    message.textContent =
                        "تعذر إنشاء المشروع. تحقق من اتصالك وصلاحيات Firebase.";
                } finally {
                    createButton.disabled = false;
                }
            });
        });
    }
}



async function showChatOffice() {
    if (!currentCompany || !auth.currentUser) return;

    const user = auth.currentUser;
    const companyId = currentCompany.id;

    const isOwner =
        currentCompany.ownerId === user.uid ||
        currentCompany.userRole === "owner";

    content.replaceChildren();

    const office = document.createElement("section");
    office.className = "welcome office-lobby";

    const header = document.createElement("div");
    header.className = "office-header";

    const title = document.createElement("h2");
    title.textContent = "🏢 صالة المكتب";

    const subtitle = document.createElement("p");
    subtitle.textContent = isOwner
        ? "أهلاً بك في مكتب الشركة. يمكنك الاطلاع على غرف الموظفين والخزانة العامة."
        : "أهلاً بك في مكتبك الخاص. يمكنك فتح غرفتك والخزانة العامة.";

    header.append(title, subtitle);

    // الخزانة العامة
    const publicLocker = document.createElement("button");
    publicLocker.type = "button";
    publicLocker.className = "office-public-locker";

    const lockerIcon = document.createElement("span");
    lockerIcon.className = "office-big-icon";
    lockerIcon.textContent = "🗄️";

    const lockerTitle = document.createElement("strong");
    lockerTitle.textContent = "الخزانة العامة";

    const lockerDescription = document.createElement("span");
    lockerDescription.textContent =
        "المكان المخصص لملفات ومستندات الشركة";

    publicLocker.append(
        lockerIcon,
        lockerTitle,
        lockerDescription
    );

    publicLocker.addEventListener("click", () => {
        showOfficeNotice(
            "🗄️ الخزانة العامة",
            "رفع الملفات وعرضها لم يُفعّلا بعد."
        );
    });

    // قسم الغرف
    const roomsSection = document.createElement("div");
    roomsSection.className = "office-rooms-section";

    const roomsTitle = document.createElement("h3");
    roomsTitle.textContent = isOwner
        ? "🚪 غرف الموظفين"
        : "🚪 غرفتي الخاصة";

    const roomsDescription = document.createElement("p");
    roomsDescription.textContent = isOwner
        ? "اختر غرفة موظف لقراءة الرسائل وإرسال رسائل جديدة."
        : "افتح غرفتك للتواصل مع صاحب الشركة.";

    const roomsGrid = document.createElement("div");
    roomsGrid.className = "office-rooms-grid";

    const status = document.createElement("p");
    status.className = "office-status";
    status.setAttribute("role", "status");
    status.textContent = "جارٍ تحميل الغرف...";

    roomsSection.append(
        roomsTitle,
        roomsDescription,
        status,
        roomsGrid
    );

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "back-button";
    backButton.textContent = "العودة إلى الرئيسية";

    backButton.addEventListener("click", () => {
        navigation
            .querySelector('[data-section="overview"]')
            ?.click();
    });

    office.append(
        header,
        publicLocker,
        roomsSection,
        backButton
    );

    content.appendChild(office);

    try {
        const roomsRef = collection(
            db,
            "companies",
            companyId,
            "chatRooms"
        );

        let roomDocuments = [];

        if (isOwner) {
            // صاحب الشركة يعرض قائمة الغرف.
            const roomsSnapshot = await getDocs(roomsRef);
            roomDocuments = roomsSnapshot.docs;
        } else {
            // الموظف يقرأ غرفته فقط.
            const ownRoomRef = doc(
                db,
                "companies",
                companyId,
                "chatRooms",
                user.uid
            );

            const ownRoomSnapshot = await getDoc(ownRoomRef);

            if (ownRoomSnapshot.exists()) {
                roomDocuments = [ownRoomSnapshot];
            }
        }

        if (!office.isConnected) return;

        roomsGrid.replaceChildren();

        if (roomDocuments.length === 0) {
            status.textContent = isOwner
                ? "لا توجد غرف موظفين حتى الآن."
                : "لم نعثر على غرفتك. تحقق من وجود غرفتك في قاعدة البيانات.";

            return;
        }

        for (const roomDocument of roomDocuments) {
            const room = roomDocument.data();

            const roomButton = document.createElement("button");
            roomButton.type = "button";
            roomButton.className = "office-room";

            const icon = document.createElement("span");
            icon.className = "office-room-icon";
            icon.textContent = "💬";

            const name = document.createElement("strong");
            name.textContent =
                typeof room.name === "string"
                    ? room.name
                    : "غرفة موظف";

            const detail = document.createElement("span");
            detail.textContent = "فتح المحادثة";

            roomButton.append(icon, name, detail);

            roomButton.addEventListener("click", () => {
                showOfficeChatRoom(
                    roomDocument.id,
                    name.textContent,
                    companyId,
                    isOwner,
                    user
                );
            });

            roomsGrid.appendChild(roomButton);
        }

        status.textContent = "";
    } catch (error) {
        console.error("Load office rooms error:", error);

        if (office.isConnected) {
            status.textContent =
                error.code === "permission-denied"
                    ? "ليس لديك صلاحية لعرض الغرف. تحقق من قواعد Firestore."
                    : "تعذر تحميل الغرف. تحقق من اتصال Firebase.";
        }
    }
}

async function showOfficeChatRoom(
    roomId,
    roomName,
    companyId,
    isOwner,
    user
) {
    if (
        !auth.currentUser ||
        auth.currentUser.uid !== user.uid
    ) {
        return;
    }

    if (!isOwner && roomId !== user.uid) {
        showOfficeNotice(
            "غير مسموح",
            "لا يمكنك فتح غرفة موظف آخر."
        );
        return;
    }

    // التحقق من وجود الغرفة.
    try {
        const roomRef = doc(
            db,
            "companies",
            companyId,
            "chatRooms",
            roomId
        );

        const roomSnapshot = await getDoc(roomRef);

        if (!roomSnapshot.exists()) {
            showOfficeNotice(
                "الغرفة غير موجودة",
                "تعذر العثور على هذه الغرفة."
            );
            return;
        }
    } catch (error) {
        console.error("Check office room error:", error);

        showOfficeNotice(
            "تعذر فتح الغرفة",
            error.code === "permission-denied"
                ? "ليس لديك صلاحية لفتح هذه الغرفة."
                : "تحقق من الاتصال بالإنترنت وحاول مرة أخرى."
        );

        return;
    }

    if (
        !auth.currentUser ||
        auth.currentUser.uid !== user.uid
    ) {
        return;
    }

    // إنشاء واجهة الغرفة.
    content.replaceChildren();

    const roomPage = document.createElement("section");
    roomPage.className = "office-interior";

    // رأس الغرفة.
    const header = document.createElement("header");
    header.className = "office-interior-header";

    const headingGroup = document.createElement("div");

    const eyebrow = document.createElement("span");
    eyebrow.className = "office-eyebrow";
    eyebrow.textContent = "SMART COMPANY / OFFICE";

    const title = document.createElement("h2");
    title.className = "office-interior-title";
    title.textContent = `🚪 ${roomName}`;

    const subtitle = document.createElement("p");
    subtitle.textContent =
        "مرحبًا بك داخل الغرفة. اختَر المكان الذي تريد الدخول إليه.";

    headingGroup.append(eyebrow, title, subtitle);

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "office-back-lobby";
    backButton.textContent = "← العودة إلى الصالة";

    backButton.addEventListener("click", () => {
        showChatOffice();
    });

    header.append(headingGroup, backButton);

    // مساحة الغرفة.
    const roomScene = document.createElement("div");
    roomScene.className = "office-room-scene";

    const sceneLabel = document.createElement("div");
    sceneLabel.className = "office-scene-label";
    sceneLabel.textContent = "مساحة الغرفة";

    // الخزانة الخاصة.
    const lockerButton = document.createElement("button");
    lockerButton.type = "button";
    lockerButton.className = "office-room-locker";

    const lockerIcon = document.createElement("span");
    lockerIcon.className = "office-room-locker-icon";
    lockerIcon.textContent = "🗄️";

    const lockerName = document.createElement("strong");
    lockerName.textContent = "الخزانة الخاصة";

    const lockerDescription = document.createElement("span");
    lockerDescription.textContent =
        "ملفات ومستندات الغرفة";

    const lockerAction = document.createElement("span");
    lockerAction.className = "office-room-action";
    lockerAction.textContent = "اضغط لفتح الخزانة ←";

    lockerButton.append(
        lockerIcon,
        lockerName,
        lockerDescription,
        lockerAction
    );

    // بطاقة المحادثة.
    const chatButton = document.createElement("button");
    chatButton.type = "button";
    chatButton.className = "office-room-chat-card";

    const chatIcon = document.createElement("span");
    chatIcon.className = "office-room-chat-icon";
    chatIcon.textContent = "💬";

    const chatTitle = document.createElement("strong");
    chatTitle.textContent = "محادثة الغرفة";

    const chatDescription = document.createElement("span");
    chatDescription.textContent =
        "تبادل الرسائل مع صاحب الشركة";

    const chatAction = document.createElement("span");
    chatAction.className = "office-room-action";
    chatAction.textContent = "الدخول إلى المحادثة ←";

    chatButton.append(
        chatIcon,
        chatTitle,
        chatDescription,
        chatAction
    );

    roomScene.append(
        sceneLabel,
        lockerButton,
        chatButton
    );

    // شريط المعلومات أسفل الغرفة.
    const footer = document.createElement("div");
    footer.className = "office-room-footer";

    const roomInfo = document.createElement("span");
    roomInfo.textContent = "🔒 غرفة خاصة";

    const roomInfoText = document.createElement("span");
    roomInfoText.textContent =
        "تظهر محتويات الغرفة حسب صلاحيات حسابك.";

    footer.append(roomInfo, roomInfoText);

    roomPage.append(
        header,
        roomScene,
        footer
    );

    content.appendChild(roomPage);

// فتح الخزانة داخل التطبيق.
lockerButton.addEventListener("click", () => {
    console.log("Locker test identifiers:", {
        companyId,
        roomId,
        isOwner
    });

    showOfficeLocker(
        roomId,
        roomName,
        companyId,
        isOwner,
        user
    );
});

    // فتح المحادثة الحقيقية الموجودة بالفعل.
    chatButton.addEventListener("click", () => {
        showOfficeChatRoomMessages(
            roomId,
            roomName,
            companyId,
            isOwner,
            user
        );
    });
}

async function showOfficeLocker(
    roomId,
    roomName,
    companyId,
    isOwner,
    user
) {
    if (
        !auth.currentUser ||
        auth.currentUser.uid !== user.uid
    ) {
        return;
    }

    if (!isOwner && roomId !== user.uid) {
        showOfficeNotice(
            "غير مسموح",
            "لا يمكنك فتح خزانة غرفة أخرى."
        );
        return;
    }

    // التأكد من وجود الغرفة وصلاحية الوصول إليها.
    try {
        const roomRef = doc(
            db,
            "companies",
            companyId,
            "chatRooms",
            roomId
        );

        const roomSnapshot = await getDoc(roomRef);
console.log(
    "Locker room field names:",
    Object.keys(roomSnapshot.data() || {})
);

const lockerData = roomSnapshot.data();
lockerOwnerUid = lockerData?.ownerId || null;



console.log("Locker ownership check:", {
    currentUserOwnsLocker:
        lockerData?.ownerId === auth.currentUser?.uid,
    companyOwnerAccess: isOwner,
    ownerIdExists:
        typeof lockerData?.ownerId === "string" &&
        lockerData.ownerId.length > 0
});
        if (!roomSnapshot.exists()) {
            showOfficeNotice(
                "الغرفة غير موجودة",
                "تعذر العثور على الغرفة المطلوبة."
            );
            return;
        }
    } catch (error) {
        console.error("Verify locker room error:", error);

        showOfficeNotice(
            "تعذر فتح الخزانة",
            error.code === "permission-denied"
                ? "ليس لديك صلاحية للوصول إلى هذه الغرفة."
                : "تعذر التحقق من الغرفة. حاول مرة أخرى."
        );

        return;
    }

    if (
        !auth.currentUser ||
        auth.currentUser.uid !== user.uid
    ) {
        return;
    }

    const roomKey = `${companyId}_${roomId}`;

    content.replaceChildren();

    const page = document.createElement("section");
    page.className = "office-interior office-locker-page";

    // رأس الصفحة.
    const header = document.createElement("header");
    header.className = "office-interior-header";

    const headingGroup = document.createElement("div");

    const eyebrow = document.createElement("span");
    eyebrow.className = "office-eyebrow";
    eyebrow.textContent = "SMART COMPANY / STORAGE";

    const title = document.createElement("h2");
    title.className = "office-interior-title";
    title.textContent = "🗄️ الخزانة الخاصة";

    const subtitle = document.createElement("p");
    subtitle.textContent = `خزانة ${roomName}`;

    headingGroup.append(eyebrow, title, subtitle);

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "office-back-lobby";
    backButton.textContent = "← العودة إلى الغرفة";

    backButton.addEventListener("click", () => {
        showOfficeChatRoom(
            roomId,
            roomName,
            companyId,
            isOwner,
            user
        );
    });

    header.append(headingGroup, backButton);

    // منطقة رفع الملفات.
    const uploadPanel = document.createElement("div");
    uploadPanel.className = "office-locker-upload";

    const uploadIcon = document.createElement("div");
    uploadIcon.className = "office-locker-large-icon";
    uploadIcon.textContent = "📂";

    const uploadTitle = document.createElement("h3");
    uploadTitle.textContent = "ملفات الغرفة";

    const uploadDescription = document.createElement("p");
    uploadDescription.textContent =
        "ارفع ملفاتك واحفظها على هذا الجهاز داخل المتصفح.";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.id = "officeLockerFileInput";
    fileInput.className = "office-locker-file-input";
    fileInput.setAttribute(
        "aria-label",
        "اختيار الملفات لرفعها إلى الخزانة"
    );

    const uploadLabel = document.createElement("label");
    uploadLabel.className = "office-locker-upload-button";
    uploadLabel.htmlFor = fileInput.id;
    uploadLabel.textContent = "＋ اختيار ملفات";

    const uploadStatus = document.createElement("p");
    uploadStatus.className = "office-locker-status";
    uploadStatus.setAttribute("role", "status");
    uploadStatus.textContent =
        "اختر الملفات لبدء حفظها.";

    uploadPanel.append(
        uploadIcon,
        uploadTitle,
        uploadDescription,
        fileInput,
        uploadLabel,
        uploadStatus
    );

    // قائمة الملفات.
    const filesSection = document.createElement("section");
    filesSection.className = "office-locker-files-section";

    const filesHeading = document.createElement("h3");
    filesHeading.textContent = "📁 الملفات المحفوظة";

    const filesCount = document.createElement("span");
    filesCount.className = "office-locker-files-count";
    filesCount.textContent = "0 ملف";

    const filesHeader = document.createElement("div");
    filesHeader.className = "office-locker-files-header";
    filesHeader.append(filesHeading, filesCount);


const filesList = document.createElement("div");
filesList.className = "office-locker-files-list";

// زر مشاركة الملفات المختارة
const shareSelectedButton = document.createElement("button");
shareSelectedButton.type = "button";
shareSelectedButton.className = "office-locker-share-selected";
shareSelectedButton.textContent = "🔐 مشاركة الملفات المحددة (0)";
shareSelectedButton.hidden = true;
shareSelectedButton.hidden =
    lockerOwnerUid !== auth.currentUser?.uid;


shareSelectedButton.addEventListener("click", async () => {
    if (selectedShareFileIds.size === 0) {
        uploadStatus.textContent =
            "اختَر ملفًا واحدًا على الأقل قبل المتابعة.";
        return;
    }

    if (lockerOwnerUid !== auth.currentUser?.uid) {
        uploadStatus.textContent =
            "المشاركة متاحة لصاحب الخزنة فقط.";
        return;
    }

    shareSelectedButton.disabled = true;
    uploadStatus.textContent =
        "جارٍ تشفير الملفات وإنشاء المشاركة...";

    try {
        const result = await shareOfficeLockerFiles({
            companyId,
            roomId,
            roomKey,
            fileIds: Array.from(selectedShareFileIds)
        });

        uploadStatus.textContent =
            `تمت مشاركة ${result.savedCount} ملف بنجاح.`;

        console.log("تم إنشاء المشاركة:", {
            shareId: result.shareId,
            savedCount: result.savedCount,
            expiresAt: result.expiresAt
        });

try {
    await navigator.clipboard.writeText(result.shareId);

    alert(
        `تمت المشاركة بنجاح، وتم نسخ المعرّف تلقائيًا! ✅\n\n` +
        `معرّف المشاركة:\n${result.shareId}\n\n` +
        `عدد الملفات: ${result.savedCount}\n\n` +
        `تقدر تلصق المعرّف باستخدام Ctrl + V.`
    );
} catch (error) {
    prompt(
        "تم إنشاء المشاركة بنجاح. انسخ معرّف المشاركة باستخدام Ctrl + A ثم Ctrl + C:",
        result.shareId
    );
}

    } catch (error) {
        console.error("فشل إنشاء مشاركة الملفات:", error);

        uploadStatus.textContent =
            error.message || "تعذرت مشاركة الملفات.";

        alert(uploadStatus.textContent);

    } finally {
        shareSelectedButton.disabled = false;
    }
});

filesSection.append(
    filesHeader,
    filesList,
    shareSelectedButton
);

page.append(header, uploadPanel, filesSection);
content.appendChild(page);



    // التأكد أن IndexedDB متاحة.
    if (!("indexedDB" in window)) {
        uploadStatus.textContent =
            "المتصفح لا يدعم التخزين المحلي المطلوب.";
        fileInput.disabled = true;
        uploadLabel.hidden = true;
        return;
    }

    let database;

    try {
        database = await openOfficeLockerDB();
    } catch (error) {
        console.error("Open locker database error:", error);

        uploadStatus.textContent =
            "تعذر تشغيل الخزانة المحلية في هذا المتصفح.";

        fileInput.disabled = true;
        uploadLabel.hidden = true;
        return;
    }

    // تنسيق حجم الملف.
    function formatFileSize(bytes) {
        if (bytes < 1024) {
            return `${bytes} بايت`;
        }

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
        }

        if (bytes < 1024 * 1024 * 1024) {
            return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
        }

        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} جيجابايت`;
    }

    // الملفات التي اختار صاحب الخزانة مشاركتها
const selectedShareFileIds = new Set();

    // إنشاء عنصر آمن لعرض الملف.
   function createFileCard(fileRecord) {
    const card = document.createElement("article");
    card.className = "office-locker-file-card";

    const details = document.createElement("div");
    details.className = "office-locker-file-details";

    const icon = document.createElement("span");
    icon.className = "office-locker-file-icon";
    icon.textContent = "📄";

    const textGroup = document.createElement("div");
    textGroup.className = "office-locker-file-text";

    const fileName = document.createElement("strong");
    fileName.textContent = fileRecord.name;

    const fileInfo = document.createElement("span");
    fileInfo.textContent = formatFileSize(fileRecord.size);

    textGroup.append(fileName, fileInfo);
    details.append(icon, textGroup);

    const actions = document.createElement("div");
    actions.className = "office-locker-file-actions";

    // إظهار اختيار المشاركة لصاحب الخزانة الحقيقي فقط.
   const isActualLockerOwner =
    lockerOwnerUid === auth.currentUser?.uid;
    if (isActualLockerOwner) {
        const shareLabel = document.createElement("label");
        shareLabel.className = "office-locker-share-select";

        const shareCheckbox = document.createElement("input");
        shareCheckbox.type = "checkbox";
        shareCheckbox.checked = selectedShareFileIds.has(fileRecord.id);

        shareCheckbox.addEventListener("change", () => {
            if (shareCheckbox.checked) {
                selectedShareFileIds.add(fileRecord.id);
            } else {
                selectedShareFileIds.delete(fileRecord.id);
            }

            shareSelectedButton.textContent =
    `🔐 مشاركة الملفات المحددة (${selectedShareFileIds.size})`;

console.log(
    "عدد الملفات المحددة للمشاركة:",
    selectedShareFileIds.size
);

        });

        const shareText = document.createElement("span");
        shareText.textContent = "اختيار للمشاركة";

        shareLabel.append(shareCheckbox, shareText);
        actions.appendChild(shareLabel);
    }

    const downloadButton = document.createElement("button");
    downloadButton.type = "button";
    downloadButton.className = "office-locker-download";
    downloadButton.textContent = "⬇️ تنزيل";

    downloadButton.addEventListener("click", () => {
        const url = URL.createObjectURL(fileRecord.blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = fileRecord.name;

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 60000);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "office-locker-delete";
    deleteButton.textContent = "🗑️ حذف";

    deleteButton.addEventListener("click", async () => {
        if (
            !confirm(
                `هل تريد حذف الملف "${fileRecord.name}" من هذا الجهاز؟`
            )
        ) {
            return;
        }

        deleteButton.disabled = true;

        try {
            await deleteOfficeLockerFile(
                database,
                fileRecord.id
            );

            selectedShareFileIds.delete(fileRecord.id);

            if (!page.isConnected) return;

            uploadStatus.textContent = "تم حذف الملف.";
            await refreshFiles();
        } catch (error) {
            console.error("Delete locker file error:", error);

            if (page.isConnected) {
                uploadStatus.textContent =
                    "تعذر حذف الملف. حاول مرة أخرى.";
            }

            deleteButton.disabled = false;
        }
    });

    actions.append(downloadButton, deleteButton);
    card.append(details, actions);

    return card;
}

    // تحديث قائمة الملفات.
    async function refreshFiles() {
        const records = await getOfficeLockerFiles(
            database,
            roomKey
        );

        if (!page.isConnected) return;

        filesList.replaceChildren();
        filesCount.textContent = `${records.length} ملف`;

        if (records.length === 0) {
            const empty = document.createElement("div");
            empty.className = "office-locker-empty";

            const emptyIcon = document.createElement("span");
            emptyIcon.textContent = "📭";

            const emptyText = document.createElement("p");
            emptyText.textContent =
                "الخزانة فارغة حاليًا. أضف أول ملف لك.";

            empty.append(emptyIcon, emptyText);
            filesList.appendChild(empty);
            return;
        }

        for (const record of records) {
            filesList.appendChild(createFileCard(record));
        }
    }

    // رفع الملفات إلى IndexedDB.
    fileInput.addEventListener("change", async () => {
        const selectedFiles = Array.from(fileInput.files || []);

        if (selectedFiles.length === 0) return;

        fileInput.disabled = true;
        uploadLabel.classList.add("is-disabled");

        let savedCount = 0;
        let failedCount = 0;

        try {
            for (const file of selectedFiles) {
                if (!page.isConnected) return;

                uploadStatus.textContent =
                    `جارٍ حفظ الملف: ${file.name}`;

                try {
                    await saveOfficeLockerFile(database, {
                        id: crypto.randomUUID
                            ? crypto.randomUUID()
                            : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                        roomKey,
                        companyId,
                        roomId,
                        name: file.name,
                        type: file.type || "application/octet-stream",
                        size: file.size,
                        lastModified: file.lastModified,
                        blob: file,
                        savedAt: Date.now(),
                        uploadedBy: user.uid
                    });

                    savedCount++;
                } catch (error) {
                    console.error(
                        "Save locker file error:",
                        file.name,
                        error
                    );

                    failedCount++;
                }
            }

            if (!page.isConnected) return;

            await refreshFiles();

            uploadStatus.textContent =
                failedCount === 0
                    ? `تم حفظ ${savedCount} ملف بنجاح على هذا الجهاز.`
                    : `تم حفظ ${savedCount} ملف، وتعذر حفظ ${failedCount} ملف. قد تكون مساحة التخزين غير كافية.`;
        } finally {
          
          
            fileInput.value = "";
            fileInput.disabled = false;
            uploadLabel.classList.remove("is-disabled");
        }
    });

    try {
        await refreshFiles();
    } catch (error) {
        console.error("Load locker files error:", error);

        uploadStatus.textContent =
            "تعذر تحميل الملفات المحفوظة.";
    }
}
let lockerOwnerUid = null;

function openOfficeLockerDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(
            "SmartCompanyLockerDB",
            1
        );

        request.onupgradeneeded = () => {
            const database = request.result;

            if (!database.objectStoreNames.contains("files")) {
                const store = database.createObjectStore(
                    "files",
                    { keyPath: "id" }
                );

                store.createIndex("roomKey", "roomKey", {
                    unique: false
                });
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };

        request.onblocked = () => {
            reject(
                new Error("قاعدة البيانات مشغولة في نافذة أخرى.")
            );
        };
    });
}

function saveOfficeLockerFile(database, fileRecord) {
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(
            ["files"],
            "readwrite"
        );

        transaction.objectStore("files").put(fileRecord);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
    });
}

function getOfficeLockerFiles(database, roomKey) {
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(
            ["files"],
            "readonly"
        );

        const store = transaction.objectStore("files");
        const index = store.index("roomKey");
        const request = index.getAll(roomKey);

        request.onsuccess = () => {
            const records = request.result || [];

            records.sort((a, b) => b.savedAt - a.savedAt);

            resolve(records);
        };

        request.onerror = () => reject(request.error);
    });
}

function deleteOfficeLockerFile(database, fileId) {
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(
            ["files"],
            "readwrite"
        );

        transaction.objectStore("files").delete(fileId);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
    });
}

function showOfficeNotice(titleText, messageText) {
    const overlay = document.createElement("div");
    overlay.className = "office-notice-overlay";

    const dialog = document.createElement("section");
    dialog.className = "office-notice";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "office-notice-title");

    const title = document.createElement("h3");
    title.id = "office-notice-title";
    title.textContent = titleText;

    const message = document.createElement("p");
    message.textContent = messageText;

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "back-button";
    closeButton.textContent = "إغلاق";
    closeButton.addEventListener("click", () => overlay.remove());

    dialog.append(title, message, closeButton);
    overlay.appendChild(dialog);

    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            overlay.remove();
        }
    });

    content.appendChild(overlay);
    closeButton.focus();
}



function loadProjectsList(projectList) {
    projectList.replaceChildren();

    if (!currentCompany) return;

    const companyId = currentCompany.id;

    const loading = document.createElement("p");
    loading.textContent = "جارٍ تحميل المشاريع...";
    projectList.appendChild(loading);

    const projectsRef = collection(
        db,
        "companies",
        companyId,
        "projects"
    );

    const unsubscribeProjects = onSnapshot(
        projectsRef,
        (snapshot) => {
            if (!projectList.isConnected) return;

            projectList.replaceChildren();

            if (snapshot.empty) {
                const emptyMessage = document.createElement("p");
                emptyMessage.textContent = "لا توجد مشاريع حتى الآن.";
                projectList.appendChild(emptyMessage);
                return;
            }

            snapshot.forEach((projectDocument) => {
                const project = projectDocument.data();
                const projectId = projectDocument.id;

                const card = document.createElement("article");
                card.className = "project-card";

                // اسم المشروع
                const name = document.createElement("h3");
                name.textContent = `📂 ${project.name || "مشروع بدون اسم"}`;

                // التاريخ والوقت تحت اسم المشروع
                const dateTime = document.createElement("div");
                dateTime.className = "project-created-datetime";

                const dateElement = document.createElement("p");
                dateElement.className = "project-created-date";

                const timeElement = document.createElement("p");
                timeElement.className = "project-created-time";

                if (project.createdAt) {
                    const createdDate = typeof project.createdAt.toDate === "function"
                        ? project.createdAt.toDate()
                        : new Date(project.createdAt);

                    if (!Number.isNaN(createdDate.getTime())) {
                        const date = createdDate.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                        });

                        const time = createdDate.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true
                        });

                        dateElement.textContent = `📅 ${date}`;
                        timeElement.textContent = `🕒 ${time}`;
                    } else {
                        dateElement.textContent = "📅 تاريخ الإنشاء غير متاح";
                        timeElement.textContent = "";
                    }
                } else {
                    dateElement.textContent = "📅 تاريخ الإنشاء غير متاح";
                    timeElement.textContent = "";
                }

                dateTime.append(dateElement, timeElement);


// بيانات منشئ المشروع
const creatorInfo = document.createElement("p");
creatorInfo.className = "project-creator-info";

const creatorName =
    project.createdByName ||
    project.createdByEmail ||
    "غير متاح";

creatorInfo.textContent = `👤 أنشأ المشروع: ${creatorName}`;



                // وصف المشروع
                const description = document.createElement("p");
                description.textContent =
                    project.description || "لا يوجد وصف للمشروع.";

                // حالة المشروع
                const status = document.createElement("p");
                status.textContent =
                    project.status === "active"
                        ? "الحالة: نشط 🟢"
                        : `الحالة: ${project.status || "غير محددة"}`;

                // إحصائيات المهام
                const stats = document.createElement("div");
                stats.className = "project-stats";
                stats.textContent = "📊 جارٍ حساب نسبة الإنجاز...";

                const tasksRef = collection(
                    db,
                    "companies",
                    companyId,
                    "projects",
                    projectId,
                    "tasks"
                );

                const unsubscribeTasks = onSnapshot(
                    tasksRef,
                    (tasksSnapshot) => {
                        if (!card.isConnected) return;

                        const total = tasksSnapshot.size;
                        let pending = 0;
                        let inProgress = 0;
                        let completed = 0;
                        let overdue = 0;

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        tasksSnapshot.forEach((taskDocument) => {
                            const task = taskDocument.data();

                            if (task.status === "completed") {
                                completed++;
                            } else if (task.status === "in_progress") {
                                inProgress++;
                            } else {
                                pending++;
                            }

                            if (
                                task.status !== "completed" &&
                                task.dueDate
                            ) {
                                const dueDate = new Date(
                                    `${task.dueDate}T00:00:00`
                                );

                                if (
                                    !Number.isNaN(dueDate.getTime()) &&
                                    dueDate < today
                                ) {
                                    overdue++;
                                }
                            }
                        });

                        const percentage = total > 0
                            ? Math.round((completed / total) * 100)
                            : 0;

                        stats.replaceChildren();

                        const progressTitle = document.createElement("p");
                        progressTitle.textContent =
                            `📊 نسبة الإنجاز: ${percentage}%`;

                        const progress = document.createElement("progress");
                        progress.max = 100;
                        progress.value = percentage;
                        progress.setAttribute(
                            "aria-label",
                            `نسبة إنجاز المشروع ${percentage}%`
                        );

                        const taskCounts = document.createElement("p");
                        taskCounts.textContent =
                            `📋 إجمالي المهام: ${total} | ` +
                            `⏳ لم تبدأ: ${pending} | ` +
                            `🔄 قيد التنفيذ: ${inProgress} | ` +
                            `✅ مكتملة: ${completed}`;

                        const overdueCount = document.createElement("p");
                        overdueCount.textContent =
                            `🔴 المهام المتأخرة: ${overdue}`;

                        stats.append(
                            progressTitle,
                            progress,
                            taskCounts,
                            overdueCount
                        );
                    },
                    (error) => {
                        console.error(
                            "Project statistics listener error:",
                            error
                        );

                        if (card.isConnected) {
                            stats.textContent =
                                "تعذر تحميل إحصائيات المهام.";
                        }
                    }
                );

                // زر إدارة المهام
                const tasksButton = document.createElement("button");
                tasksButton.type = "button";
                tasksButton.className = "project-tasks-button";
                tasksButton.textContent = "📋  المهام المتعلقة";

                tasksButton.addEventListener("click", () => {
                    openProjectTasks(
                        projectId,
                        project.name || "مشروع"
                    );
                });


card.append(
    name,
    dateTime,
    creatorInfo,
    description,
    status,
    stats,
    tasksButton
);



                projectList.appendChild(card);

                // إلغاء مستمع المهام عند إزالة البطاقة
                const cardObserver = new MutationObserver(() => {
                    if (!card.isConnected) {
                        unsubscribeTasks();
                        cardObserver.disconnect();
                    }
                });

                cardObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            });
        },
        (error) => {
            console.error("Load projects error:", error);

            if (!projectList.isConnected) return;

            projectList.replaceChildren();

            const errorMessage = document.createElement("p");
            errorMessage.textContent =
                "تعذر تحميل المشاريع. تحقق من اتصال الإنترنت وصلاحيات Firestore.";

            projectList.appendChild(errorMessage);
        }
    );

    // إلغاء مستمع المشاريع عند مغادرة القسم
    const projectListObserver = new MutationObserver(() => {
        if (!projectList.isConnected) {
            unsubscribeProjects();
            projectListObserver.disconnect();
        }
    });

    projectListObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}





function loadProjectTasks(projectId, tasksList) {
    tasksList.replaceChildren();

    const loading = document.createElement("p");
    loading.textContent = "جارٍ تحميل المهام...";
    tasksList.appendChild(loading);

    if (!currentCompany) {
        tasksList.textContent = "لم يتم تحديد الشركة.";
        return;
    }

    const tasksRef = collection(
        db,
        "companies",
        currentCompany.id,
        "projects",
        projectId,
        "tasks"
    );

    // الاشتراك في التغييرات المباشرة للمهام
    const unsubscribe = onSnapshot(
        tasksRef,
        (snapshot) => {
            // قد يكون المستمع قد أُلغي بعد مغادرة الصفحة
            if (!tasksList.isConnected) return;

            tasksList.replaceChildren();

            if (snapshot.empty) {
                const empty = document.createElement("p");
                empty.textContent =
                    "لا توجد مهام لهذا المشروع حتى الآن.";
                tasksList.appendChild(empty);
                return;
            }

            snapshot.forEach((taskDocument) => {
                const task = taskDocument.data();

                const card = document.createElement("article");
                card.className = "project-card";

                const title = document.createElement("h3");
                title.textContent = `📝 ${task.title || "مهمة بدون عنوان"}`;

                const description = document.createElement("p");
                description.textContent =
                    task.description || "لا يوجد وصف للمهمة.";

const department = document.createElement("p");
department.textContent =
    `🏢 القسم: ${task.departmentName || "غير محدد"}`;

                const dueDate = document.createElement("p");
                dueDate.textContent =
                    `📅 موعد التسليم: ${task.dueDate || "غير محدد"}`;

                const statusLabels = {
                    pending: "لم تبدأ ⏳",
                    in_progress: "قيد التنفيذ 🔄",
                    completed: "مكتملة ✅"
                };

                const statusText = document.createElement("p");
                statusText.textContent =
                    `الحالة: ${statusLabels[task.status] || "غير محددة"}`;

    card.append(
    title,
    description,
    department,
    dueDate,
    statusText
);
                // الموظف المسؤول فقط يمكنه تحديث حالة المهمة
                if (
                    currentCompany.userRole !== "owner" &&
                    task.assignedTo === auth.currentUser?.uid
                ) {
                    const statusSelect = document.createElement("select");
                    statusSelect.setAttribute(
                        "aria-label",
                        `حالة المهمة ${task.title || ""}`
                    );

                    const statuses = [
                        ["pending", "لم تبدأ"],
                        ["in_progress", "قيد التنفيذ"],
                        ["completed", "مكتملة"]
                    ];

                    statuses.forEach(([value, label]) => {
                        const option = document.createElement("option");
                        option.value = value;
                        option.textContent = label;
                        statusSelect.appendChild(option);
                    });

                    statusSelect.value = [
                        "pending",
                        "in_progress",
                        "completed"
                    ].includes(task.status)
                        ? task.status
                        : "pending";

                    const updateButton = document.createElement("button");
                    updateButton.type = "button";
                    updateButton.className = "project-tasks-button";
                    updateButton.textContent = "💾 تحديث الحالة";

                    const updateMessage = document.createElement("p");
                    updateMessage.setAttribute("role", "status");

                    updateButton.addEventListener("click", async () => {
                        const newStatus = statusSelect.value;

                        if (
                            ![
                                "pending",
                                "in_progress",
                                "completed"
                            ].includes(newStatus)
                        ) {
                            updateMessage.textContent =
                                "حالة المهمة غير صحيحة.";
                            return;
                        }

                        updateButton.disabled = true;
                        statusSelect.disabled = true;
                        updateMessage.textContent =
                            "جارٍ تحديث الحالة...";

                        try {
                            await updateDoc(taskDocument.ref, {
                                status: newStatus
                            });

                            updateMessage.textContent =
                                "✅ تم حفظ الحالة، وسيظهر التحديث تلقائيًا.";
                            
                            // لا نستدعي loadProjectTasks هنا؛
                            // onSnapshot سيحدّث القائمة تلقائيًا.
                        } catch (error) {
                            console.error(
                                "Update task status error:",
                                error
                            );

                            updateMessage.textContent =
                                "تعذر تحديث الحالة. تحقق من صلاحيات Firestore.";
                        } finally {
                            updateButton.disabled = false;
                            statusSelect.disabled = false;
                        }
                    });

                    card.append(
                        statusSelect,
                        updateButton,
                        updateMessage
                    );
                }

                tasksList.appendChild(card);
            });
        },
        (error) => {
            console.error("Live tasks listener error:", error);

            if (!tasksList.isConnected) return;

            tasksList.replaceChildren();

            const errorMessage = document.createElement("p");
            errorMessage.textContent =
                "تعذر تحديث المهام مباشرة. تحقق من اتصال الإنترنت وصلاحيات Firestore.";

            tasksList.appendChild(errorMessage);
        }
    );

    // إلغاء المستمع عند إزالة قائمة المهام من الصفحة
    const observer = new MutationObserver(() => {
        if (!tasksList.isConnected) {
            unsubscribe();
            observer.disconnect();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

async function openProjectTasks(projectId, projectName) {
if (!currentCompany) return;


content.replaceChildren();

const panel = document.createElement("section");
panel.className = "welcome";

const title = document.createElement("h2");


const description = document.createElement("p");


panel.append(title, description);



const tasksHeading = document.createElement("h3");
tasksHeading.textContent = "المهام الحالية";

const tasksList = document.createElement("div");
tasksList.className = "project-list";

const backButton = document.createElement("button");
backButton.type = "button";
backButton.className = "back-button";
backButton.textContent = "العودة إلى المشاريع";

backButton.addEventListener("click", () => {
    showSection("projects");
});

panel.append(tasksHeading, tasksList, backButton);
content.appendChild(panel);

loadProjectTasks(projectId, tasksList);


}


function showEmployeeTasks() {
if (!currentCompany || !auth.currentUser) return;


// منع المدير من استخدام واجهة الموظف.
if (currentCompany.userRole === "owner") {
    showProjects();
    return;
}

content.replaceChildren();

const panel = document.createElement("section");
panel.className = "welcome";

const title = document.createElement("h2");
title.textContent = "✅ مهامي";

const description = document.createElement("p");
description.textContent =
    "تابع المهام المسندة إليك من جميع مشاريع الشركة وحدّث حالة تنفيذها.";

const summary = document.createElement("div");
summary.className = "project-stats";
summary.textContent = "جارٍ تحميل مهامك...";

const tasksList = document.createElement("div");
tasksList.className = "project-list";

panel.append(title, description, summary, tasksList);
content.appendChild(panel);

let active = true;
let projectUnsubscribers = [];
let projectTasks = new Map();

function renderTasks() {
    if (!active) return;

    const tasks = [];

    projectTasks.forEach((projectData, projectId) => {
        projectData.tasks.forEach((task) => {
            if (task.assignedTo !== auth.currentUser?.uid) return;

            tasks.push({
                ...task,
                projectId,
                projectName: projectData.name
            });
        });
    });

    const pending = tasks.filter(task => task.status === "pending").length;
    const inProgress = tasks.filter(task => task.status === "in_progress").length;
    const completed = tasks.filter(task => task.status === "completed").length;

    summary.textContent =
        `📋 إجمالي مهامي: ${tasks.length} | ` +
        `⏳ لم تبدأ: ${pending} | ` +
        `🔄 قيد التنفيذ: ${inProgress} | ` +
        `✅ مكتملة: ${completed}`;

    tasksList.replaceChildren();

    if (tasks.length === 0) {
        const empty = document.createElement("p");
        empty.textContent =
            "لا توجد مهام مسندة إليك حاليًا. ستظهر مهامك هنا عندما يعيّنها المدير لك.";
        tasksList.appendChild(empty);
        return;
    }

    tasks.sort((a, b) =>
        String(a.dueDate || "").localeCompare(String(b.dueDate || ""))
    );

    tasks.forEach((task) => {
        const card = document.createElement("article");
        card.className = "project-card";

        const taskTitle = document.createElement("h3");
        taskTitle.textContent = task.title || "مهمة بدون عنوان";

        const project = document.createElement("p");
        project.textContent = `📁 المشروع: ${task.projectName}`;

        const taskDescription = document.createElement("p");
        taskDescription.textContent = task.description || "";

        const dueDate = document.createElement("p");
        dueDate.textContent = `📅 موعد التسليم: ${task.dueDate || "غير محدد"}`;

        const status = document.createElement("p");
        status.textContent = {
            pending: "⏳ الحالة: لم تبدأ",
            in_progress: "🔄 الحالة: قيد التنفيذ",
            completed: "✅ الحالة: مكتملة"
        }[task.status] || "الحالة: غير محددة";

        card.append(taskTitle, project, taskDescription, dueDate, status);

        if (task.status !== "completed") {
            const statusSelect = document.createElement("select");

            [
                ["pending", "لم تبدأ"],
                ["in_progress", "قيد التنفيذ"],
                ["completed", "مكتملة"]
            ].forEach(([value, label]) => {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = label;
                statusSelect.appendChild(option);
            });

            statusSelect.value = task.status || "pending";

const saveButton = document.createElement("button");
saveButton.type = "button";
saveButton.className = "project-tasks-button";
saveButton.textContent = "💾 تحديث الحالة";


            const message = document.createElement("p");
            message.setAttribute("role", "status");

            saveButton.addEventListener("click", async () => {
                if (!auth.currentUser || !currentCompany) return;

                saveButton.disabled = true;
                statusSelect.disabled = true;
                message.textContent = "جارٍ تحديث الحالة...";

                try {
                    await updateDoc(
                        doc(
                            db,
                            "companies",
                            currentCompany.id,
                            "projects",
                            task.projectId,
                            "tasks",
                            task.id
                        ),
                        { status: statusSelect.value }
                    );

                    message.textContent = "✅ تم تحديث الحالة.";
                } catch (error) {
                    console.error("Update employee task error:", error);
                    message.textContent = "تعذر تحديث الحالة. حاول مرة أخرى.";
                } finally {
                    saveButton.disabled = false;
                    statusSelect.disabled = false;
                }
            });

            card.append(statusSelect, saveButton, message);
        }

        tasksList.appendChild(card);
    });
}

async function startTaskListeners() {
    try {
        const projectsRef = collection(
            db,
            "companies",
            currentCompany.id,
            "projects"
        );

        const projectsSnapshot = await getDocs(projectsRef);

        if (!active) return;

        if (projectsSnapshot.empty) {
            summary.textContent = "لا توجد مشاريع في الشركة حتى الآن.";
            return;
        }

        projectsSnapshot.forEach((projectDocument) => {
            const projectId = projectDocument.id;
            const projectData = projectDocument.data();

            projectTasks.set(projectId, {
                name: projectData.name || "مشروع بدون اسم",
                tasks: []
            });

            const tasksRef = collection(
                db,
                "companies",
                currentCompany.id,
                "projects",
                projectId,
                "tasks"
            );

            const unsubscribe = onSnapshot(
                tasksRef,
                (snapshot) => {
                    if (!active) return;

                    projectTasks.set(projectId, {
                        name: projectData.name || "مشروع بدون اسم",
                        tasks: snapshot.docs.map(taskDocument => ({
                            ...taskDocument.data(),
                            id: taskDocument.id
                        }))
                    });

                    renderTasks();
                },
                (error) => {
                    console.error("Load employee tasks error:", error);
                    if (active) {
                        summary.textContent =
                            "تعذر تحميل بعض المهام. تحقق من اتصالك وصلاحيات Firestore.";
                    }
                }
            );

            projectUnsubscribers.push(unsubscribe);
        });
    } catch (error) {
        console.error("Load employee projects error:", error);
        if (active) {
            summary.textContent = "تعذر تحميل المشاريع والمهام.";
        }
    }
}

startTaskListeners();

// إيقاف الاستماع عند مغادرة القسم لمنع تراكم الاتصالات.
const cleanupObserver = new MutationObserver(() => {
    if (!content.contains(panel)) {
        active = false;
        projectUnsubscribers.forEach(unsubscribe => unsubscribe());
        projectUnsubscribers = [];
        cleanupObserver.disconnect();
    }
});

cleanupObserver.observe(content, {
    childList: true,
    subtree: true
});


}


async function showProfileSettings() {
if (!auth.currentUser) {
showError("يرجى تسجيل الدخول أولًا.");
return;
}


content.replaceChildren();

// البطاقة الرئيسية
const panel = document.createElement("section");
panel.className = "profile-panel";

// رأس الصفحة
const header = document.createElement("div");
header.className = "profile-panel-header";

const avatar = document.createElement("div");
avatar.className = "profile-avatar";
avatar.textContent = "👤";

const headerInfo = document.createElement("div");

const title = document.createElement("h2");
title.textContent = "الملف الشخصي";

const description = document.createElement("p");
description.textContent = "حدّث اسمك الذي سيظهر لأعضاء الشركة.";

headerInfo.append(title, description);
header.append(avatar, headerInfo);

// نموذج تعديل الاسم
const form = document.createElement("form");
form.className = "profile-form";

const nameLabel = document.createElement("label");
nameLabel.textContent = "الاسم الشخصي";
nameLabel.htmlFor = "profileName";

const nameInput = document.createElement("input");
nameInput.id = "profileName";
nameInput.type = "text";
nameInput.placeholder = "اكتب اسمك هنا...";
nameInput.autocomplete = "name";
nameInput.required = true;
nameInput.minLength = 2;
nameInput.maxLength = 80;

const emailLabel = document.createElement("p");
emailLabel.className = "profile-email";
emailLabel.textContent =
    `📧 البريد الإلكتروني: ${auth.currentUser.email || "غير متوفر"}`;

const actions = document.createElement("div");
actions.className = "profile-actions";

const saveButton = document.createElement("button");
saveButton.type = "submit";
saveButton.className = "profile-save-button";
saveButton.textContent = "💾 حفظ التغييرات";

actions.replaceChildren(saveButton);
form.append(nameLabel, nameInput, actions);

const status = document.createElement("p");
status.className = "profile-status";
status.setAttribute("role", "status");
status.setAttribute("aria-live", "polite");

// زر العودة إلى الإعدادات
const backButton = document.createElement("button");
backButton.type = "button";
backButton.className = "settings-back-button";
backButton.textContent = "→ العودة إلى الإعدادات";
backButton.addEventListener("click", showSettings);

panel.append(header, form, emailLabel, status, backButton);
content.appendChild(panel);

// تحميل الاسم المحفوظ
try {
    const userRef = doc(db, "users", auth.currentUser.uid);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
        nameInput.value = userSnapshot.data().name || "";
    }
} catch (error) {
    console.error("Error loading profile:", error);
    status.textContent =
        "تعذر تحميل الاسم المحفوظ. يمكنك المحاولة مرة أخرى.";
}

// حفظ الاسم
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();

    if (name.length < 2 || name.length > 80) {
        status.textContent =
            "الاسم يجب أن يكون بين حرفين و80 حرفًا.";
        return;
    }

    saveButton.disabled = true;
    status.textContent = "جارٍ حفظ الاسم...";

    try {
        const user = auth.currentUser;

        if (!user) {
            throw new Error("المستخدم غير مسجل الدخول.");
        }

      const userRef = doc(db, "users", user.uid);
const userSnapshot = await getDoc(userRef);

if (userSnapshot.exists()) {
    await updateDoc(userRef, { name });
} else {
    await setDoc(userRef, {
        uid: user.uid,
        name,
        email: user.email || "",
        createdAt: serverTimestamp()
    });
}

// تحديث اسم الموظف في عضوية الشركة
if (currentCompany?.id) {
    const memberRef = doc(
        db,
        "companies",
        currentCompany.id,
        "members",
        user.uid
    );

    const memberSnapshot = await getDoc(memberRef);

    if (memberSnapshot.exists()) {
        await updateDoc(memberRef, { name });
    }
}
      

        status.textContent = "✅ تم حفظ اسمك بنجاح.";
    } catch (error) {
        console.error("Error saving profile:", error);
        status.textContent =
            "تعذر حفظ الاسم. تحقق من الاتصال وحاول مرة أخرى.";
    } finally {
        saveButton.disabled = false;
    }
});


}


function showSettings() {
content.replaceChildren();


const page = document.createElement("section");
page.className = "settings-page";

const header = document.createElement("header");
header.className = "settings-header";

const title = document.createElement("h2");
title.textContent = "⚙️ الإعدادات";

const description = document.createElement("p");
description.textContent =
    "إدارة حسابك وتفضيلاتك الشخصية من مكان واحد.";

header.append(title, description);

const grid = document.createElement("div");
grid.className = "settings-grid";

const cards = [
    {
        icon: "👤",
        title: "الملف الشخصي",
        description: "تعديل اسمك ومراجعة بيانات حسابك.",
        action: showProfileSettings
    },
    {
        icon: "🔔",
        title: "الإشعارات",
        description: "إعدادات الإشعارات والتحديثات.",
        action: () => showComingSoon("الإشعارات")
    },
    {
        icon: "🔒",
        title: "الأمان والخصوصية",
        description: "إعدادات حماية الحساب والخصوصية.",
        action: () => showComingSoon("الأمان والخصوصية")
    }
];

cards.forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "settings-card";

    const icon = document.createElement("span");
    icon.className = "settings-card-icon";
    icon.textContent = item.icon;

    const cardContent = document.createElement("div");
    cardContent.className = "settings-card-content";

    const cardTitle = document.createElement("h3");
    cardTitle.textContent = item.title;

    const cardDescription = document.createElement("p");
    cardDescription.textContent = item.description;

    const arrow = document.createElement("span");
    arrow.className = "settings-card-arrow";
    arrow.textContent = "←";
    arrow.setAttribute("aria-hidden", "true");

    cardContent.append(cardTitle, cardDescription);
    card.append(icon, cardContent, arrow);
    card.addEventListener("click", item.action);

    grid.appendChild(card);
});

page.append(header, grid);
content.appendChild(page);


}

function showComingSoon(sectionName) {
content.replaceChildren();


const page = document.createElement("section");
page.className = "settings-page";

const title = document.createElement("h2");
title.textContent = sectionName;

const description = document.createElement("p");
description.textContent = "هذا القسم لم تُفعّل وظائفه بعد.";

const backButton = document.createElement("button");
backButton.type = "button";
backButton.className = "settings-back-button";
backButton.textContent = "العودة إلى الإعدادات";
backButton.addEventListener("click", showSettings);

page.append(title, description, backButton);
content.appendChild(page);


}

async function uploadCompanyFile(file) {
    if (!file) {
        throw new Error("يرجى اختيار ملف أولًا.");
    }

    const cloudName = "h5h5n2b0";
    const uploadPreset = "tamny_uploads";

    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "smart-company/company-files");

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        {
            method: "POST",
            body: formData
        }
    );

    if (!response.ok) {
        const errorDetails = await response.text();

        console.error("Cloudinary upload error:", errorDetails);

        throw new Error("فشل رفع الملف.");
    }

    const data = await response.json();

    if (!data.secure_url) {
        throw new Error("لم يتم الحصول على رابط الملف.");
    }

    return {
        url: data.secure_url,
        publicId: data.public_id || "",
        originalName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size
    };
}

async function showFiles() {
    if (!currentCompany || !auth.currentUser) return;

    const user = auth.currentUser;
    const companyId = currentCompany.id;

    content.replaceChildren();

    // الحاوية الرئيسية
    const section = document.createElement("section");
    section.className = "welcome company-files-section";

    // العنوان
    const heading = document.createElement("h2");
    heading.textContent = "📁 ملفات الشركة";

    const description = document.createElement("p");
    description.textContent =
        "احفظ ملفاتك واعرض المستندات المشتركة مع أعضاء الشركة.";




// بطاقة حفظ ملف
const uploadHomeCard = document.createElement("button");
uploadHomeCard.type = "button";
uploadHomeCard.className = "department-feature-card";

uploadHomeCard.innerHTML = `
    <span class="department-feature-icon">📤</span>
    <strong>حفظ ملف</strong>
    <span>ارفع ملفاتك واحفظها في المكان المناسب</span>
    <span class="department-feature-arrow">← فتح</span>
`;

// بطاقة الملفات
const browseHomeCard = document.createElement("button");
browseHomeCard.type = "button";
browseHomeCard.className = "department-feature-card";

browseHomeCard.innerHTML = `
    <span class="department-feature-icon">📂</span>
    <strong>الملفات</strong>
    <span>تصفح ملفات الشركة والقسم وملفاتك الشخصية</span>
    <span class="department-feature-arrow">← فتح</span>
`;

// حاوية البطاقتين بنفس تخطيط قسم الموظفين
const filesHome = document.createElement("div");
filesHome.className = "department-feature-grid";

filesHome.append(uploadHomeCard, browseHomeCard);



// مربع حفظ الملفات الأصلي
const uploadCard = document.createElement("div");
uploadCard.className = "company-files-upload-card";

// مربع الملفات الأصلي
const filesCard = document.createElement("div");
filesCard.className = "company-files-list-card";

// إخفاء الواجهتين حتى يختار المستخدم
uploadCard.hidden = true;
filesCard.hidden = true;



    uploadCard.className = "company-files-upload-card";

    const uploadHeading = document.createElement("h3");
    uploadHeading.textContent = "📤 حفظ ملف";

    // اختيار الملف
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "*/*";
    fileInput.setAttribute("aria-label", "اختر الملف");

    // اسم الملف
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "اكتب اسم الملف";
    nameInput.maxLength = 150;

    // الجمهور المستهدف
    const visibilityLabel = document.createElement("label");
    visibilityLabel.textContent = "من يستطيع الاطلاع على الملف؟";

    const visibilitySelect = document.createElement("select");

    const companyOption = document.createElement("option");
    companyOption.value = "company";
    companyOption.textContent = "🏢 كل الشركة";

    const departmentOption = document.createElement("option");
    departmentOption.value = "department";
    departmentOption.textContent = "👥 القسم";

    const personalOption = document.createElement("option");
    personalOption.value = "personal";
    personalOption.textContent = "🔒 أنا فقط";

    visibilitySelect.append(
        companyOption,
        departmentOption,
        personalOption
    );

    // اختيار القسم المستهدف
const departmentPicker = document.createElement("div");
departmentPicker.className = "company-file-department-picker";
departmentPicker.hidden = true;

const departmentLabel = document.createElement("label");
departmentLabel.textContent = "اختار القسم:";

const departmentSelect = document.createElement("select");
departmentSelect.setAttribute("aria-label", "اختار القسم");

const departmentDefaultOption = document.createElement("option");
departmentDefaultOption.value = "";
departmentDefaultOption.textContent = "جارٍ تحميل الأقسام...";

departmentSelect.appendChild(departmentDefaultOption);

const departmentStatus = document.createElement("small");
departmentStatus.setAttribute("role", "status");

departmentPicker.append(
    departmentLabel,
    departmentSelect,
    departmentStatus
);

// إظهار الاختيار عند تحديد الجمهور
visibilitySelect.addEventListener("change", () => {
    const isDepartment = visibilitySelect.value === "department";

    departmentPicker.hidden = !isDepartment;

    if (isDepartment) {
        departmentSelect.focus();
    }
});

// تحميل أقسام الشركة الحالية
async function loadDepartmentOptions() {
    departmentSelect.replaceChildren();

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "اختر القسم";
    departmentSelect.appendChild(defaultOption);

    departmentStatus.textContent = "جارٍ تحميل الأقسام...";

    try {
        const departmentsQuery = query(
            collection(db, "departments"),
            where("companyId", "==", companyId)
        );

        const snapshot = await getDocs(departmentsQuery);

        if (!section.isConnected) return;

        departmentSelect.replaceChildren();

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "اختر القسم";
        departmentSelect.appendChild(placeholder);

        const departments = snapshot.docs
            .map((departmentDoc) => ({
                id: departmentDoc.id,
                name: departmentDoc.data().name
            }))
            .filter((department) =>
                typeof department.name === "string" &&
                department.name.trim() !== ""
            )
            .sort((a, b) => a.name.localeCompare(b.name, "ar"));

        for (const department of departments) {
            const option = document.createElement("option");

            option.value = department.id;
            option.textContent = department.name;

            departmentSelect.appendChild(option);
        }

        departmentStatus.textContent = departments.length
            ? `عدد الأقسام المتاحة: ${departments.length}`
            : "لم يتم إنشاء أقسام لهذه الشركة حتى الآن.";

    } catch (error) {
        console.error("Load file department options error:", error);

        departmentSelect.replaceChildren();

        const option = document.createElement("option");
        option.value = "";
        option.textContent = "تعذر تحميل الأقسام";

        departmentSelect.appendChild(option);

        departmentStatus.textContent =
            "تحقق من قواعد Firestore وصلاحية قراءة الأقسام.";
    }
}

    const visibilityNotice = document.createElement("small");
    // زر الحفظ
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.textContent = "رفع وحفظ الملف";

    const uploadStatus = document.createElement("p");
    uploadStatus.setAttribute("role", "status");

  uploadCard.append(
    uploadHeading,
    fileInput,
    nameInput,
    visibilityLabel,
    visibilitySelect,
    departmentPicker,
    visibilityNotice,
    saveButton,
    uploadStatus
);

    // مربع الملفات
   
    const filesHeading = document.createElement("h3");
    filesHeading.textContent = "📂 الملفات";

    const tabs = document.createElement("div");
    tabs.className = "company-files-tabs";

    const companyFilesButton = document.createElement("button");
    companyFilesButton.type = "button";
    companyFilesButton.textContent = "ملفات الشركة";
    companyFilesButton.className = "active";

    const departmentFilesButton = document.createElement("button");
    departmentFilesButton.type = "button";
    departmentFilesButton.textContent = "ملفات القسم";

    const personalFilesButton = document.createElement("button");
    personalFilesButton.type = "button";
    personalFilesButton.textContent = "ملفاتي الشخصية";

    tabs.append(
        companyFilesButton,
        departmentFilesButton,
        personalFilesButton
    );

    const filesStatus = document.createElement("p");
    filesStatus.setAttribute("role", "status");
    filesStatus.textContent = "جارٍ تحميل الملفات...";

    const filesList = document.createElement("div");
    filesList.className = "company-files-list";

    filesCard.append(
        filesHeading,
        tabs,
        filesStatus,
        filesList
    );

    // العودة
    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "back-button";
    backButton.textContent = "العودة إلى الرئيسية";

    backButton.addEventListener("click", () => {
        navigation
            .querySelector('[data-section="overview"]')
            ?.click();
    });


// زر الرجوع من واجهات الحفظ والملفات إلى المربعين
const filesHomeBackButton = document.createElement("button");
filesHomeBackButton.type = "button";
filesHomeBackButton.className = "company-files-back";
filesHomeBackButton.textContent = "← الرجوع إلى ملفات الشركة";

function showFilesHome() {
    filesHome.hidden = false;
    uploadCard.hidden = true;
    filesCard.hidden = true;
}

function showUploadScreen() {
    filesHome.hidden = true;
    uploadCard.hidden = false;
    filesCard.hidden = true;
}

function showBrowseScreen() {
    filesHome.hidden = true;
    uploadCard.hidden = true;
    filesCard.hidden = false;
}

// أحداث المربعين
uploadHomeCard.addEventListener("click", showUploadScreen);

browseHomeCard.addEventListener("click", async () => {
    showBrowseScreen();

    companyFilesButton.classList.add("active");
    departmentFilesButton.classList.remove("active");
    personalFilesButton.classList.remove("active");

    filesCard.querySelector(".company-department-view-picker")?.remove();

    await loadCompanyFiles();
});

// زر الرجوع
filesHomeBackButton.addEventListener("click", showFilesHome);

// تجميع واجهات سكشن الملفات
section.append(
    heading,
    description,
    filesHome,
    uploadCard,
    filesCard,
    filesHomeBackButton,
    backButton
);

content.appendChild(section);

// إظهار المربعين أول ما يفتح المستخدم سكشن الملفات
showFilesHome();



// إظهار الملفات المشتركة
async function loadCompanyFiles() {
    filesList.replaceChildren();
    filesStatus.textContent = "جارٍ تحميل ملفات الشركة...";

    try {
        const filesRef = collection(
            db,
            "companies",
            companyId,
            "files"
        );

        const filesQuery = query(
            filesRef,
            where("visibility", "==", "company")
        );

        const snapshot = await getDocs(filesQuery);

        if (!section.isConnected) return;

        if (snapshot.empty) {
            filesStatus.textContent =
                "لا توجد ملفات مشتركة حتى الآن.";
            return;
        }

        const documents = [...snapshot.docs];

        documents.sort((a, b) => {
            const dateA = a.data().createdAt?.toMillis?.() || 0;
            const dateB = b.data().createdAt?.toMillis?.() || 0;
            return dateB - dateA;
        });

        for (const fileDocument of documents) {
            const file = fileDocument.data();

            const item = document.createElement("article");
            item.className = "company-file-item";

            const fileName = document.createElement("strong");
            fileName.textContent =
                file.name || file.originalName || "ملف بدون اسم";


const details = document.createElement("p");



const fileSizeBytes = Number(file.fileSize) || 0;

let formattedSize;

if (fileSizeBytes < 1024) {
    formattedSize = `${fileSizeBytes} بايت`;
} else if (fileSizeBytes < 1024 ** 2) {
    formattedSize = `${(fileSizeBytes / 1024).toFixed(1)} KB`;
} else if (fileSizeBytes < 1024 ** 3) {
    formattedSize = `${(fileSizeBytes / (1024 ** 2)).toFixed(2)} MB`;
} else {
    formattedSize = `${(fileSizeBytes / (1024 ** 3)).toFixed(2)} GB`;
}




let uploadDate = "غير معروف";

if (file.createdAt) {
    const date = file.createdAt.toDate
        ? file.createdAt.toDate()
        : new Date(file.createdAt);

    if (!Number.isNaN(date.getTime())) {
        uploadDate = date.toLocaleString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }
}



details.innerHTML = `
    <span style="display:block; margin-bottom:5px;">
        بواسطة: ${file.uploadedByName || "عضو الشركة"}
    </span>
    <span style="display:block; margin-bottom:5px;">
        📅 تاريخ الإرسال: ${uploadDate}
    </span>
    <span style="display:block;">
      📦 الحجم: ${formattedSize}
    </span>
`;



            // حاوية الأزرار
            const fileActions = document.createElement("div");
            fileActions.className = "company-file-actions";

            // زر فتح الملف
            const openButton = document.createElement("button");
            openButton.type = "button";
            openButton.textContent = "📂 فتح الملف";

          
openButton.addEventListener("click", () => {
    if (!file.url) {
        alert("رابط الملف غير متاح.");
        return;
    }

    const fileName = file.originalName || file.name || "";
    const extension = fileName.split(".").pop().toLowerCase();

    // ملفات HTML تحتاج إلى معاينة آمنة
    if (["html", "htm"].includes(extension)) {
        const previewWindow = window.open("about:blank", "_blank");

        if (!previewWindow) {
            alert("اسمح بفتح النوافذ المنبثقة لهذا الموقع ثم حاول مرة أخرى.");
            return;
        }

        previewWindow.document.title = "معاينة ملف HTML";
        previewWindow.document.body.style.cssText =
            "font-family:Arial,sans-serif;padding:20px;direction:rtl;";

        const message = previewWindow.document.createElement("p");
        message.textContent = "جارٍ تحميل معاينة الملف...";

        const frame = previewWindow.document.createElement("iframe");
        frame.title = "معاينة HTML";
        frame.sandbox = "";
        frame.referrerPolicy = "no-referrer";
        frame.style.cssText =
            "width:100%;height:85vh;border:1px solid #ccc;border-radius:8px;";

        previewWindow.document.body.append(message, frame);

        fetch(file.url)
            .then(response => {
                if (!response.ok) {
                    throw new Error("تعذر جلب الملف.");
                }
                return response.text();
            })
            .then(html => {
                const blob = new Blob([html], {
                    type: "text/html;charset=utf-8"
                });

                frame.src = URL.createObjectURL(blob);
                message.textContent = "معاينة ملف HTML";
            })
            .catch(error => {
                console.error("HTML preview error:", error);
                message.textContent =
                    "تعذرت المعاينة. قد يمنع خادم الملفات الوصول إليه بسبب إعدادات CORS.";
            });

        return;
    }

    // الأنواع الأخرى تُفتح عبر رابطها الأصلي
    window.open(file.url, "_blank", "noopener,noreferrer");
});



            // زر تحميل الملف
            const downloadButton = document.createElement("button");
            downloadButton.type = "button";
            downloadButton.textContent = "📥 تحميل الملف";

    
downloadButton.addEventListener("click", async () => {
    if (!file.url) {
        alert("رابط الملف غير متاح.");
        return;
    }

    const fileName =
        file.originalName || file.name || "download";

    try {
        // عرض نافذة اختيار مكان الحفظ في المتصفحات الداعمة
        if ("showSaveFilePicker" in window) {
            const response = await fetch(file.url);

            if (!response.ok) {
                throw new Error("تعذر تحميل الملف من الخادم.");
            }

            const blob = await response.blob();

            const handle = await window.showSaveFilePicker({
                suggestedName: fileName
            });

            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();

            alert("تم حفظ الملف بنجاح.");
            return;
        }

        // بديل للمتصفحات التي لا تدعم اختيار مكان الحفظ
        const link = document.createElement("a");
        link.href = file.url;
        link.download = fileName;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        document.body.appendChild(link);
        link.click();
        link.remove();

    } catch (error) {
        if (error.name === "AbortError") return;

        console.error("File download error:", error);
        alert(
            "تعذر اختيار مكان الحفظ أو تنزيل الملف. " +
            "تحقق من اتصالك بالإنترنت وإعدادات الوصول إلى الملفات."
        );
    }
});



            // إضافة كل زر مرة واحدة
            fileActions.append(openButton, downloadButton);

            item.append(fileName, details, fileActions);
            filesList.appendChild(item);
        }

        filesStatus.textContent =
            `عدد الملفات المشتركة: ${documents.length}`;

    } catch (error) {
        console.error("Load company files error:", error);

        if (section.isConnected) {
            filesStatus.textContent =
                error.code === "permission-denied"
                    ? "ليس لديك صلاحية لعرض الملفات. تحقق من قواعد Firestore وعضوية الشركة."
                    : "تعذر تحميل الملفات. تحقق من اتصال Firebase.";
        }
    }
}


// عرض الملفات الشخصية للمستخدم الحالي فقط
async function loadPersonalFiles() {
    filesList.replaceChildren();
    filesStatus.textContent = "جارٍ تحميل ملفاتك الشخصية...";

    const currentUser = auth.currentUser;

    if (!currentUser) {
        filesStatus.textContent = "يجب تسجيل الدخول أولًا.";
        return;
    }

    try {
        const personalFilesQuery = query(
            collection(db, "companies", companyId, "files"),
            where("visibility", "==", "personal"),
            where("uploadedBy", "==", currentUser.uid)
        );

        const snapshot = await getDocs(personalFilesQuery);

        if (!section.isConnected) return;

        if (snapshot.empty) {
            filesStatus.textContent =
                "ليس لديك ملفات شخصية حتى الآن. يمكنك رفع ملف واختيار «أنا فقط».";
            return;
        }

        const documents = [...snapshot.docs];

        documents.sort((a, b) => {
            const dateA = a.data().createdAt?.toMillis?.() || 0;
            const dateB = b.data().createdAt?.toMillis?.() || 0;
            return dateB - dateA;
        });

        for (const fileDocument of documents) {
            const file = fileDocument.data();

            const item = document.createElement("article");
            item.className = "company-file-item";

            const fileName = document.createElement("strong");
            fileName.textContent =
                file.name || file.originalName || "ملف بدون اسم";

            const details = document.createElement("p");

            const sizeMB = (
                (Number(file.fileSize) || 0) / (1024 * 1024)
            ).toFixed(2);

            details.textContent =
                `ملف شخصي 🔒 — الحجم: ${sizeMB} ميجابايت`;

            const fileActions = document.createElement("div");
            fileActions.className = "company-file-actions";

            // زر فتح الملف
            const openButton = document.createElement("button");
            openButton.type = "button";
            openButton.textContent = "📂 فتح الملف";

      
openButton.addEventListener("click", async () => {
    if (!file.url) {
        alert("رابط الملف غير متاح.");
        return;
    }

    const fileName = file.originalName || file.name || "";
    const extension = fileName.split(".").pop().toLowerCase();

    // معاينة HTML حتى لو كان رابط Cloudinary ينزّله بدل عرضه
    if (["html", "htm"].includes(extension)) {
        const previewWindow = window.open("about:blank", "_blank");

        if (!previewWindow) {
            alert("اسمح بفتح النوافذ المنبثقة لهذا الموقع ثم حاول مرة أخرى.");
            return;
        }

        previewWindow.document.write(`
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>معاينة ملف HTML</title>
                <style>
                    body { font-family: Arial; padding: 20px; }
                    iframe { width: 100%; height: 85vh; border: 1px solid #ccc; }
                </style>
            </head>
            <body>
                <p id="status">جارٍ تحميل الملف...</p>
                <iframe id="preview" sandbox=""></iframe>
            </body>
            </html>
        `);
        previewWindow.document.close();

        try {
            const response = await fetch(file.url);

            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }

            const html = await response.text();
            const blob = new Blob([html], {
                type: "text/html;charset=utf-8"
            });

            const blobUrl = URL.createObjectURL(blob);
            previewWindow.document.getElementById("preview").src = blobUrl;
            previewWindow.document.getElementById("status").textContent =
                "معاينة ملف HTML";
        } catch (error) {
            console.error("HTML preview error:", error);

            if (!previewWindow.closed) {
                previewWindow.close();
            }

            alert(
                "تعذرت معاينة ملف HTML. قد يمنع Cloudinary تحميله بسبب CORS. " +
                "افتح Console في أدوات المطور للتحقق من الخطأ."
            );
        }

        return;
    }

    // باقي الملفات تُفتح بالطريقة المعتادة
    window.open(file.url, "_blank", "noopener,noreferrer");
});





            // زر تحميل الملف
            const downloadButton = document.createElement("button");
            downloadButton.type = "button";
            downloadButton.textContent = "📥 تحميل الملف";

            downloadButton.addEventListener("click", async () => {
                if (!file.url) {
                    alert("رابط الملف غير متاح.");
                    return;
                }

                const suggestedName =
                    file.originalName || file.name || "download";

                try {
                    if ("showSaveFilePicker" in window) {
                        const handle = await window.showSaveFilePicker({
                            suggestedName
                        });

                        const response = await fetch(file.url);

                        if (!response.ok) {
                            throw new Error("تعذر تنزيل الملف.");
                        }

                        const blob = await response.blob();
                        const writable = await handle.createWritable();

                        await writable.write(blob);
                        await writable.close();

                        filesStatus.textContent = "تم حفظ الملف بنجاح.";
                    } else {
                        const link = document.createElement("a");
                        link.href = file.url;
                        link.download = suggestedName;
                        link.target = "_blank";
                        link.rel = "noopener noreferrer";

                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                    }
                } catch (error) {
                    if (error.name === "AbortError") return;

                    console.error("Download personal file error:", error);

                    alert(
                        "تعذر تحميل الملف. تحقق من الاتصال بالإنترنت وإعدادات الوصول إلى الملفات."
                    );
                }
            });

            fileActions.append(openButton, downloadButton);
            item.append(fileName, details, fileActions);
            filesList.appendChild(item);
        }

        filesStatus.textContent =
            `عدد ملفاتك الشخصية: ${documents.length}`;

    } catch (error) {
        console.error("Load personal files error:", error);

        filesStatus.textContent =
            error.code === "permission-denied"
                ? "رفضت قواعد Firestore قراءة الملفات الشخصية. نحتاج إلى مراجعة القواعد."
                : "تعذر تحميل الملفات الشخصية.";
    }
}



 async function loadDepartmentFiles() {
filesList.replaceChildren();
filesStatus.textContent = "جارٍ تحميل ملفات الأقسام...";


try {
    let pickerCard = filesCard.querySelector(
        ".company-department-view-picker"
    );

    let viewDepartmentPicker;

    if (!pickerCard) {
        // إنشاء الحاوية المنسقة
        pickerCard = document.createElement("div");
        pickerCard.className = "company-department-view-picker";

        const pickerLabel = document.createElement("label");
        pickerLabel.htmlFor = "companyFilesViewDepartment";
        pickerLabel.textContent = "اختر القسم لعرض ملفاته";

        viewDepartmentPicker = document.createElement("select");
        viewDepartmentPicker.id = "companyFilesViewDepartment";
        viewDepartmentPicker.setAttribute(
            "aria-label",
            "اختر القسم لعرض ملفاته"
        );

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "📂 اختر القسم...";
        viewDepartmentPicker.appendChild(placeholder);

        const pickerHint = document.createElement("small");
        pickerHint.textContent =
            "اختر القسم لعرض الملفات المحفوظة داخله.";

        pickerCard.append(
            pickerLabel,
            viewDepartmentPicker,
            pickerHint
        );

        filesCard.insertBefore(pickerCard, filesStatus);

        // تحميل أقسام الشركة
       

const departmentsQuery = query(
    collection(db, "departments"),
    where("companyId", "==", companyId)
);

const departmentsSnapshot = await getDocs(departmentsQuery);

if (!section.isConnected) return;

const user = auth.currentUser;

if (!user) {
    filesStatus.textContent = "يجب تسجيل الدخول أولًا.";
    return;
}

const allDepartments = departmentsSnapshot.docs.map((departmentDoc) => ({
    id: departmentDoc.id,
    name: departmentDoc.data().name || "قسم بدون اسم"
}));

// تحديد الأقسام التي يحق للمستخدم رؤيتها
const role = currentCompany.userRole;

let visibleDepartments = [];

if (role === "owner" || role === "junior_manager") {
    visibleDepartments = allDepartments;
} else {
    const checks = await Promise.all(
        allDepartments.map(async (department) => {
            const memberRef = doc(
                db,
                "departments",
                department.id,
                "members",
                user.uid
            );

            const memberSnapshot = await getDoc(memberRef);

            return memberSnapshot.exists() ? department : null;
        })
    );

    visibleDepartments = checks.filter(Boolean);
}

// إزالة الخيارات القديمة ومنع تكرار الأقسام
viewDepartmentPicker
    .querySelectorAll('option:not([value=""])')
    .forEach(option => option.remove());

visibleDepartments.sort((a, b) =>
    a.name.localeCompare(b.name, "ar")
);

for (const department of visibleDepartments) {
    const option = document.createElement("option");
    option.value = department.id;
    option.textContent = department.name;
    viewDepartmentPicker.appendChild(option);
}

if (visibleDepartments.length === 0) {
    filesStatus.textContent = "أنت لست عضوًا في أي قسم حاليًا.";
    return;
}


      

        viewDepartmentPicker.addEventListener("change", () => {
            renderSelectedDepartmentFiles(
                viewDepartmentPicker.value
            );
        });

    } else {
        viewDepartmentPicker = pickerCard.querySelector(
            "#companyFilesViewDepartment"
        );
    }

    if (!viewDepartmentPicker || !viewDepartmentPicker.value) {
        filesStatus.textContent =
            "اختر القسم الذي تريد عرض ملفاته.";
        return;
    }

    await renderSelectedDepartmentFiles(
        viewDepartmentPicker.value
    );

} catch (error) {
    console.error("Load department files error:", error);

    filesStatus.textContent =
        error.code === "permission-denied"
            ? "لا توجد صلاحية لقراءة الأقسام أو ملفاتها."
            : "تعذر تحميل ملفات القسم.";
}


}
   

async function renderSelectedDepartmentFiles(departmentId) {
filesList.replaceChildren();


if (!departmentId) {
    filesStatus.textContent = "اختر القسم أولًا.";
    return;
}

filesStatus.textContent = "جارٍ تحميل ملفات القسم...";

try {
    const filesQuery = query(
        collection(db, "companies", companyId, "files"),
        where("visibility", "==", "department"),
        where("departmentId", "==", departmentId)
    );

    const snapshot = await getDocs(filesQuery);

    if (!section.isConnected) return;

    if (snapshot.empty) {
        filesStatus.textContent =
            "لا توجد ملفات محفوظة في هذا القسم حتى الآن.";
        return;
    }

    const documents = [...snapshot.docs];

    documents.sort((a, b) => {
        const dateA = a.data().createdAt?.toMillis?.() || 0;
        const dateB = b.data().createdAt?.toMillis?.() || 0;
        return dateB - dateA;
    });

    for (const fileDocument of documents) {
        const file = fileDocument.data();

        const item = document.createElement("article");
        item.className = "company-file-item";

        const fileName = document.createElement("strong");
        fileName.textContent =
            file.name || file.originalName || "ملف بدون اسم";

        const details = document.createElement("p");

        const sizeMB = (
            (Number(file.fileSize) || 0) / (1024 * 1024)
        ).toFixed(2);

        details.textContent =
            `بواسطة: ${file.uploadedByName || "عضو الشركة"}`
            + ` — الحجم: ${sizeMB} ميجابايت`;

// حاوية الأزرار
const fileActions = document.createElement("div");
fileActions.className = "company-file-actions";

// زر فتح الملف
const openButton = document.createElement("button");
openButton.type = "button";
openButton.textContent = "📂 فتح الملف";

openButton.addEventListener("click", () => {
    if (!file.url) {
        alert("رابط الملف غير متاح.");
        return;
    }

    const fileName = file.originalName || file.name || "";
    const extension = fileName.split(".").pop().toLowerCase();

    // فتح ملفات HTML وHTM في صفحة معاينة جديدة
    if (["html", "htm"].includes(extension)) {
        const previewWindow = window.open("about:blank", "_blank");

        if (!previewWindow) {
            alert("اسمح بفتح النوافذ المنبثقة لهذا الموقع ثم حاول مرة أخرى.");
            return;
        }

        previewWindow.document.title = "معاينة ملف HTML";
        previewWindow.document.body.style.cssText =
            "font-family:Arial,sans-serif;padding:20px;direction:rtl;";

        const message = previewWindow.document.createElement("p");
        message.textContent = "جارٍ تحميل معاينة الملف...";

        const frame = previewWindow.document.createElement("iframe");
        frame.title = "معاينة HTML";
        frame.setAttribute("sandbox", "");
        frame.referrerPolicy = "no-referrer";
        frame.style.cssText =
            "width:100%;height:85vh;border:1px solid #ccc;border-radius:8px;";

        previewWindow.document.body.append(message, frame);

        fetch(file.url)
            .then(response => {
                if (!response.ok) {
                    throw new Error("تعذر جلب الملف.");
                }

                return response.text();
            })
            .then(html => {
                const blob = new Blob([html], {
                    type: "text/html;charset=utf-8"
                });

                frame.src = URL.createObjectURL(blob);
                message.textContent = "معاينة ملف HTML";
            })
            .catch(error => {
                console.error("HTML preview error:", error);

                message.textContent =
                    "تعذرت المعاينة. قد يمنع خادم الملفات الوصول إليه بسبب إعدادات CORS.";
            });

        return;
    }

    // فتح باقي أنواع الملفات بالطريقة المعتادة
    window.open(file.url, "_blank", "noopener,noreferrer");
});



// زر تحميل الملف
const downloadButton = document.createElement("button");
downloadButton.type = "button";
downloadButton.textContent = "📥 تحميل الملف";

downloadButton.addEventListener("click", async () => {
    if (!file.url) {
        alert("رابط الملف غير متاح.");
        return;
    }

    const fileName =
        file.originalName || file.name || "download";

    try {
        if ("showSaveFilePicker" in window) {
            const handle = await window.showSaveFilePicker({
                suggestedName: fileName
            });

            const response = await fetch(file.url);

            if (!response.ok) {
                throw new Error("تعذر تنزيل الملف.");
            }

            const blob = await response.blob();
            const writable = await handle.createWritable();

            await writable.write(blob);
            await writable.close();

            filesStatus.textContent = "تم حفظ الملف بنجاح.";
        } else {
            const link = document.createElement("a");
            link.href = file.url;
            link.download = fileName;
            link.target = "_blank";
            link.rel = "noopener noreferrer";

            document.body.appendChild(link);
            link.click();
            link.remove();
        }
    } catch (error) {
        if (error.name === "AbortError") return;

        console.error("Department file download error:", error);

        alert(
            "تعذر تحميل الملف. تحقق من الاتصال بالإنترنت وإعدادات الوصول إلى الملفات."
        );
    }
});

// إضافة الزرين بجوار بعضهما
fileActions.append(openButton, downloadButton);

item.append(fileName, details, fileActions);
filesList.appendChild(item);


    }

    filesStatus.textContent =
        `عدد ملفات القسم: ${documents.length}`;

} catch (error) {
    console.error("Render department files error:", error);

    filesStatus.textContent =
        error.code === "permission-denied"
            ? "ليس لديك صلاحية لعرض ملفات هذا القسم."
            : "تعذر تحميل ملفات القسم.";
}


}


    // حفظ ملف جديد
    saveButton.addEventListener("click", async () => {
        const file = fileInput.files?.[0];
        const displayName = nameInput.value.trim();
        const visibility = visibilitySelect.value;

        if (!file) {
            uploadStatus.textContent = "اختر ملفًا من جهازك أولًا.";
            return;
        }

        if (!displayName) {
            uploadStatus.textContent = "اكتب اسمًا للملف.";
            nameInput.focus();
            return;
        }
if (visibility === "department" && !departmentSelect.value) {
    uploadStatus.textContent = "اختار القسم الذي تريد حفظ الملف بداخله.";
    departmentSelect.focus();
    return;
}



        if (file.size === 0) {
            uploadStatus.textContent = "الملف فارغ.";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            uploadStatus.textContent =
                "حجم الملف أكبر من الحد الحالي، وهو 10 ميجابايت.";
            return;
        }

        saveButton.disabled = true;
        saveButton.textContent = "جارٍ رفع الملف...";
        uploadStatus.textContent = "جارٍ رفع الملف إلى Cloudinary...";

        try {
            // رفع الملف نفسه
            const uploadedFile = await uploadCompanyFile(file);

            uploadStatus.textContent =
                "تم الرفع. جارٍ حفظ بيانات الملف في قاعدة البيانات...";

            // حفظ بيانات الملف في Firestore
      const fileData = {
    name: displayName,
    originalName: uploadedFile.originalName,
    url: uploadedFile.url,
    publicId: uploadedFile.publicId || "",
    fileType: uploadedFile.fileType,
    fileSize: uploadedFile.fileSize,
    visibility: visibility,
    uploadedBy: user.uid,
    uploadedByName:
        user.displayName || user.email || "عضو الشركة",
    createdAt: serverTimestamp()
};

if (visibility === "department") {
    fileData.departmentId = departmentSelect.value;
}

await addDoc(
    collection(
        db,
        "companies",
        companyId,
        "files"
    ),
    fileData
);

            uploadStatus.textContent =
                "✅ تم رفع الملف وحفظه بنجاح.";

            fileInput.value = "";
            nameInput.value = "";

await loadDepartmentOptions();

if (visibility === "personal") {
    await loadPersonalFiles();
} else if (visibility === "department") {
    await renderSelectedDepartmentFiles(departmentSelect.value);
} else {
    await loadCompanyFiles();
}
        } catch (error) {
           console.error("Save company file error:", {
    code: error.code,
    message: error.message,
    companyId: currentCompany?.id,
    userId: auth.currentUser?.uid,
    userRole: currentCompany?.userRole,
    visibility: visibilitySelect.value,
    departmentId: departmentSelect.value,
    fileName: nameInput.value,
    fileSize: fileInput.files?.[0]?.size
});

            uploadStatus.textContent =
                error.code === "permission-denied"
                    ? "رُفع الملف أو لم يُحفظ، لكن Firestore رفض العملية. راجع القواعد وعضوية المستخدم."
                    : `تعذر حفظ الملف: ${error.message || "حدث خطأ غير معروف."}`;

        } finally {
            saveButton.disabled = false;
            saveButton.textContent = "رفع وحفظ الملف";
        }
    });


// عرض ملفات القسم
departmentFilesButton.addEventListener("click", async () => {
companyFilesButton.classList.remove("active");
departmentFilesButton.classList.add("active");
personalFilesButton.classList.remove("active");


await loadDepartmentFiles();


});



personalFilesButton.addEventListener("click", async () => {
    filesCard.querySelector(
        ".company-department-view-picker"
    )?.remove();

    personalFilesButton.classList.add("active");
    companyFilesButton.classList.remove("active");
    departmentFilesButton.classList.remove("active");

    await loadPersonalFiles();
});




companyFilesButton.addEventListener("click", () => {
filesCard.querySelector(
".company-department-view-picker"
)?.remove();


companyFilesButton.classList.add("active");
departmentFilesButton.classList.remove("active");
personalFilesButton.classList.remove("active");

loadCompanyFiles();


});

companyFilesButton.addEventListener("click", () => {
    filesCard.querySelector(
        ".company-department-view-picker"
    )?.remove();

    companyFilesButton.classList.add("active");
    departmentFilesButton.classList.remove("active");
    personalFilesButton.classList.remove("active");

    loadCompanyFiles();
});

// تحميل الأقسام فقط، دون فتح قائمة الملفات تلقائيًا
await loadDepartmentOptions();
}

