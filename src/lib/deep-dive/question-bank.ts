import type { Department } from "@/lib/supabase/types";
import type { LocalizedText } from "@/lib/assessment/departments";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { CompanyTool } from "@/app/dashboard/tool-map-actions";
import { TOOL_CATALOG } from "@/lib/assessment/tool-catalog";

export type QuestionOption = { value: string; label: LocalizedText };

export type DeepDiveQuestion =
  | { key: string; type: "single_select"; prompt: LocalizedText; options: QuestionOption[] }
  | { key: string; type: "multi_select"; prompt: LocalizedText; options: QuestionOption[]; noneValue: string }
  | { key: string; type: "slider"; prompt: LocalizedText; steps: QuestionOption[] };

// Which catalog tools are relevant to each department, for grounding the
// first question in the user's actual Tool Map instead of a generic prompt.
const DEPARTMENT_CATALOG_IDS: Record<Department, string[]> = {
  digital_marketing: ["instagram", "facebook", "whatsapp_business", "telegram", "meta_ads", "google_ads", "mailchimp", "email"],
  tech_operations: ["zapier", "notion", "trello", "asana", "slack", "teams", "google_workspace", "sheets", "odoo"],
  customer_experience: ["whatsapp", "whatsapp_business", "telegram", "email", "pos", "delivery_apps"],
  data_decision_making: ["sheets", "quickbooks", "zoho_books", "salesforce", "hubspot", "zoho_crm", "bank_portal", "bitrix24"],
  team_readiness: ["hr_payroll", "teams", "slack", "notion", "google_workspace"],
};

export const TOOL_COUNT_OPTIONS: QuestionOption[] = [
  { value: "none", label: { en: "None — mostly manual", ar: "لا شيء — العمل يدوي بالكامل" } },
  { value: "one", label: { en: "Just one", ar: "أداة واحدة فقط" } },
  { value: "two_three", label: { en: "2–3 tools", ar: "من أداتين إلى ثلاث أدوات" } },
  { value: "four_plus", label: { en: "4 or more", ar: "أربع أدوات أو أكثر" } },
];

const GENERIC_TOOL_COUNT_PROMPT: Record<Department, LocalizedText> = {
  digital_marketing: {
    en: "How many different tools do you use to run marketing (ads, analytics, content, messaging)?",
    ar: "كم أداة مختلفة تستخدمها للتسويق (إعلانات، تحليلات، محتوى، رسائل)؟",
  },
  tech_operations: {
    en: "How many different tools or systems does your team juggle to get daily work done?",
    ar: "كم أداة أو نظام مختلف يستخدمه فريقك لإنجاز العمل اليومي؟",
  },
  customer_experience: {
    en: "How many different channels or tools do customers use to reach you (WhatsApp, calls, email, DMs)?",
    ar: "كم قناة أو أداة مختلفة يستخدمها عملاؤك للتواصل معكم (واتساب، اتصال هاتفي، بريد إلكتروني، رسائل مباشرة)؟",
  },
  data_decision_making: {
    en: "How many different places do your numbers and reports live in (spreadsheets, systems, someone's memory)?",
    ar: "كم مكانًا مختلفًا تعيش فيه أرقامكم وتقاريركم (جداول بيانات، أنظمة، ذاكرة أحد الأشخاص)؟",
  },
  team_readiness: {
    en: "How many different tools does your team need training on just to do their jobs?",
    ar: "كم أداة مختلفة يحتاج فريقك إلى التدرب عليها لإنجاز عمله فقط؟",
  },
};

function toolLabel(tool: CompanyTool, lang: EntryLang): string {
  if (tool.catalogId) {
    const found = TOOL_CATALOG.find((c) => c.id === tool.catalogId);
    if (found) return found.label[lang];
  }
  return tool.name;
}

/**
 * Grounds the opening question of each department in the user's own Tool
 * Map when possible — two or more matching tools gets a direct
 * "do these overlap?" question naming them; one match gets a lighter
 * "what else sits alongside it?" question; zero matches falls back to the
 * generic bucketed count question.
 */
export function buildToolQuestion(dept: Department, tools: CompanyTool[], lang: EntryLang): DeepDiveQuestion {
  const relevantIds = new Set(DEPARTMENT_CATALOG_IDS[dept]);
  const matches = tools.filter((t) => t.catalogId && relevantIds.has(t.catalogId));

  if (matches.length >= 2) {
    const nameA = toolLabel(matches[0], lang);
    const nameB = toolLabel(matches[1], lang);
    return {
      key: "tool_overlap",
      type: "single_select",
      prompt: {
        en: `You listed both ${nameA} and ${nameB} for this area — do they serve the same purpose, or different ones?`,
        ar: `ذكرت أنك تستخدم ${nameA} و${nameB} في هذا المجال — هل يؤديان الغرض نفسه، أم أن لكل منهما وظيفة مختلفة؟`,
      },
      options: [
        { value: "same_could_merge", label: { en: "Same purpose — we could probably merge them", ar: "الغرض نفسه — يمكن على الأرجح دمجهما" } },
        { value: "different_need_both", label: { en: "Different purposes — we need both", ar: "أغراض مختلفة — نحتاج إلى كليهما" } },
        { value: "not_sure_overlap", label: { en: "Not sure if there's overlap", ar: "لست متأكدًا مما إذا كان هناك تداخل" } },
        { value: "want_explained", label: { en: "I'd want it explained to me first", ar: "أفضّل أن يشرح لي أحد الفرق أولًا" } },
      ],
    };
  }

  if (matches.length === 1) {
    const name = toolLabel(matches[0], lang);
    return {
      key: "tool_count_single",
      type: "single_select",
      prompt: {
        en: `You're using ${name} for this area — how many OTHER tools do you juggle alongside it?`,
        ar: `أنت تستخدم ${name} في هذا المجال — كم أداة أخرى تستخدمها إلى جانبها؟`,
      },
      options: TOOL_COUNT_OPTIONS,
    };
  }

  return {
    key: "tool_count",
    type: "single_select",
    prompt: GENERIC_TOOL_COUNT_PROMPT[dept],
    options: TOOL_COUNT_OPTIONS,
  };
}

const CHANGE_ATTITUDE_OPTIONS: QuestionOption[] = [
  { value: "saves_time", label: { en: "Save us time and reduce errors", ar: "يوفّر علينا الوقت ويقلل من الأخطاء" } },
  { value: "worried_data", label: { en: "Worry me — I'd be afraid of losing something in the switch", ar: "يثير قلقي — أخشى أن نفقد شيئًا خلال التغيير" } },
  { value: "not_sure_needed", label: { en: "I'm not sure it's even needed for us", ar: "لست متأكدًا من أننا نحتاج إلى ذلك أصلًا" } },
  { value: "want_explained", label: { en: "I'd want someone to walk me through it first", ar: "أفضّل أن يشرح لي أحد ذلك خطوة بخطوة أولًا" } },
];

export const NONE_OPTION: QuestionOption = {
  value: "none_automated",
  label: { en: "None of these — it's mostly organized", ar: "لا شيء من هذا — الوضع منظم في معظمه" },
};

/**
 * Two follow-up questions asked only when at least one real manual task was
 * flagged in `manual_tasks` — feeds the Cost of Inaction labor-cost
 * estimate. Deliberately aggregate (not per-task) and never asks for
 * salary/per-person cost, only hours and headcount.
 */
export const MANUAL_HOURS_QUESTION: DeepDiveQuestion = {
  key: "manual_hours_per_week",
  type: "single_select",
  prompt: {
    en: "Roughly how many hours per week does your team spend on these manual tasks combined?",
    ar: "تقريبًا، كم ساعة في الأسبوع يقضيها فريقكم في هذه المهام اليدوية مجتمعة؟",
  },
  options: [
    { value: "under_5", label: { en: "Under 5 hours/week", ar: "أقل من 5 ساعات أسبوعيًا" } },
    { value: "5_10", label: { en: "5–10 hours/week", ar: "من 5 إلى 10 ساعات أسبوعيًا" } },
    { value: "10_20", label: { en: "10–20 hours/week", ar: "من 10 إلى 20 ساعة أسبوعيًا" } },
    { value: "20_plus", label: { en: "20+ hours/week", ar: "20 ساعة أو أكثر أسبوعيًا" } },
  ],
};

export const MANUAL_HEADCOUNT_QUESTION: DeepDiveQuestion = {
  key: "manual_headcount",
  type: "single_select",
  prompt: {
    en: "How many people are typically involved in this manual work?",
    ar: "كم شخصًا يشارك عادة في هذا العمل اليدوي؟",
  },
  options: [
    { value: "one", label: { en: "1 person", ar: "شخص واحد" } },
    { value: "two_three", label: { en: "2–3 people", ar: "من شخصين إلى ثلاثة أشخاص" } },
    { value: "four_plus", label: { en: "4+ people", ar: "4 أشخاص أو أكثر" } },
  ],
};

const CENTRALIZATION_STEPS_TEMPLATE = (scatteredLabel: LocalizedText, centralizedLabel: LocalizedText): QuestionOption[] => [
  { value: "all_scattered", label: scatteredLabel },
  {
    value: "mostly_scattered",
    label: { en: "Mostly scattered, with a little bit organized", ar: "متفرقة في معظمها، مع تنظيم جزء بسيط منها" },
  },
  {
    value: "mostly_centralized",
    label: { en: "Mostly in one place, with a few gaps", ar: "في مكان واحد في معظمها، مع بعض الفجوات" },
  },
  { value: "fully_centralized", label: centralizedLabel },
];

/**
 * Asked once, before any department, so the structured flow opens with who
 * the owner is and what they actually need — not just their tools. Feeds
 * the same roadmap/raw_inputs pipeline as department answers, stored under
 * the "business_context" pseudo-department (see DeepDiveDepartmentKey in
 * supabase/types.ts) rather than any real Department.
 */
export const BUSINESS_CONTEXT_QUESTIONS: DeepDiveQuestion[] = [
  {
    key: "business_goal",
    type: "single_select",
    prompt: {
      en: "What matters most to you in the next 6–12 months?",
      ar: "ما أهم ما تسعى إليه خلال الأشهر الستة إلى الاثني عشر القادمة؟",
    },
    options: [
      { value: "increase_sales", label: { en: "Increasing sales/revenue", ar: "زيادة المبيعات أو الدخل" } },
      { value: "cut_costs", label: { en: "Cutting costs and time wasted", ar: "تقليل التكاليف والوقت المهدر" } },
      { value: "expand_market", label: { en: "Expanding to new customers or markets", ar: "التوسع نحو عملاء أو أسواق جديدة" } },
      { value: "reduce_dependency", label: { en: "Relying less on me personally to run things", ar: "تقليل الاعتماد عليّ شخصيًا في إدارة الأعمال" } },
      { value: "not_sure", label: { en: "Not sure yet", ar: "لست متأكدًا بعد" } },
    ],
  },
  {
    key: "change_capacity",
    type: "single_select",
    prompt: {
      en: "Realistically, how much time can you personally give to making changes each week?",
      ar: "بواقعية، كم من الوقت يمكنك تخصيصه أسبوعيًا لتطبيق أي تغيير؟",
    },
    options: [
      { value: "under_1h", label: { en: "Less than 1 hour", ar: "أقل من ساعة" } },
      { value: "1_3h", label: { en: "1–3 hours", ar: "من ساعة إلى ثلاث ساعات" } },
      { value: "4_8h", label: { en: "4–8 hours", ar: "من أربع إلى ثماني ساعات" } },
      { value: "delegate", label: { en: "I have someone else who can handle it", ar: "لديّ شخص آخر يمكنه تولي ذلك" } },
    ],
  },
  {
    key: "technical_support",
    type: "single_select",
    prompt: {
      en: "Do you have anyone on your team who's comfortable handling technical/digital tasks?",
      ar: "هل يوجد في فريقك من يستطيع التعامل مع المهام التقنية أو الرقمية بكفاءة؟",
    },
    options: [
      { value: "dedicated_person", label: { en: "Yes, a dedicated person", ar: "نعم، لدي شخص متخصص لذلك" } },
      { value: "occasional_help", label: { en: "Somewhat — someone helps occasionally", ar: "إلى حد ما — يساعد أحد الأشخاص أحيانًا" } },
      { value: "all_on_me", label: { en: "No — it's all on me", ar: "لا، كل شيء يقع على عاتقي" } },
      { value: "not_sure", label: { en: "Not sure", ar: "لست متأكدًا" } },
    ],
  },
  {
    key: "past_attempts",
    type: "single_select",
    prompt: {
      en: "Have you tried adopting a new tool or system before that didn't work out?",
      ar: "هل سبق أن جربت اعتماد أداة أو نظام جديد ولم ينجح معك؟",
    },
    options: [
      { value: "too_complicated", label: { en: "Yes — it was too complicated", ar: "نعم، كان معقدًا أكثر من اللازم" } },
      { value: "team_not_adopted", label: { en: "Yes — the team didn't adopt it", ar: "نعم، لم يعتمده الفريق فعليًا" } },
      { value: "other_reason", label: { en: "Yes — for another reason", ar: "نعم، لسبب آخر" } },
      { value: "nothing_major", label: { en: "No, haven't tried anything major yet", ar: "لا، لم أجرب شيئًا كبيرًا بعد" } },
    ],
  },
  {
    key: "customer_channel_pref",
    type: "single_select",
    prompt: {
      en: "Where do your customers actually prefer to reach you?",
      ar: "أين يفضّل عملاؤك التواصل معكم فعليًا؟",
    },
    options: [
      { value: "whatsapp", label: { en: "WhatsApp", ar: "واتساب" } },
      { value: "social_dms", label: { en: "Instagram/social media DMs", ar: "الرسائل المباشرة عبر إنستغرام أو وسائل التواصل الاجتماعي" } },
      { value: "phone_calls", label: { en: "Phone calls", ar: "المكالمات الهاتفية" } },
      { value: "walk_in", label: { en: "In person / walk-in", ar: "حضوريًا في المتجر" } },
      { value: "not_sure", label: { en: "Not sure", ar: "لست متأكدًا" } },
    ],
  },
];

/**
 * These department-specific follow-ups no longer appear in the structured
 * flow (only the Tool-Map-aware opener does — see buildDeepDiveQuestions),
 * but stay exported: Open Discussion's system prompt reuses their real
 * prompt text as grounded example angles instead of inventing new copy.
 */
export const DEPARTMENT_QUESTIONS: Record<Department, DeepDiveQuestion[]> = {
  digital_marketing: [
    {
      key: "manual_tasks",
      type: "multi_select",
      prompt: {
        en: "Which marketing tasks are still done manually or by memory?",
        ar: "ما مهام التسويق التي ما زلتم تنجزونها يدويًا أو اعتمادًا على الذاكرة؟",
      },
      noneValue: NONE_OPTION.value,
      options: [
        { value: "posting_by_hand", label: { en: "Posting content by hand, one platform at a time", ar: "نشر المحتوى يدويًا، منصة تلو الأخرى" } },
        { value: "tracking_leads_notebook", label: { en: "Tracking leads or inquiries in a notebook or memory", ar: "تتبع العملاء المحتملين في دفتر أو بالاعتماد على الذاكرة" } },
        { value: "replying_dms_manually", label: { en: "Replying to every DM/comment manually, no templates", ar: "الرد على كل رسالة مباشرة أو تعليق يدويًا، دون قوالب جاهزة" } },
        { value: "no_ad_reporting", label: { en: "No regular report on what ads are actually performing", ar: "لا يوجد تقرير دوري عن أداء الإعلانات فعليًا" } },
        NONE_OPTION,
      ],
    },
    {
      key: "change_attitude",
      type: "single_select",
      prompt: {
        en: "If we simplified your marketing tools into fewer, connected ones, that would mostly:",
        ar: "لو تم تبسيط أدوات التسويق إلى أدوات أقل ومترابطة، فإن ذلك على الأرجح:",
      },
      options: CHANGE_ATTITUDE_OPTIONS,
    },
    {
      key: "data_centralization",
      type: "slider",
      prompt: {
        en: "Is your customer/lead data in one place, or scattered across platforms?",
        ar: "هل بيانات عملائك المحتملين في مكان واحد، أم متفرقة بين المنصات؟",
      },
      steps: CENTRALIZATION_STEPS_TEMPLATE(
        { en: "Scattered everywhere — Instagram, WhatsApp, notes, memory", ar: "متفرقة في كل مكان — إنستغرام، واتساب، ملاحظات، الذاكرة" },
        { en: "Fully centralized — one clean source", ar: "منظمة بالكامل — في مصدر واحد واضح" },
      ),
    },
  ],
  tech_operations: [
    {
      key: "manual_tasks",
      type: "multi_select",
      prompt: {
        en: "Which of these still happen manually on your team?",
        ar: "ما الذي ما زال يتم يدويًا في فريقكم من هذه الأمور؟",
      },
      noneValue: NONE_OPTION.value,
      options: [
        { value: "retyping_data", label: { en: "Retyping the same data into more than one system", ar: "إعادة إدخال البيانات نفسها في أكثر من نظام" } },
        { value: "manual_handoffs", label: { en: "Handing off work via WhatsApp/calls instead of a shared system", ar: "تسليم المهام عبر واتساب أو المكالمات بدلًا من نظام مشترك" } },
        { value: "paper_records", label: { en: "Keeping some records on paper or in personal notes", ar: "الاحتفاظ ببعض السجلات على ورق أو في ملاحظات شخصية" } },
        { value: "no_automated_alerts", label: { en: "No automatic alerts when something needs attention", ar: "لا توجد تنبيهات تلقائية عند الحاجة إلى الانتباه لأمر ما" } },
        NONE_OPTION,
      ],
    },
    {
      key: "change_attitude",
      type: "single_select",
      prompt: {
        en: "If we connected your daily tools so data moves between them automatically, that would mostly:",
        ar: "لو تم ربط أدواتكم اليومية بحيث تنتقل البيانات بينها تلقائيًا، فإن ذلك على الأرجح:",
      },
      options: CHANGE_ATTITUDE_OPTIONS,
    },
    {
      key: "data_centralization",
      type: "slider",
      prompt: {
        en: "Are your systems and records centralized, or scattered across separate tools?",
        ar: "هل أنظمتكم وسجلاتكم مركزية، أم متفرقة بين أدوات منفصلة؟",
      },
      steps: CENTRALIZATION_STEPS_TEMPLATE(
        { en: "Scattered across separate tools with no connection between them", ar: "متفرقة بين أدوات منفصلة بلا أي ترابط بينها" },
        { en: "Fully connected — one system, everything talks to everything", ar: "مترابطة بالكامل — نظام واحد يتواصل فيه كل شيء مع الآخر" },
      ),
    },
  ],
  customer_experience: [
    {
      key: "manual_tasks",
      type: "multi_select",
      prompt: {
        en: "Which parts of the customer journey are still handled manually?",
        ar: "ما أجزاء رحلة العميل التي ما زلتم تنجزونها يدويًا؟",
      },
      noneValue: NONE_OPTION.value,
      options: [
        { value: "manual_replies", label: { en: "Answering every customer message one by one, no quick replies", ar: "الرد على كل رسالة من العميل بشكل فردي، دون ردود جاهزة" } },
        { value: "no_order_tracking", label: { en: "No easy way for a customer to check their order/request status", ar: "لا توجد طريقة سهلة يتحقق بها العميل من حالة طلبه" } },
        { value: "manual_followup", label: { en: "Following up with customers by memory, not a system", ar: "متابعة العملاء بالاعتماد على الذاكرة، وليس عبر نظام" } },
        { value: "scattered_history", label: { en: "Customer history scattered across WhatsApp, calls, and notes", ar: "سجل العميل متفرق بين واتساب والاتصالات والملاحظات" } },
        NONE_OPTION,
      ],
    },
    {
      key: "change_attitude",
      type: "single_select",
      prompt: {
        en: "If we set up one shared system for every customer conversation, that would mostly:",
        ar: "لو تم إنشاء نظام واحد مشترك لجميع محادثات العملاء، فإن ذلك على الأرجح:",
      },
      options: CHANGE_ATTITUDE_OPTIONS,
    },
    {
      key: "data_centralization",
      type: "slider",
      prompt: {
        en: "Is each customer's full history in one place, or scattered across WhatsApp, calls, and notes?",
        ar: "هل سجل كل عميل كامل في مكان واحد، أم متفرق بين واتساب والاتصالات والملاحظات؟",
      },
      steps: CENTRALIZATION_STEPS_TEMPLATE(
        { en: "Scattered — every channel has its own piece of the story", ar: "متفرقة — كل قناة تحمل جزءًا من القصة" },
        { en: "Fully unified — one profile per customer, everything in it", ar: "موحّدة بالكامل — ملف واحد لكل عميل يحتوي على كل شيء" },
      ),
    },
    {
      key: "cx_data_tool",
      type: "single_select",
      prompt: {
        en: "What tool (if any) do you currently use to analyze customer data or behavior to improve their experience?",
        ar: "ما الأداة (إن وجدت) التي تستخدمها حاليًا لتحليل بيانات أو سلوك العملاء بهدف تحسين تجربتهم؟",
      },
      options: [
        { value: "dedicated_tool", label: { en: "A dedicated analytics tool", ar: "أداة تحليلات مخصصة" } },
        { value: "spreadsheets", label: { en: "Spreadsheets / manual review", ar: "جداول بيانات / مراجعة يدوية" } },
        { value: "nothing_formal", label: { en: "Nothing formal", ar: "لا يوجد شيء رسمي" } },
        { value: "not_sure", label: { en: "Not sure", ar: "لست متأكدًا" } },
      ],
    },
  ],
  data_decision_making: [
    {
      key: "manual_tasks",
      type: "multi_select",
      prompt: {
        en: "Which of these describe how you currently get your numbers?",
        ar: "ما الذي يصف كيفية وصولكم إلى أرقامكم حاليًا من هذه الخيارات؟",
      },
      noneValue: NONE_OPTION.value,
      options: [
        { value: "manual_export", label: { en: "Manually exporting and combining data from different tools", ar: "تصدير البيانات ودمجها يدويًا من أدوات مختلفة" } },
        { value: "built_by_one_person", label: { en: "Reports are built by one person, by hand, when someone asks", ar: "يُعدّ التقارير شخص واحد يدويًا عند الطلب" } },
        { value: "no_realtime_view", label: { en: "No real-time view of sales/expenses — only end-of-month totals", ar: "لا توجد رؤية فورية للمبيعات أو المصروفات — فقط إجماليات نهاية الشهر" } },
        { value: "gut_feeling_gaps", label: { en: "Some decisions are pure gut feeling because the numbers aren't there", ar: "بعض القرارات تعتمد على الحدس البحت لعدم توفر الأرقام" } },
        NONE_OPTION,
      ],
    },
    {
      key: "change_attitude",
      type: "single_select",
      prompt: {
        en: "If your numbers updated automatically in one dashboard instead of manual reports, that would mostly:",
        ar: "لو كانت أرقامكم تتحدث تلقائيًا في لوحة واحدة بدلًا من التقارير اليدوية، فإن ذلك على الأرجح:",
      },
      options: CHANGE_ATTITUDE_OPTIONS,
    },
    {
      key: "data_centralization",
      type: "slider",
      prompt: {
        en: "Are your numbers and reports centralized in one dashboard, or scattered across spreadsheets and memory?",
        ar: "هل أرقامكم وتقاريركم مركزية في لوحة واحدة، أم متفرقة بين جداول البيانات والذاكرة؟",
      },
      steps: CENTRALIZATION_STEPS_TEMPLATE(
        { en: "Scattered across spreadsheets, systems, and people's heads", ar: "متفرقة بين جداول البيانات والأنظمة وذاكرة الأشخاص" },
        { en: "Fully centralized — one dashboard, always current", ar: "مركزية بالكامل — لوحة واحدة محدّثة دائمًا" },
      ),
    },
  ],
  team_readiness: [
    {
      key: "manual_tasks",
      type: "multi_select",
      prompt: {
        en: "Which of these describe your team today?",
        ar: "ما الذي يصف فريقكم اليوم من هذه الخيارات؟",
      },
      noneValue: NONE_OPTION.value,
      options: [
        { value: "no_formal_training", label: { en: "No formal training when a new tool is introduced", ar: "لا يوجد تدريب رسمي عند إدخال أداة جديدة" } },
        { value: "one_person_bottleneck", label: { en: "Only one person knows how to use a key tool/system", ar: "شخص واحد فقط يعرف كيفية استخدام أداة أو نظام مهم" } },
        { value: "resistant_to_change", label: { en: "Some team members avoid new tools and stick to old habits", ar: "بعض الموظفين يتجنبون الأدوات الجديدة ويلتزمون بعاداتهم القديمة" } },
        { value: "no_clear_ownership", label: { en: "No clear owner for who's responsible for which tool", ar: "لا يوجد مسؤول واضح عن كل أداة" } },
        NONE_OPTION,
      ],
    },
    {
      key: "change_attitude",
      type: "single_select",
      prompt: {
        en: "If your team got proper training and one clear system to follow, that would mostly:",
        ar: "لو حصل فريقكم على تدريب صحيح ونظام واحد واضح يتبعونه، فإن ذلك على الأرجح:",
      },
      options: CHANGE_ATTITUDE_OPTIONS,
    },
    {
      key: "data_centralization",
      type: "slider",
      prompt: {
        en: "Is it clear who's trained on what, or is that scattered/undocumented?",
        ar: "هل من الواضح من المدرَّب على ماذا، أم أن هذا الأمر متفرق وغير موثّق؟",
      },
      steps: CENTRALIZATION_STEPS_TEMPLATE(
        { en: "Scattered — mostly in people's heads, nothing written down", ar: "متفرقة — معظمها في أذهان الأشخاص، ولا شيء مكتوب" },
        { en: "Fully documented — clear who owns and knows what", ar: "موثّقة بالكامل — واضح من المسؤول عن كل أمر وماذا يعرف" },
      ),
    },
  ],
};

/**
 * The structured flow now asks only the Tool-Map-aware opener per
 * department — the deeper manual-tasks / change-attitude /
 * data-centralization questions (DEPARTMENT_QUESTIONS above) moved to Open
 * Discussion's freeform AI so the structured assessment stays short.
 */
export function buildDeepDiveQuestions(dept: Department, tools: CompanyTool[], lang: EntryLang): DeepDiveQuestion[] {
  return [buildToolQuestion(dept, tools, lang)];
}

export const DEEP_DIVE_QUESTIONS_PER_DEPARTMENT = 1;
