import { chromium } from "playwright";
import DOMPurify from "isomorphic-dompurify";
import JSDOM from "jsdom";

let browser;
const url = process.argv[2];

async function initializeBrowser() {
  try {
    var agent =
      "Mozilla/5.0 (Windows NT 5.1; rv:31.0) Gecko/20100101 Firefox/31.0";
    browser = await chromium.launch({
      executablePath: "/run/current-system/sw/bin/chromium",
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-extensions",
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
    await page.goto(validUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    var rawHTMLContent = await page.content();

    const cleanHTML = DOMPurify.sanitize(rawHTMLContent, {
      ALLOWED_TAGS: [
        "p",
        "div",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "span",
        "a",
        "ul",
        "ol",
        "li",
        "img",
        "header",
        "footer",
        "section",
        "article",
        "aside",
        "nav",
        "main",
        "figure",
        "figcaption",
        "picture",
        "source",
        "time",
        "meta",
        "link",
        "style",
      ],
      ALLOWED_ATTR: [
        "href",
        "alt",
        "title",
        "class",
        "id",
        "style",
        "data-*", // Allow all data attributes
        "aria-*", // Allow ARIA attributes for accessibility
        "role", // Allow role attribute for accessibility
        "srcset",
        "sizes", // For responsive images
        "datetime", // For time elements
        "content",
        "name",
        "rel", // For meta tags
        "type", // For style and script tags
        "crossorigin",
        "integrity", // For subresource integrity
      ],
      ADD_TAGS: ["pg-slot"], // Allow custom elements like pg-slot
      ALLOWED_STYLES: {
        "*": {
          // Layout styles
          display: true,
          position: true,
          top: true,
          right: true,
          bottom: true,
          left: true,
          float: true,
          clear: true,
          "z-index": true,

          // Flexbox and Grid
          flex: true,
          "flex-direction": true,
          "flex-wrap": true,
          "flex-flow": true,
          "justify-content": true,
          "align-items": true,
          "align-content": true,
          order: true,
          "flex-grow": true,
          "flex-shrink": true,
          "flex-basis": true,
          "align-self": true,
          grid: true,
          "grid-template-columns": true,
          "grid-template-rows": true,
          "grid-template-areas": true,
          "grid-auto-columns": true,
          "grid-auto-rows": true,
          "grid-auto-flow": true,
          "grid-column-start": true,
          "grid-column-end": true,
          "grid-row-start": true,
          "grid-row-end": true,
          "grid-column": true,
          "grid-row": true,
          "grid-area": true,
          gap: true,
          "column-gap": true,
          "row-gap": true,

          // Box model
          width: true,
          height: true,
          "max-width": true,
          "max-height": true,
          "min-width": true,
          "min-height": true,
          padding: true,
          "padding-top": true,
          "padding-right": true,
          "padding-bottom": true,
          "padding-left": true,
          margin: true,
          "margin-top": true,
          "margin-right": true,
          "margin-bottom": true,
          "margin-left": true,
          border: true,
          "border-width": true,
          "border-style": true,
          "border-color": true,
          "border-radius": true,

          // Typography
          "font-family": true,
          "font-size": true,
          "font-weight": true,
          "line-height": true,
          "text-align": true,
          "text-decoration": true,
          "text-transform": true,
          "letter-spacing": true,
          "word-spacing": true,
          "white-space": true,
          color: true,

          // Background
          background: true,
          "background-color": true,
          "background-image": true,
          "background-repeat": true,
          "background-position": true,
          "background-size": true,

          // Other
          opacity: true,
          visibility: true,
          overflow: true,
          "box-shadow": true,
          transform: true,
          transition: true,
        },
      },
      FORBID_TAGS: ["base", "embed", "frame", "iframe", "object"],
      FORBID_ATTR: ["onload", "onerror", "onclick", "onmouseover"],
      CUSTOM_ELEMENT_HANDLING: {
        tagNameCheck: null,
        attributeNameCheck: null,
        allowCustomizedBuiltInElements: true,
      },
      KEEP_CONTENT: true,
      ADD_ATTR: ["target"], // Allow target attribute for links
      FORCE_BODY: true, // Ensure a <body> tag is present
      WHOLE_DOCUMENT: true, // Clean the whole document
      SANITIZE_DOM: true, // Clean DOM nodes
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
