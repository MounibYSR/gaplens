import type { Department } from "@/lib/supabase/types";
import type { LocalizedText } from "@/lib/assessment/departments";

export const DEEP_DIVE_FALLBACK_FOLLOWUPS: Record<Department, LocalizedText> = {
  digital_marketing: {
    ar: "وش أكبر تحدي في طريقة وصولكم للعملاء أو تحويلهم لعملاء فعليين؟",
    en: "What's the biggest challenge with how you currently reach or convert customers?",
  },
  tech_operations: {
    ar: "وين أكبر نقطة احتكاك في الأدوات أو الأنظمة اللي تعتمدون عليها يوميًا؟",
    en: "What's the biggest friction point in the tools or systems you rely on day to day?",
  },
  customer_experience: {
    ar: "وش أكبر تحدي في طريقة توصل العملاء لكم أو حصولهم على رد؟",
    en: "What's the biggest challenge in how customers reach you or get responses?",
  },
  data_decision_making: {
    ar: "وش أكبر تحدي في الحصول على الأرقام اللي تحتاجونها لاتخاذ القرار؟",
    en: "What's the biggest challenge in getting the numbers you need to make decisions?",
  },
  team_readiness: {
    ar: "وش أكبر تحدي في طريقة تبني فريقكم لأدوات أو أنظمة جديدة أو مواكبتهم لها؟",
    en: "What's the biggest challenge in how your team adopts or keeps up with new tools/processes?",
  },
};

export const DEEP_DIVE_OPENERS: Record<Department, LocalizedText> = {
  digital_marketing: {
    ar: "احكيلي أكثر عن التسويق الرقمي عندكم — وش اللي شغال، ووش اللي يحبطك فيه؟",
    en: "Tell me more about digital marketing at your business — what's working, and what's frustrating?",
  },
  tech_operations: {
    ar: "احكيلي عن الأدوات والأنظمة اللي يستخدمها فريقك يوميًا — وين تحسون فيه احتكاك أو تكرار شغل؟",
    en: "Walk me through the tools and systems your team uses daily — where do you feel friction or repeated work?",
  },
  customer_experience: {
    ar: "وش شكل رحلة العميل عندكم من أول تواصل إلى ما بعد البيع؟ وين تحسون إنها تضعف؟",
    en: "What does the customer journey look like end to end — from first contact to after the sale? Where does it feel weakest?",
  },
  data_decision_making: {
    ar: "لما تاخذون قرار مهم بالشركة، وش تعتمدون عليه فعليًا؟ أرقام، حدس، ولا شوي من كل شي؟",
    en: "When you make an important business decision, what do you actually rely on — numbers, gut feeling, or a bit of both?",
  },
  team_readiness: {
    ar: "احكيلي عن فريقك من ناحية الجاهزية الرقمية — مين متحمس، ومين متردد، وليش؟",
    en: "Tell me about your team's digital readiness — who's on board, who's hesitant, and why?",
  },
};
