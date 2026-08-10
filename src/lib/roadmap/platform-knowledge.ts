/**
 * Reference knowledge about common platforms GCC/Qatar SMEs run on, keyed by
 * the same catalog id used in tool-catalog.ts. Fed into the roadmap prompt
 * whenever a matching tool shows up in the account's Tool Map, so
 * recommendations can name what the platform already does natively instead
 * of generically suggesting "get a reporting tool" when one is often already
 * built in.
 *
 * Kept to durable, well-known capabilities — not plan names, pricing tiers,
 * or anything that changes often enough to go stale and mislead.
 */
export type PlatformKbEntry = {
  catalogId: string;
  displayName: string;
  nativeCapabilities: string[];
  integrationPoints: string[];
  redundancyPatterns: string[];
};

export const PLATFORM_KNOWLEDGE_BASE: PlatformKbEntry[] = [
  {
    catalogId: "shopify",
    displayName: "Shopify",
    nativeCapabilities: [
      "built-in sales, traffic, and conversion analytics/reporting dashboard",
      "native abandoned-cart recovery emails",
      "built-in discount codes and basic customer segmentation",
      "app store for POS, accounting, and marketing integrations without custom development",
    ],
    integrationPoints: [
      "webhooks and a REST/GraphQL Admin API for pushing orders into an accounting system",
      "native or app-based sync with Meta/Google catalogs for ads",
    ],
    redundancyPatterns: [
      "a separate sales/traffic reporting tool is often unnecessary if Shopify's native analytics plus a scheduled export already covers the need",
      "a separate cart-recovery or basic email tool is often redundant with Shopify's built-in abandoned-cart flow for a small catalog",
    ],
  },
  {
    catalogId: "woocommerce",
    displayName: "WooCommerce / WordPress",
    nativeCapabilities: [
      "core order and stock reporting inside WooCommerce Analytics",
      "flexible content/page control via WordPress itself, useful for SEO landing pages",
      "large plugin ecosystem covering most integration needs without custom code",
    ],
    integrationPoints: [
      "REST API for pushing orders/customers into a CRM or accounting tool",
      "plugin-based sync with payment gateways, shipping carriers, and ad platforms",
    ],
    redundancyPatterns: [
      "a bolted-on page builder or separate CMS is often unnecessary since WordPress already covers content editing",
      "basic sales reporting tools are often redundant with WooCommerce Analytics for a single-storefront setup",
    ],
  },
  {
    catalogId: "salla",
    displayName: "Salla",
    nativeCapabilities: [
      "built-in store analytics (sales, visitors, top products) in the merchant dashboard",
      "native abandoned-cart recovery and coupon/discount engine",
      "native integrations with regional payment gateways and shipping/delivery providers",
      "built-in marketing tools (SMS/WhatsApp campaigns in supported plans)",
    ],
    integrationPoints: [
      "Salla's app marketplace and REST API for accounting, CRM, and ads-catalog sync",
      "native WhatsApp Business integration for order updates",
    ],
    redundancyPatterns: [
      "a separate reporting tool is often unnecessary — Salla's dashboard already covers core sales/traffic metrics",
      "manually re-keying orders into WhatsApp for customer updates is often redundant once native WhatsApp order notifications are enabled",
    ],
  },
  {
    catalogId: "zid",
    displayName: "Zid",
    nativeCapabilities: [
      "built-in sales and customer analytics dashboard",
      "native abandoned-cart recovery",
      "native regional payment gateway and shipping/delivery integrations",
      "app marketplace for accounting, marketing, and loyalty extensions",
    ],
    integrationPoints: [
      "Zid's API and app store for accounting sync and marketing-pixel installs",
    ],
    redundancyPatterns: [
      "a separate analytics subscription is often unnecessary if Zid's native dashboard already answers the same questions (top products, repeat customers, channel performance)",
    ],
  },
  {
    catalogId: "magento",
    displayName: "Magento",
    nativeCapabilities: [
      "advanced native catalog, pricing rule, and multi-store management",
      "built-in reporting module (sales, customer segments, product performance)",
    ],
    integrationPoints: [
      "extensive REST/GraphQL API surface for ERP, CRM, and accounting integration",
    ],
    redundancyPatterns: [
      "basic reporting add-ons are often unnecessary given Magento's native reporting module — the gap is usually someone configuring and reviewing it, not a missing tool",
    ],
  },
  {
    catalogId: "bigcommerce",
    displayName: "BigCommerce",
    nativeCapabilities: [
      "built-in analytics dashboard and abandoned-cart recovery",
      "native multi-channel selling (marketplaces, social) without extra middleware for common cases",
    ],
    integrationPoints: [
      "open API for accounting, ERP, and CRM sync",
    ],
    redundancyPatterns: [
      "a separate multi-channel listing tool is often unnecessary for straightforward marketplace/social selling BigCommerce already supports natively",
    ],
  },
  {
    catalogId: "wix",
    displayName: "Wix",
    nativeCapabilities: [
      "native site analytics and basic e-commerce reporting (on commerce plans)",
      "built-in booking, forms, and basic CRM (Wix Contacts/Ascend) without extra tools",
    ],
    integrationPoints: [
      "Wix app market and Velo API for custom integrations",
    ],
    redundancyPatterns: [
      "a separate lightweight CRM or booking tool is often redundant with Wix's built-in Contacts and Bookings for a small team",
    ],
  },
  {
    catalogId: "squarespace",
    displayName: "Squarespace",
    nativeCapabilities: [
      "native analytics dashboard (traffic, sales, top pages)",
      "built-in email campaigns (Squarespace Email Campaigns) tied to the same contact list",
    ],
    integrationPoints: [
      "Squarespace extensions and API for accounting/marketing sync",
    ],
    redundancyPatterns: [
      "a separate email marketing tool is often unnecessary for a small list, since native Email Campaigns already reuses the same site contacts",
    ],
  },
  {
    catalogId: "zoho_crm",
    displayName: "Zoho CRM",
    nativeCapabilities: [
      "native pipeline, deal, and contact-activity tracking",
      "built-in analytics/reporting on pipeline and conversion",
      "native workflow automation for follow-ups",
    ],
    integrationPoints: [
      "part of the wider Zoho suite (Books, Campaigns, Desk) with native cross-app data sharing",
    ],
    redundancyPatterns: [
      "a spreadsheet-based pipeline tracker is almost always redundant once Zoho CRM is in place — the gap is usually adoption/discipline, not a missing tool",
    ],
  },
  {
    catalogId: "zoho_books",
    displayName: "Zoho Books",
    nativeCapabilities: [
      "native invoicing, expense tracking, and financial reporting",
      "built-in bank feed reconciliation",
    ],
    integrationPoints: [
      "native sync with Zoho CRM and Zoho Inventory when both are in use",
    ],
    redundancyPatterns: [
      "manual spreadsheet bookkeeping alongside Zoho Books is usually pure duplication — the native reports typically already cover what the spreadsheet is being used for",
    ],
  },
  {
    catalogId: "hubspot",
    displayName: "HubSpot",
    nativeCapabilities: [
      "native CRM, marketing email, and landing-page tools in one system",
      "built-in reporting on pipeline, campaign, and website performance",
      "native forms and live chat tied directly to CRM contacts",
    ],
    integrationPoints: [
      "broad native/App-Marketplace integrations with ad platforms, e-commerce, and accounting tools",
    ],
    redundancyPatterns: [
      "a separate email marketing tool is usually redundant once HubSpot Marketing Hub is active, since it already shares the same contact/CRM data",
    ],
  },
  {
    catalogId: "whatsapp_business",
    displayName: "WhatsApp Business",
    nativeCapabilities: [
      "native quick replies, labels, and a basic catalog for product listings",
      "native away messages and greeting messages",
      "basic native chat statistics (messages sent/read) in the app",
    ],
    integrationPoints: [
      "WhatsApp Business Platform (Cloud API) for connecting to a CRM or helpdesk for shared-inbox, multi-agent handling",
    ],
    redundancyPatterns: [
      "for a single person handling messages, an extra shared-inbox tool is often unnecessary — WhatsApp Business's own labels and quick replies frequently cover it; a shared-inbox tool becomes worth it once more than one person needs to answer",
    ],
  },
];

export function findPlatformKbEntry(catalogId: string): PlatformKbEntry | undefined {
  return PLATFORM_KNOWLEDGE_BASE.find((entry) => entry.catalogId === catalogId);
}
