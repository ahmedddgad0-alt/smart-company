import {
    initializeApp,
    getApps
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    writeBatch,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

const app = getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

const joinForm = document.getElementById("joinForm");
const invitationCodeInput = document.getElementById("invitationCode");
const joinButton = document.getElementById("joinButton");
const message = document.getElementById("message");
const backButton = document.getElementById("backButton");

let currentUser = null;
let authReady = false;
let isJoining = false;

function showMessage(text, type = "") {
    message.textContent = text;
    message.className = `message ${type}`;
}

function getErrorMessage(error) {
console.error("Join invitation error details:", error);


if (error.code === "permission-denied") {
    return "تم رفض العملية بواسطة قواعد الأمان. راجع قواعد Firestore.";
}

if (error.code === "unavailable") {
    return "الخدمة غير متاحة حاليًا. تحقق من الإنترنت وحاول مجددًا.";
}

if (error.code === "not-found") {
    return "الدعوة أو الشركة غير موجودة.";
}

return `تعذر قبول الدعوة. ${
    error.code || error.message || "راجع Console لمعرفة التفاصيل."
}`;


}


onAuthStateChanged(auth, (user) => {
    authReady = true;
    currentUser = user;

    if (!user) {
        showMessage(
            "يجب تسجيل الدخول أولًا، ثم العودة إلى هذه الصفحة لقبول الدعوة."
        );

        joinButton.disabled = true;
        return;
    }

    joinButton.disabled = false;

    showMessage(
        `أنت مسجل الدخول بالبريد: ${user.email || "غير متوفر"}`
    );
});

joinForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!authReady) {
        showMessage("جارٍ التحقق من تسجيل الدخول. حاول بعد لحظة.");
        return;
    }

    if (!currentUser) {
        showMessage(
            "سجّل الدخول أولًا من الصفحة الرئيسية، ثم افتح صفحة الدعوة مجددًا.",
            "error"
        );
        return;
    }

    if (isJoining) return;

   const code = invitationCodeInput.value
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();

if (!/^[A-Z0-9]{12}$/.test(code)) {
    showMessage(
        `كود الدعوة يجب أن يتكون من 12 حرفًا أو رقمًا. عدد الخانات المدخلة: ${code.length}`,
        "error"
    );
    return;
}

    isJoining = true;
    joinButton.disabled = true;
    joinButton.textContent = "جارٍ التحقق من الدعوة...";

    try {
        // قراءة الدعوة باستخدام الكود الذي أدخله المستخدم.
        const invitationRef = doc(db, "invitations", code);
        const invitationSnapshot = await getDoc(invitationRef);

        if (!invitationSnapshot.exists()) {
            showMessage("الدعوة غير موجودة أو أن الكود غير صحيح.", "error");
            return;
        }

        const invitation = invitationSnapshot.data();

        if (invitation.status !== "pending") {
            showMessage("تم استخدام هذه الدعوة أو لم تعد صالحة.", "error");
            return;
        }

        const accountEmail = currentUser.email?.trim().toLowerCase();
        const invitedEmail = invitation.email?.trim().toLowerCase();

        if (!accountEmail || accountEmail !== invitedEmail) {
            showMessage(
                `هذه الدعوة مخصصة للبريد ${invitation.email}. سجّل الدخول بهذا البريد لقبولها.`,
                "error"
            );
            return;
        }

        if (
            typeof invitation.companyId !== "string" ||
            !invitation.companyId
        ) {
            showMessage("بيانات الشركة المرتبطة بالدعوة غير صحيحة.", "error");
            return;
        }

        // التأكد من أن الشركة ما زالت موجودة.
     
    


    joinButton.textContent = "جارٍ إتمام الانضمام...";

    // مرجع عضوية الموظف داخل الشركة
    const memberRef = doc(
        db,
        "companies",
        invitation.companyId,
        "members",
        currentUser.uid
    );

    // التأكد من أن الموظف ليس عضوًا بالفعل
    const memberSnapshot = await getDoc(memberRef);

    if (memberSnapshot.exists()) {
        showMessage("أنت عضو بالفعل في هذه الشركة.", "error");
        return;
    }

    // مرجع عضوية الشركة داخل حساب الموظف
    const userMembershipRef = doc(
        db,
        "users",
        currentUser.uid,
        "memberships",
        invitation.companyId
    );

    // مرجع غرفة الموظف الخاصة
    const chatRoomRef = doc(
        db,
        "companies",
        invitation.companyId,
        "chatRooms",
        currentUser.uid
    );

    // تجهيز العمليات الأربع في دفعة واحدة
    const batch = writeBatch(db);

    batch.set(memberRef, {
        uid: currentUser.uid,
        email: currentUser.email,
        role: "employee",
        invitationId: code,
        joinedAt: serverTimestamp()
    });

    batch.set(userMembershipRef, {
        companyId: invitation.companyId,
        companyName: invitation.companyName || "الشركة",
        role: "employee",
        invitationId: code,
        joinedAt: serverTimestamp()
    });

    batch.set(chatRoomRef, {
        ownerId: currentUser.uid,
        name: `غرفة ${currentUser.displayName || currentUser.email || "الموظف"}`,
        invitationId: code,
        createdAt: serverTimestamp()
    });

    batch.update(invitationRef, {
        status: "accepted",
        acceptedBy: currentUser.uid,
        acceptedAt: serverTimestamp()
    });

    // تنفيذ العمليات معًا
    try {
        await batch.commit();
    } catch (error) {
        console.error("Invitation batch failed:", {
            code: error.code,
            message: error.message
        });

        throw error;
    }



// تنفيذ العمليات الثلاث معًا
try {

} catch (error) {
    console.error("Invitation batch failed:", {
        code: error.code,
        message: error.message
    });

    throw error;
}

      showMessage(
    `تم قبول الدعوة والانضمام إلى شركة ${invitation.companyName || "الشركة"} بنجاح!`,
    "success"
); 

        invitationCodeInput.disabled = true;
        joinButton.textContent = "تم الانضمام بنجاح";

        const nextStep = document.createElement("button");
        nextStep.type = "button";
        nextStep.textContent = "العودة إلى شركاتي";
        nextStep.className = "back";

        nextStep.addEventListener("click", () => {
            window.location.href = "./dashboard.html";
        });

        joinForm.appendChild(nextStep);

    } catch (error) {
        showMessage(getErrorMessage(error), "error");
    } finally {
        isJoining = false;

        if (!invitationCodeInput.disabled) {
            joinButton.disabled = false;
            joinButton.textContent = "قبول الدعوة والانضمام";
        }
    }
});

backButton.addEventListener("click", () => {
    window.location.href = "./dashboard.html";
});

console.log("Smart Company invitation acceptance initialized.");