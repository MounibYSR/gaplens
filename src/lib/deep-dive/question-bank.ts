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

const TOOL_COUNT_OPTIONS: QuestionOption[] = [
  { value: "none", label: { en: "None — mostly manual", ar: "ولا وحدة — يدوي بالكامل" } },
  { value: "one", label: { en: "Just one", ar: "وحدة بس" } },
  { value: "two_three", label: { en: "2–3 tools", ar: "أداتين لثلاث" } },
  { value: "four_plus", label: { en: "4 or more", ar: "أربعة أو أكثر" } },
];

const GENERIC_TOOL_COUNT_PROMPT: Record<Department, LocalizedText> = {
  digital_marketing: {
    en: "How many different tools do you use to run marketing (ads, analytics, content, messaging)?",
    ar: "كم أداة مختلفة تستخدمينها للتسويق (إعلانات، تحليلات، محتوى، رسائل)؟",
  },
  tech_operations: {
    en: "How many different tools or systems does your team juggle to get daily work done?",
    ar: "كم أداة أو نظام مختلف يستخدمه فريقك عشان ينجز شغل اليوم؟",
  },
  customer_experience: {
    en: "How many different channels or tools do customers use to reach you (WhatsApp, calls, email, DMs)?",
    ar: "كم قناة أو أداة مختلفة يستخدمها عملاؤك عشان يوصلون لكم (واتساب، اتصال، إيميل، دايركت)؟",
  },
  data_decision_making: {
    en: "How many different places do your numbers and reports live in (spreadsheets, systems, someone's memory)?",
    ar: "كم مكان مختلف تعيش فيه أرقامكم وتقاريركم (شيتات، أنظمة، ذاكرة حد)؟",
  },
  team_readiness: {
    en: "How many different tools does your team need training on just to do their jobs?",
    ar: "كم أداة مختلفة يحتاج فريقك يتدرب عليها بس عشان يسوون شغلهم؟",
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
        ar: `ذكرتِ إنك تستخدمين ${nameA} و${nameB} في هذا المجال — هل يسوّون نفس الشغلة، ولا كل وحدة غرضها مختلف؟`,
      },
      options: [
        { value: "same_could_merge", label: { en: "Same purpose — we could probably merge them", ar: "نفس الغرض — نقدر ندمجهم على الأغلب" } },
        { value: "different_need_both", label: { en: "Different purposes — we need both", ar: "أغراض مختلفة — نحتاج الاثنين" } },
        { value: "not_sure_overlap", label: { en: "Not sure if there's overlap", ar: "مو متأكدة إذا فيه تداخل" } },
        { value: "want_explained", label: { en: "I'd want it explained to me first", ar: "أبي حد يشرحلي الفرق أول" } },
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
        ar: `انتِ تستخدمين ${name} في هذا المجال — كم أداة ثانية تتعاملين وياها جنبه؟`,
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
  { value: "saves_time", label: { en: "Save us time and reduce errors", ar: "توفر علينا وقت وتقلل الأخطاء" } },
  { value: "worried_data", label: { en: "Worry me — I'd be afraid of losing something in the switch", ar: "تقلقني — أخاف نفقد شي بالتغيير" } },
  { value: "not_sure_needed", label: { en: "I'm not sure it's even needed for us", ar: "مو متأكدة إنه أصلاً نحتاجه" } },
  { value: "want_explained", label: { en: "I'd want someone to walk me through it first", ar: "أبي حد يشرحلي وياه خطوة خطوة أول" } },
];

const NONE_OPTION: QuestionOption = {
  value: "none_automated",
  label: { en: "None of these — it's mostly organized", ar: "ولا وحدة من هذي — الوضع منظم أغلبه" },
};

const CENTRALIZATION_STEPS_TEMPLATE = (scatteredLabel: LocalizedText, centralizedLabel: LocalizedText): QuestionOption[] => [
  { value: "all_scattered", label: scatteredLabel },
  {
    value: "mostly_scattered",
    label: { en: "Mostly scattered, with a little bit organized", ar: "متفرقة أغلبها، وشوي منها منظم" },
  },
  {
    value: "mostly_centralized",
    label: { en: "Mostly in one place, with a few gaps", ar: "أغلبها بمكان واحد، وفيه بعض الفجوات" },
  },
  { value: "fully_centralized", label: centralizedLabel },
];

const DEPARTMENT_QUESTIONS: Record<Department, DeepDiveQuestion[]> = {
  digital_marketing: [
    {
      key: "manual_tasks",
      type: "multi_select",
      prompt: {
        en: "Which marketing tasks are still done manually or by memory?",
        ar: "وش مهام التسويق اللي لسا تسوّونها يدوي أو بالذاكرة؟",
      },
      noneValue: NONE_OPTION.value,
      options: [
        { value: "posting_by_hand", label: { en: "Posting content by hand, one platform at a time", ar: "نشر المحتوى يدوي، منصة منصة" } },
        { value: "tracking_leads_notebook", label: { en: "Tracking leads or inquiries in a notebook or memory", ar: "تتبع العملاء المحتملين بدفتر أو بالذاكرة" } },
        { value: "replying_dms_manually", label: { en: "Replying to every DM/comment manually, no templates", ar: "الرد على كل دايركت أو تعليق يدوي، بدون قوالب جاهزة" } },
        { value: "no_ad_reporting", label: { en: "No regular report on what ads are actually performing", ar: "ما فيه تقرير دوري عن أداء الإعلانات فعلياً" } },
        NONE_OPTION,
      ],
    },
    {
      key: "change_attitude",
      type: "single_select",
      prompt: {
        en: "If we simplified your marketing tools into fewer, connected ones, that would mostly:",
        ar: "لو بسّطنا أدوات التسويق لأدوات أقل ومترابطة، هذا غالباً بـ:",
      },
      options: CHANGE_ATTITUDE_OPTIONS,
    },
    {
      key: "data_centralization",
      type: "slider",
      prompt: {
        en: "Is your customer/lead data in one place, or scattered across platforms?",
        ar: "بيانات عملائك المحتملين بمكان واحد، ولا متفرقة بين المنصات؟",
      },
      steps: CENTRALIZATION_STEPS_TEMPLATE(
        { en: "Scattered everywhere — Instagram, WhatsApp, notes, memory", ar: "متفرقة بكل مكان — إنستغرام، واتساب، ملاحظات، ذاكرة" },
        { en: "Fully centralized — one clean source", ar: "منظمة بالكامل — مصدر واحد نظيف" },
      ),
    },
  ],
  tech_operations: [
    {
      key: "manual_tasks",
      type: "multi_select",
      prompt: {
        en: "Which of these still happen manually on your team?",
        ar: "وش من هذي لسا يصير يدوي بفريقكم؟",
      },
      noneValue: NONE_OPTION.value,
      options: [
        { value: "retyping_data", label: { en: "Retyping the same data into more than one system", ar: "إعادة كتابة نفس البيانات بأكثر من نظام" } },
        { value: "manual_handoffs", label: { en: "Handing off work via WhatsApp/calls instead of a shared system", ar: "تسليم الشغل عبر واتساب أو مكالمات بدل نظام مشترك" } },
        { value: "paper_records", label: { en: "Keeping some records on paper or in personal notes", ar: "الاحتفاظ ببعض السجلات على ورق أو ملاحظات شخصية" } },
        { value: "no_automated_alerts", label: { en: "No automatic alerts when something needs attention", ar: "ما فيه تنبيهات تلقائية لما شي يحتاج انتباه" } },
        NONE_OPTION,
      ],
    },
    {
      key: "change_attitude",
      type: "single_select",
      prompt: {
        en: "If we connected your daily tools so data moves between them automatically, that would mostly:",
        ar: "لو ربطنا أدواتكم اليومية عشان البيانات تنتقل بينها تلقائياً، هذا غالباً بـ:",
      },
      options: CHANGE_ATTITUDE_OPTIONS,
    },
    {
      key: "data_centralization",
      type: "slider",
      prompt: {
        en: "Are your systems and records centralized, or scattered across separate tools?",
        ar: "أنظمتكم وسجلاتكم مركزية، ولا متفرقة بين أدوات منفصلة؟",
      },
      steps: CENTRALIZATION_STEPS_TEMPLATE(
        { en: "Scattered across separate tools with no connection between them", ar: "متفرقة بين أدوات منفصلة بدون أي ترابط" },
        { en: "Fully connected — one system, everything talks to everything", ar: "مترابطة بالكامل — نظام واحد وكل شي يتواصل مع بعضه" },
      ),
    },
  ],
  customer_experience: [
    {
      key: "manual_tasks",
      type: "multi_select",
      prompt: {
        en: "Which parts of the customer journey are still handled manually?",
        ar: "وش أجزاء رحلة العميل اللي لسا تسوّونها يدوي؟",
      },
      noneValue: NONE_OPTION.value,
      options: [
        { value: "manual_replies", label: { en: "Answering every customer message one by one, no quick replies", ar: "الرد على كل رسالة عميل وحدة وحدة، بدون ردود جاهزة" } },
        { value: "no_order_tracking", label: { en: "No easy way for a customer to check their order/request status", ar: "ما فيه طريقة سهلة يشيك فيها العميل على حالة طلبه" } },
        { value: "manual_followup", label: { en: "Following up with customers by memory, not a system", ar: "متابعة العملاء بالذاكرة، مو بنظام" } },
        { value: "scattered_history", label: { en: "Customer history scattered across WhatsApp, calls, and notes", ar: "سجل العميل متفرق بين واتساب واتصالات وملاحظات" } },
        NONE_OPTION,
      ],
    },
    {
      key: "change_attitude",
      type: "single_select",
      prompt: {
        en: "If we set up one shared system for every customer conversation, that would mostly:",
        ar: "لو سوينا نظام واحد مشترك لكل محادثات العملاء، هذا غالباً بـ:",
      },
      options: CHANGE_ATTITUDE_OPTIONS,
    },
    {
      key: "data_centralization",
      type: "slider",
      prompt: {
        en: "Is each customer's full history in one place, or scattered across WhatsApp, calls, and notes?",
        ar: "سجل كل عميل كامل بمكان واحد، ولا متفرق بين واتساب واتصالات وملاحظات؟",
      },
      steps: CENTRALIZATION_STEPS_TEMPLATE(
        { en: "Scattered — every channel has its own piece of the story", ar: "متفرقة — كل قناة عندها جزء من القصة" },
        { en: "Fully unified — one profile per customer, everything in it", ar: "موحّدة بالكامل — ملف واحد لكل عميل فيه كل شي" },
      ),
    },
  ],
  data_decision_making: [
    {
      key: "manual_tasks",
      type: "multi_select",
      prompt: {
        en: "Which of these describe how you currently get your numbers?",
        ar: "وش من هذي يوصف كيف توصلون لأرقامكم حالياً؟",
      },
      noneValue: NONE_OPTION.value,
      options: [
        { value: "manual_export", label: { en: "Manually exporting and combining data from different tools", ar: "تصدير ودمج البيانات يدوي من أدوات مختلفة" } },
        { value: "built_by_one_person", label: { en: "Reports are built by one person, by hand, when someone asks", ar: "التقارير يسويها شخص وحد يدوي لما حد يطلبها" } },
        { value: "no_realtime_view", label: { en: "No real-time view of sales/expenses — only end-of-month totals", ar: "ما فيه رؤية فورية للمبيعات أو المصاريف — بس مجاميع آخر الشهر" } },
        { value: "gut_feeling_gaps", label: { en: "Some decisions are pure gut feeling because the numbers aren't there", ar: "بعض القرارات حدس بحت لأن الأرقام مو متوفرة" } },
        NONE_OPTION,
      ],
    },
    {
      key: "change_attitude",
      type: "single_select",
      prompt: {
        en: "If your numbers updated automatically in one dashboard instead of manual reports, that would mostly:",
        ar: "لو أرقامكم تتحدث تلقائياً بلوحة واحدة بدل التقارير اليدوية، هذا غالباً بـ:",
      },
      options: CHANGE_ATTITUDE_OPTIONS,
    },
    {
      key: "data_centralization",
      type: "slider",
      prompt: {
        en: "Are your numbers and reports centralized in one dashboard, or scattered across spreadsheets and memory?",
        ar: "أرقامكم وتقاريركم مركزية بلوحة واحدة، ولا متفرقة بين شيتات وذاكرة؟",
      },
      steps: CENTRALIZATION_STEPS_TEMPLATE(
        { en: "Scattered across spreadsheets, systems, and people's heads", ar: "متفرقة بين شيتات وأنظمة ورؤوس الناس" },
        { en: "Fully centralized — one dashboard, always current", ar: "مركزية بالكامل — لوحة واحدة، دايماً محدثة" },
      ),
    },
  ],
  team_readiness: [
    {
      key: "manual_tasks",
      type: "multi_select",
      prompt: {
        en: "Which of these describe your team today?",
        ar: "وش من هذي يوصف فريقكم اليوم؟",
      },
      noneValue: NONE_OPTION.value,
      options: [
        { value: "no_formal_training", label: { en: "No formal training when a new tool is introduced", ar: "ما فيه تدريب رسمي لما تنجيب أداة جديدة" } },
        { value: "one_person_bottleneck", label: { en: "Only one person knows how to use a key tool/system", ar: "بس شخص وحد يعرف يستخدم أداة أو نظام مهم" } },
        { value: "resistant_to_change", label: { en: "Some team members avoid new tools and stick to old habits", ar: "بعض الموظفين يتجنبون الأدوات الجديدة ويلتزمون بعاداتهم القديمة" } },
        { value: "no_clear_ownership", label: { en: "No clear owner for who's responsible for which tool", ar: "ما فيه مسؤول واضح عن كل أداة" } },
        NONE_OPTION,
      ],
    },
    {
      key: "change_attitude",
      type: "single_select",
      prompt: {
        en: "If your team got proper training and one clear system to follow, that would mostly:",
        ar: "لو فريقكم أخذ تدريب صح ونظام واحد واضح يتبعونه، هذا غالباً بـ:",
      },
      options: CHANGE_ATTITUDE_OPTIONS,
    },
    {
      key: "data_centralization",
      type: "slider",
      prompt: {
        en: "Is it clear who's trained on what, or is that scattered/undocumented?",
        ar: "واضح مين مدرب على وش، ولا هذا الشي متفرق وغير موثّق؟",
      },
      steps: CENTRALIZATION_STEPS_TEMPLATE(
        { en: "Scattered — mostly in people's heads, nothing written down", ar: "متفرقة — أغلبها برؤوس الناس، ولا شي مكتوب" },
        { en: "Fully documented — clear who owns and knows what", ar: "موثّقة بالكامل — واضح مين مسؤول عن وش ويعرف وش" },
      ),
    },
  ],
};

/**
 * Full 4-question set for a department: a Tool-Map-aware opener, then the
 * static manual-tasks / change-attitude / data-centralization questions.
 */
export function buildDeepDiveQuestions(dept: Department, tools: CompanyTool[], lang: EntryLang): DeepDiveQuestion[] {
  return [buildToolQuestion(dept, tools, lang), ...DEPARTMENT_QUESTIONS[dept]];
}

export const DEEP_DIVE_QUESTIONS_PER_DEPARTMENT = 4;
