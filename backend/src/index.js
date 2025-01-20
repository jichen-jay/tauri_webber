import { chromium } from "playwright";
import DOMPurify from "isomorphic-dompurify";
import TurndownService from "turndown";
import path from "path";
import os from "os";
import express from "express";
import fs from "fs";

async function previewMarkdown(markdownContent) {
  const notebook = await Notebook.init({
    notebookPath: process.cwd(),
    config: {
      previewTheme: "github-light.css",
      mathRenderingOption: "KaTeX",
      codeBlockTheme: "github.css",
      enableScriptExecution: true,
    },
  });

  // Create temporary file with .md extension
  const tempFileName = `temp-${Date.now()}.md`;
  await fs.promises.writeFile(tempFileName, markdownContent);

  try {
    const engine = notebook.getNoteMarkdownEngine(tempFileName);
    const htmlContent = await engine.htmlExport({
      offline: false,
      runAllCodeChunks: true,
    });
    return htmlContent;
  } finally {
    // Clean up temp file
    await fs.promises.unlink(tempFileName);
  }
}

const turndownService = new TurndownService({
  headingStyle: "atx", // Use ATX-style headings (e.g., # Heading)
  bulletListMarker: "-", // Use '-' for unordered lists
  codeBlockStyle: "fenced", // Use fenced code blocks (```
  emDelimiter: "*", // Use '*' for emphasis
  strongDelimiter: "**", // Use '**' for bold text
});

// Add custom rule to handle strikethrough
// turndownService.addRule("strikethrough", {
//   filter: ["path", "meta", "picture", "svg"],
//   replacement: function (content) {
//     return ""; // Remove these elements entirely
//   },
// });

// turndownService.addRule("boilerplate", {
//   filter: (node) => {
//     const tagName = node.nodeName.toLowerCase();
//     return (
//       tagName === "script" ||
//       tagName === "style" ||
//       tagName === "noscript" ||
//       tagName === "iframe" ||
//       node.textContent.includes("Advertisement") ||
//       node.textContent.includes("cookies")
//     );
//   },
//   replacement: () => "",
// });

turndownService.addRule("deduplicateLinks", {
  filter: "a",
  replacement: (content, node) => {
    const href = node.getAttribute("href");
    if (!href || content.trim() === "") return "";
    return `[${content}](${href})`;
  },
});

turndownService.addRule("removeMetadata", {
  filter: (node) => {
    return (
      node.nodeName.toLowerCase() === "time" ||
      node.textContent.match(/\d{1,2}:\d{2}(AM|PM)/)
    );
  },
  replacement: () => "",
});

turndownService.addRule("cleanEmptyBrackets", {
  filter: (node) =>
    node.nodeName.toLowerCase() === "a" && !node.textContent.trim(),
  replacement: () => "",
});

// Add a rule for images to simplify <img> tags into Markdown format
// turndownService.addRule("imageSimplify", {
//   filter: "img",
//   replacement: function (content, node) {
//     const alt = node.getAttribute("alt") || "";
//     const src = node.getAttribute("src") || "";
//     return `${alt}`;
//   },
// });

// Add a rule for links to ensure proper formatting
turndownService.addRule("linkSimplify", {
  filter: "a",
  replacement: function (content, node) {
    const href = node.getAttribute("href") || "";
    return `[${content}](${href})`;
  },
});

// // Add a rule to handle blockquotes properly
// turndownService.addRule("blockquote", {
//   filter: "blockquote",
//   replacement: function (content) {
//     return content
//       .split("\n")
//       .map((line) => `> ${line}`)
//       .join("\n");
//   },
// });

// // Add a rule for tables if needed
// turndownService.addRule("tableSimplify", {
//   filter: ["table"],
//   replacement: function (content, node) {
//     // Simplify table rendering logic here if necessary.
//     return content; // Placeholder - extend as needed.
//   },
// });

let browser;
const url = process.argv[2];

async function initializeBrowser() {
  try {
    const userDataDir = path
      .join(os.homedir(), ".config", "google-chrome")
      .toString();
    const mobile_user_agent =
      "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

    const agent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
    browser = await chromium.launchPersistentContext(userDataDir, {
      executablePath:
        "/etc/profiles/per-user/jaykchen/bin/google-chrome-stable",
      channel: "chrome",
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-blink-features=AutomationControlled",
        "--profile-directory=Default",
        "--disable-extensions",
        "--disable-popup-blocking",
        "--disable-notifications",
        `--user-agent=${mobile_user_agent}`,
        "--window-size=1080,1920",
        "--force-device-scale-factor=1",
      ],
      ignoreDefaultArgs: ["--enable-automation"],
      ignoreHTTPSErrors: true,
    });
    await browser.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });
    });

    if (fs.existsSync(path.join(userDataDir, "Default", "SingletonLock"))) {
      fs.unlinkSync(path.join(userDataDir, "Default", "SingletonLock"));
    }
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

    await page.evaluate(() => window.scrollTo(0, window.innerHeight));
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
      ADD_TAGS: ["img"],
      ALLOWED_ATTR: ["src", "alt", "width", "height"],
      FORBID_TAGS: [
        "script",
        "iframe",
        "frame",
        "embed",
        "object",
        "base",
        "nav",
        "header",
        "footer",
        "aside",
        "advertisement",
        "input",
      ],
      FORBID_ATTR: [
        "onclick",
        "onload",
        "onerror",
        "onmouseover",
        "onmouseout",
        "onkeydown",
        "onkeyup",
      ],
      KEEP_CONTENT: true,
      WHOLE_DOCUMENT: true,
      SANITIZE_DOM: true,
      ADD_ATTR: ["target"],
      FORCE_BODY: true,
      ALLOW_DATA_ATTR: true,
      CUSTOM_ELEMENT_HANDLING: {
        tagNameCheck: null,
        attributeNameCheck: null,
        allowCustomizedBuiltInElements: true,
      },

      HOOKS: {
        uponSanitizeElement: (node, data) => {
          const nonContentSelectors = [
            // Navigation and Header Elements
            "header",
            "nav",
            "navbar",
            ".navigation",
            ".nav-menu",
            ".top-bar",

            // Sidebar Elements
            "aside",
            ".sidebar",
            ".side-menu",
            ".widget",
            ".complementary",
            '[role="complementary"]',
            ".right-rail",
            ".left-rail",

            // Advertisement Areas
            ".ad",
            ".advertisement",
            ".banner",
            ".sponsored",
            ".promoted",
            "[data-ad]",
            "[class*='ad-']",
            "[id*='ad-']",
            ".dfp",
            ".commercial",

            // Footer Elements
            "footer",
            ".footer",
            ".bottom-bar",
            ".site-info",

            // Social Media Elements
            ".social",
            ".share",
            ".follow",
            ".social-media",
            ".social-links",

            // Related Content
            ".related",
            ".recommended",
            ".suggestions",
            ".more-stories",

            // Comments and User Interaction
            ".comments",
            ".discussion",
            ".user-content",
            ".reactions",

            // Promotional Areas
            ".promo",
            ".promotion",
            ".marketing",
            ".newsletter",
            ".subscribe",

            // Utility Areas
            ".toolbar",
            ".tools",
            ".utility-bar",
            ".meta",
            ".tags",

            // Pop-ups and Overlays
            ".modal",
            ".popup",
            ".overlay",
            ".dialog",
            "[role='dialog']",

            // Other Common Non-Content Areas
            ".auxiliary",
            ".supplementary",
            ".secondary",
            ".tertiary",
            "[data-component='sidebar']",
            "[data-region='sidebar']",
          ];

          // Check if element is in non-content area
          const isInNonContentArea = nonContentSelectors.some(
            (selector) => node.closest(selector) !== null
          );

          // Remove SVGs and their containers
          if (
            data.tagName === "svg" ||
            data.tagName === "img" ||
            data.tagName === "picture" ||
            data.tagName === "figure" ||
            data.tagName === "source"
          ) {
            const isLogo = (element) => {
              const logoIndicators = [
                "logo",
                "brand",
                "icon",
                "avatar",
                "badge",
                "emblem",
                "symbol",
              ];

              return (
                (element.className &&
                  logoIndicators.some((term) =>
                    element.className.toLowerCase().includes(term)
                  )) ||
                (element.src &&
                  logoIndicators.some((term) =>
                    element.src.toLowerCase().includes(term)
                  )) ||
                (element.alt &&
                  logoIndicators.some((term) =>
                    element.alt.toLowerCase().includes(term)
                  ))
              );
            };

            if (isLogo(node) || isInNonContentArea) {
              node.remove();
            }
          }

          // Remove containers that typically hold logos
          if (data.tagName === "div" || data.tagName === "span") {
            const logoContainerIndicators = [
              "logo",
              "brand",
              "publisher",
              "masthead",
              "site-header",
              "header-image",
            ];

            const hasLogoClass = logoContainerIndicators.some(
              (term) =>
                node.className && node.className.toLowerCase().includes(term)
            );

            if (hasLogoClass) {
              node.remove();
            }
          }

          // Remove all srcset attributes to prevent lazy loading
          if (data.tagName === "img") {
            node.removeAttribute("srcset");
            node.removeAttribute("data-src");
            node.removeAttribute("data-srcset");
            node.removeAttribute("loading");
          }
        },
      },
    });

    return cleanHTML;
    // return rawHTMLContent;
  } finally {
    await page.close();
  }
}

(async () => {
  await initializeBrowser();

  const app = express();
  const PORT = 5000;

  app.get("/", async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
      return res.status(400).send('Error: Missing "url" query parameter.');
    }

    // try {
    //   const result = await openOneTab(targetUrl); // Open the tab and get the content
    //   res.send(result); // Send back the scraped content as response
    // } catch (error) {
    //   console.error(error);
    //   res.status(500).send("Error scraping the webpage.");
    // }

    try {
      const returnedContent = await openOneTab(targetUrl);
      // const htmlPreview = await previewMarkdown(markdownContent);
      res.send(returnedContent);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error processing the webpage.");
    }
  });

  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });

  process.on("SIGINT", async () => {
    console.log("\nClosing browser...");
    // await browser.close();
    // process.exit(0);
  });
})();
