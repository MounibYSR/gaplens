import type { Department } from "@/lib/supabase/types";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";

export type LocalizedText = { ar: string; en: string };
export type ScaleOption = { label: LocalizedText; value: number };

export type Question =
  | { id: string; type: "scale"; text: LocalizedText; options: ScaleOption[] }
  | {
      id: string;
      type: "percentage";
      text: LocalizedText;
      lowLabel: LocalizedText;
      highLabel: LocalizedText;
      invert?: boolean;
    }
  | { id: string; type: "binary"; text: LocalizedText; yes: ScaleOption; no: ScaleOption };

export type DepartmentDef = {
  key: Department;
  code: string;
  title: LocalizedText;
  accent: string;
  questions: Question[];
  insight: (score: number, lang: EntryLang) => string;
};

const FREQ: ScaleOption[] = [
  { label: { ar: "نادرًا", en: "Rarely" }, value: 10 },
  { label: { ar: "أحيانًا", en: "Sometimes" }, value: 40 },
  { label: { ar: "غالبًا", en: "Often" }, value: 70 },
  { label: { ar: "دائمًا", en: "Always" }, value: 95 },
];

const CONFIDENCE: ScaleOption[] = [
  { label: { ar: "لا أثق إطلاقًا", en: "No confidence" }, value: 10 },
  { label: { ar: "أثق نوعًا ما", en: "Somewhat confident" }, value: 40 },
  { label: { ar: "أثق", en: "Confident" }, value: 70 },
  { label: { ar: "أثق تمامًا", en: "Fully confident" }, value: 95 },
];

const RESPONSE_TIME: ScaleOption[] = [
  { label: { ar: "خلال دقائق", en: "Within minutes" }, value: 95 },
  { label: { ar: "خلال ساعات", en: "Within hours" }, value: 65 },
  { label: { ar: "خلال يوم", en: "Within a day" }, value: 35 },
  { label: { ar: "أكثر من يوم", en: "More than a day" }, value: 10 },
];

export const DEPARTMENTS: DepartmentDef[] = [
  {
    key: "digital_marketing",
    code: "DIGITAL_MARKETING.SCAN",
    title: { ar: "التسويق الرقمي", en: "Digital Marketing" },
    accent: "#15c99a",
    questions: [
      {
        id: "channels",
        type: "percentage",
        text: {
          ar: "وش نسبة اعتمادكم على قنوات رقمية لجذب عملاء جدد؟",
          en: "What share of new customer acquisition relies on digital channels?",
        },
        lowLabel: { ar: "شبه معدوم", en: "Almost none" },
        highLabel: { ar: "اعتماد كامل", en: "Fully reliant" },
      },
      {
        id: "content_plan",
        type: "binary",
        text: { ar: "هل عندكم خطة محتوى واضحة قبل النشر؟", en: "Do you have a clear content plan before publishing?" },
        yes: { label: { ar: "عندنا خطة واضحة", en: "We have a clear plan" }, value: 90 },
        no: { label: { ar: "ننشر بدون خطة", en: "We publish without a plan" }, value: 15 },
      },
      {
        id: "ad_tracking",
        type: "scale",
        text: { ar: "هل تتابعون أداء الإعلانات بأرقام فعلية؟", en: "Do you track ad performance with real numbers?" },
        options: FREQ,
      },
      {
        id: "brand_consistency",
        type: "binary",
        text: { ar: "هل هوية العلامة موحدة عبر كل القنوات؟", en: "Is brand identity consistent across all channels?" },
        yes: { label: { ar: "موحدة تمامًا", en: "Fully consistent" }, value: 90 },
        no: { label: { ar: "متفاوتة", en: "Inconsistent" }, value: 20 },
      },
    ],
    insight: (score, lang) => {
      if (lang === "en") {
        return score >= 70
          ? "Solid marketing visibility, limited gap."
          : score >= 40
            ? "Partial visibility, a clear measurement gap."
            : "No clear view of digital marketing performance.";
      }
      return score >= 70
        ? "وضوح تسويقي جيد، الفجوة محدودة."
        : score >= 40
          ? "وضوح تسويقي جزئي، فجوة واضحة بالقياس."
          : "لا توجد رؤية واضحة لأداء التسويق الرقمي.";
    },
  },
  {
    key: "tech_operations",
    code: "TECH_OPERATIONS.SCAN",
    title: { ar: "العمليات التقنية وحزمة الأدوات", en: "Tech Operations & Tool Stack" },
    accent: "#1d9e75",
    questions: [
      {
        id: "manual_tasks",
        type: "percentage",
        text: {
          ar: "وش نسبة اعتمادكم على أدوات يدوية بدل الأتمتة؟",
          en: "What share of your operations still relies on manual tools instead of automation?",
        },
        lowLabel: { ar: "أتمتة كاملة", en: "Fully automated" },
        highLabel: { ar: "يدوي بالكامل", en: "Fully manual" },
        invert: true,
      },
      {
        id: "tool_integration",
        type: "scale",
        text: { ar: "هل الأدوات التقنية عندكم مرتبطة ببعض؟", en: "Are your tools connected to each other?" },
        options: FREQ,
      },
      {
        id: "data_duplication",
        type: "binary",
        text: {
          ar: "هل نفس البيانات تتكرر إدخالها في أكثر من نظام؟",
          en: "Is the same data re-entered across more than one system?",
        },
        yes: { label: { ar: "نعم، تتكرر كثيرًا", en: "Yes, frequently" }, value: 15 },
        no: { label: { ar: "لا، مصدر واحد", en: "No, single source" }, value: 90 },
      },
    ],
    insight: (score, lang) => {
      if (lang === "en") {
        return score >= 70
          ? "Strong integration across tools."
          : score >= 40
            ? "Noticeable tool sprawl, an integration gap."
            : "Heavy manual reliance, a significant operational gap.";
      }
      return score >= 70
        ? "تكامل تقني قوي بين الأدوات."
        : score >= 40
          ? "تشتت واضح في الأدوات، فجوة في التكامل."
          : "اعتماد يدوي كبير، فجوة تشغيلية عالية.";
    },
  },
  {
    key: "customer_experience",
    code: "CUSTOMER_EXPERIENCE.SCAN",
    title: { ar: "تجربة العملاء", en: "Customer Experience" },
    accent: "#e8a020",
    questions: [
      {
        id: "response_time",
        type: "scale",
        text: { ar: "كم يستغرق الرد على استفسار عميل جديد؟", en: "How long does it take to respond to a new customer inquiry?" },
        options: RESPONSE_TIME,
      },
      {
        id: "history_access",
        type: "binary",
        text: {
          ar: "هل يقدر فريقك يشوف سجل العميل كامل بسرعة؟",
          en: "Can your team see a customer's full history quickly?",
        },
        yes: { label: { ar: "نعم، بضغطة واحدة", en: "Yes, one click away" }, value: 90 },
        no: { label: { ar: "لا، يحتاج وقت وبحث", en: "No, it takes time to find" }, value: 20 },
      },
      {
        id: "feedback_loop",
        type: "percentage",
        text: {
          ar: "وش نسبة العملاء اللي تجمعون ملاحظاتهم بشكل منظم؟",
          en: "What share of customers do you systematically collect feedback from?",
        },
        lowLabel: { ar: "لا نجمع شي", en: "We collect none" },
        highLabel: { ar: "نجمع من الكل", en: "We collect from all" },
      },
    ],
    insight: (score, lang) => {
      if (lang === "en") {
        return score >= 70
          ? "Consistent, fast customer experience."
          : score >= 40
            ? "Inconsistent customer experience, a consistency gap."
            : "No clear system for tracking customer experience.";
      }
      return score >= 70
        ? "تجربة عملاء متسقة وسريعة."
        : score >= 40
          ? "تجربة عملاء متذبذبة، فجوة في الاتساق."
          : "لا نظام واضح لمتابعة تجربة العميل.";
    },
  },
  {
    key: "data_decision_making",
    code: "DATA_DECISIONS.SCAN",
    title: { ar: "البيانات واتخاذ القرار", en: "Data & Decision-Making" },
    accent: "#c9a015",
    questions: [
      {
        id: "dashboards",
        type: "binary",
        text: {
          ar: "هل عندكم لوحة أرقام تراجعونها بشكل دوري؟",
          en: "Do you have a numbers dashboard you review regularly?",
        },
        yes: { label: { ar: "نعم، لوحة واضحة", en: "Yes, a clear dashboard" }, value: 90 },
        no: { label: { ar: "لا، ما فيه لوحة", en: "No dashboard" }, value: 15 },
      },
      {
        id: "decisions_on_data",
        type: "percentage",
        text: {
          ar: "وش نسبة القرارات المبنية على بيانات فعلية مقابل الحدس؟",
          en: "What share of decisions are based on real data versus gut feeling?",
        },
        lowLabel: { ar: "حدس بالكامل", en: "Entirely gut feeling" },
        highLabel: { ar: "بيانات بالكامل", en: "Entirely data-driven" },
      },
      {
        id: "data_accuracy",
        type: "scale",
        text: { ar: "هل تثقون في دقة الأرقام المتوفرة لديكم؟", en: "Do you trust the accuracy of the numbers you have?" },
        options: CONFIDENCE,
      },
    ],
    insight: (score, lang) => {
      if (lang === "en") {
        return score >= 70
          ? "Decisions are backed by reliable data."
          : score >= 40
            ? "Data is partially available, a trust gap remains."
            : "Decisions rely more on intuition than data.";
      }
      return score >= 70
        ? "قرارات مبنية على بيانات موثوقة."
        : score >= 40
          ? "بيانات متوفرة جزئيًا، فجوة في الثقة بها."
          : "القرارات تعتمد على الحدس أكثر من البيانات.";
    },
  },
  {
    key: "team_readiness",
    code: "TEAM_READINESS.SCAN",
    title: { ar: "الفريق والجاهزية الرقمية", en: "Human Resources & Digital Readiness" },
    accent: "#20c9c2",
    questions: [
      {
        id: "training",
        type: "binary",
        text: {
          ar: "هل فريقك مدرب على الأدوات الرقمية المستخدمة؟",
          en: "Is your team trained on the digital tools in use?",
        },
        yes: { label: { ar: "نعم، مدرب جيدًا", en: "Yes, well trained" }, value: 90 },
        no: { label: { ar: "لا، بدون تدريب", en: "No training" }, value: 15 },
      },
      {
        id: "ownership",
        type: "scale",
        text: {
          ar: "هل كل عضو يعرف مسؤولياته الرقمية بوضوح؟",
          en: "Does every team member clearly know their digital responsibilities?",
        },
        options: FREQ,
      },
      {
        id: "resistance",
        type: "percentage",
        text: {
          ar: "وش نسبة مقاومة الفريق لتبني أدوات جديدة؟",
          en: "How much does your team resist adopting new tools?",
        },
        lowLabel: { ar: "متقبلين تمامًا", en: "Fully receptive" },
        highLabel: { ar: "مقاومة كبيرة", en: "Strong resistance" },
        invert: true,
      },
    ],
    insight: (score, lang) => {
      if (lang === "en") {
        return score >= 70
          ? "Team is digitally ready and open to growth."
          : score >= 40
            ? "Partial readiness, a training or adoption gap."
            : "Significant gap in team digital readiness.";
      }
      return score >= 70
        ? "فريق جاهز رقميًا ومتقبل للتطوير."
        : score >= 40
          ? "جاهزية جزئية، فجوة في التدريب أو التبني."
          : "فجوة كبيرة في جاهزية الفريق الرقمية.";
    },
  },
];

export function scoreToGap(score: number) {
  return Math.max(0, 100 - score);
}
