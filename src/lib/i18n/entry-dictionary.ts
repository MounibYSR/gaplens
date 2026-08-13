export type EntryLang = "en" | "ar";

export const entryDictionary = {
  en: {
    nav: { login: "Log In", signUp: "Sign Up" },
    hero: {
      badge: "2026 Edition — AI-powered Digital Gap Diagnostics",
      titleLine1: "Stop Losing Customers",
      titleLine2: "to a Broken Digital Operation",
      subtitle:
        "The right digital setup means faster service, happier customers, and more revenue. See exactly where you stand — in under 15 minutes.",
      ctaPrimary: "Start Free Diagnosis",
      ctaSecondary: "How It Works?",
      trust: ["Data Encrypted", "Built for the Gulf", "5 Core Areas"],
    },
    how: {
      badge: "HOW IT WORKS",
      title: "Watch the diagnosis take shape",
      subtitle: "In less than 15 minutes, get a complete diagnosis for your business",
      steps: [
        { num: "01", title: "Create Your Account", body: "Register your business and team size to personalize the diagnosis" },
        { num: "02", title: "Answer Questions", body: "Direct questions covering 5 key digital areas of your business" },
        { num: "03", title: "Get Your Results", body: "A clear gap score revealing where you stand and what to fix" },
        { num: "04", title: "Act On It", body: "Pick how to close each gap: do it yourself, get referred, or automate" },
      ],
    },
    credibility: {
      badge: "BACKED BY",
      title: "Backed by DIC / MCIT",
      body: "GapLens is part of Qatar's Digital Incubation Center, Cohort 12, under the Ministry of Communications and Information Technology.",
      dicLabel: "DIC",
      mcitLabel: "MCIT",
    },
    companies: {
      badge: "Trusted by businesses like yours",
    },
    auth: {
      continueWithGoogle: "Continue with Google",
      orDivider: "or",
      oauthError: "Google sign-in failed or was cancelled. Please try again.",
    },
    login: {
      badge: "GAPLENS.LOGIN",
      title: "Log In",
      email: "Email",
      password: "Password",
      submit: "Log In",
      switchPrompt: "Don't have an account?",
      switchCta: "Create your company account",
    },
    signup: {
      badge: "GAPLENS.SIGNUP",
      title: "Start Scanning Your Company",
      fullName: "Your Name",
      companyName: "Company Name",
      email: "Email",
      password: "Password",
      submit: "Create Account",
      switchPrompt: "Already have an account?",
      switchCta: "Log In",
    },
    footer: "© 2026 GapLens. All rights reserved. Qatar.",
  },
  ar: {
    nav: { login: "تسجيل الدخول", signUp: "إنشاء حساب" },
    hero: {
      badge: "نسخة 2026 — تشخيص ذكي للفجوات الرقمية",
      titleLine1: "توقفي عن خسارة العملاء",
      titleLine2: "بسبب عمليات رقمية مكسورة",
      subtitle:
        "الإعداد الرقمي الصحيح يعني خدمة أسرع، عملاء أسعد، وإيرادات أكثر. شوفي وين تقفين بالضبط — بأقل من 15 دقيقة.",
      ctaPrimary: "ابدأ تشخيصك مجاناً",
      ctaSecondary: "كيف يعمل؟",
      trust: ["بياناتك مشفّرة", "مصمم لسوق الخليج", "5 مجالات رئيسية"],
    },
    how: {
      badge: "كيف يعمل",
      title: "شاهد التشخيص يتشكل",
      subtitle: "في أقل من 15 دقيقة ستحصل على تشخيص كامل لشركتك",
      steps: [
        { num: "01", title: "أنشئ حسابك", body: "سجّل شركتك وحجم فريقك لتخصيص التشخيص" },
        { num: "02", title: "أجب على الأسئلة", body: "أسئلة مباشرة تغطي 5 مجالات رقمية رئيسية في عملك" },
        { num: "03", title: "احصل على نتيجتك", body: "نتيجة فجوة واضحة تكشف وضعك وأولوياتك" },
        { num: "04", title: "ابدأ التنفيذ", body: "اختر كيف تعالج كل فجوة: بنفسك، بترشيح، أو أوتوماتيكياً" },
      ],
    },
    credibility: {
      badge: "بدعم من",
      title: "بدعم من DIC / MCIT",
      body: "GapLens جزء من مركز قطر لاحتضان الأعمال الرقمية (DIC)، الدفعة 12، تحت مظلة وزارة الاتصالات وتكنولوجيا المعلومات.",
      dicLabel: "DIC",
      mcitLabel: "MCIT",
    },
    companies: {
      badge: "موثوق من شركات زي شركتك",
    },
    auth: {
      continueWithGoogle: "المتابعة عبر Google",
      orDivider: "أو",
      oauthError: "تسجيل الدخول عبر Google فشل أو تم إلغاؤه. حاول مرة ثانية.",
    },
    login: {
      badge: "GAPLENS.LOGIN",
      title: "تسجيل الدخول",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      submit: "دخول",
      switchPrompt: "ما عندك حساب؟",
      switchCta: "أنشئ حساب شركتك",
    },
    signup: {
      badge: "GAPLENS.SIGNUP",
      title: "ابدأ فحص شركتك",
      fullName: "اسمك",
      companyName: "اسم الشركة",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      submit: "إنشاء الحساب",
      switchPrompt: "عندك حساب؟",
      switchCta: "تسجيل الدخول",
    },
    footer: "© 2026 GapLens. جميع الحقوق محفوظة. قطر.",
  },
} as const;
