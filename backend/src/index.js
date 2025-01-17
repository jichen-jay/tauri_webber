import { chromium } from "playwright";
import DOMPurify from "isomorphic-dompurify";

let browser;
const url = process.argv[2];

async function initializeBrowser() {
  try {
    var agent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
    browser = await chromium.launch({
      executablePath: "/run/current-system/sw/bin/chromium",
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-popup-blocking",
        "--disable-notifications",
        `--user-agent=${agent}`,
        "--window-size=768,1024",
        "--force-device-scale-factor=1",
      ],
      ignoreHTTPSErrors: true,
    });
  } catch (error) {
    console.error("Failed to launch the browser:", error);
    process.exit(1);
  }
}

async function validateAndParseUrl(inputUrl) {
  try {
    const parsedUrl = new URL(
      inputUrl.startsWith("http") ? inputUrl : `https://${inputUrl}`
    );
    return parsedUrl.href;
  } catch {
    throw new Error("Invalid URL format");
  }
}

async function openOneTab(targetUrl) {
  const page = await browser.newPage();
  try {
    const validUrl = await validateAndParseUrl(targetUrl);

    await page.addScriptTag({
      url: "https://cdnjs.cloudflare.com/ajax/libs/dompurify/2.4.0/purify.min.js",
      integrity: "sha384-o+H3+gk+2+1+2+3+4",
      crossOrigin: "anonymous",
    });
    console.log("DOMPurify script injected.");

    await page.goto(validUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.waitForSelector("body", { state: "attached", timeout: 60000 });

    await page.evaluate(() => {
      const removeElements = (selectors) => {
        selectors.forEach((selector) => {
          document.querySelectorAll(selector).forEach((el) => el.remove());
        });
      };

      removeElements([
        'div[aria-modal="true"]',
        'div[role="alertdialog"]',
        "#gateway-content",
        ".ad",
        ".popup",
        ".overlay",
        "iframe",
      ]);
    });

    console.log("Attempted to remove popups and overlays.");

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, 0));

    if (await page.locator(".captcha-container").isVisible()) {
      console.log("CAPTCHA detected");
    }

    await page.evaluate(() => {
      document.body.style.overflow = "visible";
      document.body.style.height = "auto";
      document.documentElement.style.overflow = "auto";
      document.documentElement.style.height = "auto";

      const elementsToFix = document.querySelectorAll(
        'body, #app, #root, main, [class*="content"]'
      );
      elementsToFix.forEach((el) => {
        el.style.overflow = "visible";
        el.style.height = "auto";
        el.style.maxHeight = "none";
        el.style.position = "static";
      });
    });

    var rawHTMLContent = await page.content();

    const cleanHTML = DOMPurify.sanitize(rawHTMLContent, {
      ADD_TAGS: ["pg-slot"],
      FORBID_TAGS: ["script"],
      ALLOWED_ATTR: ["style", "class", "id"],
      FORBID_ATTR: [
        "onload",
        "onerror",
        "onclick",
        "onmouseover",
        "onmouseout",
        "onmousedown",
        "onmouseup",
        "onkeydown",
        "onkeypress",
        "onkeyup",
      ],
      ALLOW_DATA_ATTR: true,
      KEEP_CONTENT: true,
      SANITIZE_DOM: true,
      WHOLE_DOCUMENT: true,
      FORCE_BODY: true,
    });

    return cleanHTML;
    // return rawHTMLContent;
  } finally {
    await page.close();
  }
}

(async () => {
  await initializeBrowser(); // Initialize the browser
  const result = await openOneTab(url); // Open the tab and get the content

  if (result) {
    console.log(result);
  } else {
    console.log("Failed to extract the article.");
  }

  await browser.close();
})();
