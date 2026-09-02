import type { Department } from "@/lib/supabase/types";
import type { LocalizedText } from "@/lib/assessment/departments";

export const DEEP_DIVE_FALLBACK_FOLLOWUPS: Record<Department, LocalizedText> = {
  digital_marketing: {
    ar: "ما أكبر تحدٍ يواجهكم في طريقة وصولكم إلى العملاء أو تحويلهم إلى عملاء فعليين؟",
    en: "What's the biggest challenge with how you currently reach or convert customers?",
  },
  tech_operations: {
    ar: "أين تكمن أكبر نقطة احتكاك في الأدوات أو الأنظمة التي تعتمدون عليها يوميًا؟",
    en: "What's the biggest friction point in the tools or systems you rely on day to day?",
  },
  customer_experience: {
    ar: "ما أكبر تحدٍ في طريقة تواصل العملاء معكم أو حصولهم على رد؟",
    en: "What's the biggest challenge in how customers reach you or get responses?",
  },
  data_decision_making: {
    ar: "ما أكبر تحدٍ في الحصول على الأرقام التي تحتاجونها لاتخاذ القرار؟",
    en: "What's the biggest challenge in getting the numbers you need to make decisions?",
  },
  team_readiness: {
    ar: "ما أكبر تحدٍ في طريقة تبني فريقكم لأدوات أو أنظمة جديدة أو مواكبتها؟",
    en: "What's the biggest challenge in how your team adopts or keeps up with new tools/processes?",
  },
};

export const DEEP_DIVE_OPENERS: Record<Department, LocalizedText> = {
  digital_marketing: {
    ar: "حدّثني أكثر عن التسويق الرقمي لديكم — ما الذي ينجح، وما الذي يثير إحباطك فيه؟",
    en: "Tell me more about digital marketing at your business — what's working, and what's frustrating?",
  },
  tech_operations: {
    ar: "حدّثني عن الأدوات والأنظمة التي يستخدمها فريقك يوميًا — أين تشعرون باحتكاك أو تكرار في العمل؟",
    en: "Walk me through the tools and systems your team uses daily — where do you feel friction or repeated work?",
  },
  customer_experience: {
    ar: "كيف تبدو رحلة العميل لديكم من أول تواصل إلى ما بعد البيع؟ أين تشعرون بأنها تضعف؟",
    en: "What does the customer journey look like end to end — from first contact to after the sale? Where does it feel weakest?",
  },
  data_decision_making: {
    ar: "عندما تتخذون قرارًا مهمًا في الشركة، على ماذا تعتمدون فعليًا؟ أرقام، أم حدس، أم القليل من كل منهما؟",
    en: "When you make an important business decision, what do you actually rely on — numbers, gut feeling, or a bit of both?",
  },
  team_readiness: {
    ar: "حدّثني عن فريقك من ناحية الجاهزية الرقمية — من المتحمس، ومن المتردد، ولماذا؟",
    en: "Tell me about your team's digital readiness — who's on board, who's hesitant, and why?",
  },
};
