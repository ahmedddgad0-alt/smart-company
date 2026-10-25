// =====================================
// Smart Company - Global Language System
// =====================================

(function () {
    // منع تكرار إنشاء الزر في الصفحة
    if (document.getElementById("google_translate_element")) {
        return;
    }

    // إنشاء حاوية زر اللغة
    const languageBox = document.createElement("div");
    languageBox.id = "language-switcher";

    languageBox.innerHTML = `
        <span class="language-icon">🌐</span>
        <div id="google_translate_element"></div>
    `;

    document.body.appendChild(languageBox);

    // تنسيق الزر
    const style = document.createElement("style");

  
style.textContent = `

#language-switcher {
    position: fixed;
    top: 16px;
    right: 16px;
    left: auto;
    transform: none;
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    padding: 0;
    background: rgba(17, 24, 45, 0.96);
    border: 1px solid rgba(96, 165, 250, 0.45);
    border-radius: 14px;
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.22);
    backdrop-filter: blur(12px);
    transition: border-color 0.25s ease;
}

#language-switcher:hover {
    border-color: #60a5fa;
    transform: none;
}

#language-switcher .language-icon {
    font-size: 25px;
}


#google_translate_element {
    position: absolute;
    inset: 0;
    width: 48px;
    height: 48px;
    overflow: hidden;
    z-index: 2;
}

#google_translate_element .goog-te-gadget {
    font-size: 0 !important;
    color: transparent !important;
}

#google_translate_element .goog-te-gadget span,
#google_translate_element .goog-logo-link,
#google_translate_element a {
    display: none !important;
}

#google_translate_element select {
    position: absolute;
    inset: 0;
    width: 48px;
    height: 48px;
    opacity: 0;
    cursor: pointer;
    z-index: 5;
    background: transparent;
    border: 0;
}



#google_translate_element select {
    position: absolute;
    inset: 0;
    width: 48px;
    height: 48px;
    opacity: 0;
    cursor: pointer;
}



`;


// إخفاء شريط Google Translate عند ظهوره
function hideGoogleTranslateBanner() {
    const selectors = [
        ".goog-te-banner-frame",
        "iframe.goog-te-banner-frame",
        ".skiptranslate iframe",
        "#goog-gt-tt"
    ];

    document.querySelectorAll(selectors.join(",")).forEach((element) => {
        element.style.setProperty("display", "none", "important");
        element.style.setProperty("visibility", "hidden", "important");
        element.style.setProperty("height", "0", "important");
    });

    // منع المساحة العلوية التي قد يتركها الشريط
    document.documentElement.style.setProperty("top", "0", "important");
    document.body.style.setProperty("top", "0", "important");
}

// تشغيل الفحص باستمرار لأن Google قد يعيد إنشاء الشريط
hideGoogleTranslateBanner();

const translateBannerObserver = new MutationObserver(() => {
    hideGoogleTranslateBanner();
});

translateBannerObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class"]
});



    document.head.appendChild(style);

    // إعداد الترجمة
    window.googleTranslateElementInit = function () {
        new google.translate.TranslateElement(
            {
                pageLanguage: "ar",
                includedLanguages: "ar,en",
                autoDisplay: false
            },
            "google_translate_element"
        );
    };


function updateLanguageLabels() {
    const select = document.querySelector("#google_translate_element select");

    if (!select) return;

    const isEnglish = document.documentElement.lang.toLowerCase().startsWith("en");

    const arabicOption = [...select.options].find(option =>
        option.value === "ar"
    );

    const englishOption = [...select.options].find(option =>
        option.value === "en"
    );

    if (isEnglish) {
        if (arabicOption) arabicOption.textContent = "عربي";
        if (englishOption) englishOption.textContent = "اختيار اللغة";
    } else {
        if (arabicOption) arabicOption.textContent = "Choose Language";
        if (englishOption) englishOption.textContent = "English";
    }
}

const languageLabelObserver = new MutationObserver(updateLanguageLabels);

languageLabelObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"]
});

setInterval(updateLanguageLabels, 1000);


    // تحميل مكتبة Google Translate
    const script = document.createElement("script");

    script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";

    script.async = true;

    document.head.appendChild(script);
})();

function togglePasswordVisibility(inputId, button) {
    const passwordInput = document.getElementById(inputId);

    if (!passwordInput) return;

    const isHidden = passwordInput.type === "password";

    passwordInput.type = isHidden ? "text" : "password";

    button.textContent = isHidden ? "🙈" : "👁️";

    button.setAttribute(
        "aria-label",
        isHidden ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
    );

    button.setAttribute(
        "title",
        isHidden ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
    );
}