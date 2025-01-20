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

    var cleanHTML = DOMPurify.sanitize(rawHTMLContent, {
      ADD_TAGS: [
        "img",
        "article",
        "section",
        "p",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "details",
        "summary",
      ],
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
        "style",
        "svg",
        "symbol",
        "use",
        "path",
        "g",
        "defs",
        "small",
        "menu",
        "figure",
        "figcaption",
        "picture",
        "source",
      ],
      ALLOWED_ATTR: [
        "src",
        "alt",
        "width",
        "height",
        "class",
        "id",
        "open",
        "aria-expanded",
        "aria-label",
      ],
      FORBID_ATTR: [
        "onclick",
        "onload",
        "onerror",
        "onmouseover",
        "onmouseout",
        "onkeydown",
        "onkeyup",
        "srcset",
        "data-src",
        "data-srcset",
        "loading",
        "role",
      ],
      KEEP_CONTENT: true,
      WHOLE_DOCUMENT: true,
      SANITIZE_DOM: true,
      ALLOW_DATA_ATTR: false,
      HOOKS: {
        uponSanitizeElement: (node, data) => {
          if (data.tagName === "img") {
            const parent = node.parentElement;
            const isInContentArea =
              parent &&
              (parent.tagName === "ARTICLE" ||
                parent.tagName === "P" ||
                parent.matches('[class*="content"]'));

            if (
              !isInContentArea ||
              node.src.toLowerCase().includes("logo") ||
              node.src.toLowerCase().includes("icon") ||
              node.alt.toLowerCase().includes("logo") ||
              node.className.toLowerCase().includes("logo") ||
              node.width < 100 || // Increase minimum width
              node.height < 100 || // Add minimum height
              parent.className.toLowerCase().includes("header") ||
              parent.className.toLowerCase().includes("nav") ||
              parent.className.toLowerCase().includes("menu") ||
              parent.id.toLowerCase().includes("header") ||
              parent.id.toLowerCase().includes("logo")
            ) {
              node.remove();
              return;
            }
          }

          if (
            node.matches &&
            node.matches(
              [
                '[class*="site-title"]',
                '[class*="site-description"]',
                '[class*="branding"]',
                '[class*="logo-wrap"]',
                '[class*="header-image"]',
                '[class*="site-header-image"]',
                '[id*="logo"]',
                '[id*="header"]',
                '[id*="branding"]',
              ].join(",")
            )
          ) {
            node.remove();
            return;
          }

          if (
            node.matches &&
            node.matches(
              [
                "details:not([open])",
                ".collapse:not(.show)",
                '[aria-expanded="false"]',
                ".HeaderMenu-dropdown",
                ".js-header-menu",
                '[style*="display: none"]',
                '[style*="visibility: hidden"]',
                '[class*="hidden"]',
                '[class*="collapsed"]',
                ".js-responsive-underlinenav-overflow",
              ].join(",")
            )
          ) {
            node.remove();
            return;
          }

          function isHidden(element) {
            const style = window.getComputedStyle(element);
            return (
              style.display === "none" ||
              style.visibility === "hidden" ||
              parseFloat(style.opacity) === 0
            );
          }

          // Add this to your HOOKS.uponSanitizeElement function
          if (node.nodeType === Node.ELEMENT_NODE && isHidden(node)) {
            node.remove();
            return;
          }

          if (
            node.matches &&
            node.matches(
              '[class*="submenu"], [class*="dropdown"], [class*="child"]'
            )
          ) {
            const parentMenu = node.closest('[class*="menu"], [class*="nav"]');
            if (parentMenu && !parentMenu.classList.contains("active")) {
              node.remove();
              return;
            }
          }

          // Remove empty containers
          if (
            node.children &&
            node.children.length === 0 &&
            !node.textContent.trim() &&
            node.tagName !== "IMG"
          ) {
            node.remove();
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
      // const cleanMd = await turndownService.turndown(returnedContent);
      // res.send(cleanMd);
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
