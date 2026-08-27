import puppeteer from "puppeteer";

const HEADER_FOOTER_STYLE = `font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 8px; color: #6B7688; width: 100%; padding: 0 48px; margin: 0;`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function renderHtmlToPdf(
  html: string,
  header: { companyName: string; generatedMonthYear: string },
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "a4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="${HEADER_FOOTER_STYLE} text-align: center;">GapLens | Gap Score Report | Confidential</div>`,
      footerTemplate: `<div style="${HEADER_FOOTER_STYLE} text-align: center;">Prepared for ${escapeHtml(header.companyName)} | By GapLens ${escapeHtml(header.generatedMonthYear)}</div>`,
      margin: { top: "56px", bottom: "56px" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
