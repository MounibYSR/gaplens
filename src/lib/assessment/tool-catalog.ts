import type { LocalizedText } from "@/lib/assessment/departments";

export type ToolCatalogItem = { id: string; label: LocalizedText };

export const OTHER_TOOL_ID = "__other__";

export const TOOL_CATALOG: ToolCatalogItem[] = [
  { id: "whatsapp", label: { en: "WhatsApp", ar: "واتساب" } },
  { id: "whatsapp_business", label: { en: "WhatsApp Business", ar: "واتساب بيزنس" } },
  { id: "instagram", label: { en: "Instagram", ar: "إنستغرام" } },
  { id: "facebook", label: { en: "Facebook Page / Business Suite", ar: "فيسبوك / بزنس سويت" } },
  { id: "telegram", label: { en: "Telegram", ar: "تيليجرام" } },
  { id: "email", label: { en: "Email (Gmail / Outlook)", ar: "البريد الإلكتروني (Gmail / Outlook)" } },
  { id: "slack", label: { en: "Slack", ar: "Slack" } },
  { id: "teams", label: { en: "Microsoft Teams", ar: "Microsoft Teams" } },
  { id: "sheets", label: { en: "Excel / Google Sheets", ar: "إكسل / جوجل شيتس" } },
  { id: "google_workspace", label: { en: "Google Workspace", ar: "Google Workspace" } },
  { id: "notion", label: { en: "Notion", ar: "Notion" } },
  { id: "trello", label: { en: "Trello", ar: "Trello" } },
  { id: "asana", label: { en: "Asana", ar: "Asana" } },
  { id: "zapier", label: { en: "Zapier", ar: "Zapier" } },
  { id: "salesforce", label: { en: "Salesforce", ar: "Salesforce" } },
  { id: "hubspot", label: { en: "HubSpot", ar: "HubSpot" } },
  { id: "zoho_crm", label: { en: "Zoho CRM", ar: "Zoho CRM" } },
  { id: "bitrix24", label: { en: "Bitrix24", ar: "Bitrix24" } },
  { id: "quickbooks", label: { en: "QuickBooks", ar: "QuickBooks" } },
  { id: "zoho_books", label: { en: "Zoho Books", ar: "Zoho Books" } },
  { id: "odoo", label: { en: "Odoo", ar: "Odoo" } },
  { id: "shopify", label: { en: "Shopify", ar: "Shopify" } },
  { id: "woocommerce", label: { en: "WooCommerce / WordPress", ar: "WooCommerce / ووردبريس" } },
  { id: "salla", label: { en: "Salla", ar: "سلة" } },
  { id: "zid", label: { en: "Zid", ar: "زد" } },
  { id: "magento", label: { en: "Magento", ar: "Magento" } },
  { id: "bigcommerce", label: { en: "BigCommerce", ar: "BigCommerce" } },
  { id: "wix", label: { en: "Wix", ar: "Wix" } },
  { id: "squarespace", label: { en: "Squarespace", ar: "Squarespace" } },
  { id: "meta_ads", label: { en: "Meta Ads Manager", ar: "Meta Ads Manager" } },
  { id: "google_ads", label: { en: "Google Ads", ar: "Google Ads" } },
  { id: "mailchimp", label: { en: "Mailchimp", ar: "Mailchimp" } },
  { id: "pos", label: { en: "Point of Sale (POS) system", ar: "نظام نقاط البيع (POS)" } },
  { id: "delivery_apps", label: { en: "Delivery apps (Talabat/Snoonu)", ar: "تطبيقات التوصيل (Talabat/Snoonu)" } },
  { id: "bank_portal", label: { en: "Bank's online portal", ar: "بوابة البنك الإلكترونية" } },
  { id: "hr_payroll", label: { en: "HR / payroll system", ar: "نظام موارد بشرية / رواتب" } },
];
