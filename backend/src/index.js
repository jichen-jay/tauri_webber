import { chromium } from 'playwright'
import DOMPurify from 'isomorphic-dompurify'
import TurndownService from 'turndown'

const turndownService = new TurndownService({
  headingStyle: 'atx', // Use ATX-style headings (e.g., # Heading)
  bulletListMarker: '-', // Use '-' for unordered lists
  codeBlockStyle: 'fenced', // Use fenced code blocks (```
  emDelimiter: '*', // Use '*' for emphasis
  strongDelimiter: '**' // Use '**' for bold text
})

// Add custom rule to handle strikethrough
// turndownService.addRule("strikethrough", {
//   filter: ["path", "meta", "picture", "svg"],
//   replacement: function (content) {
//     return ""; // Remove these elements entirely
//   },
// });

turndownService.addRule('boilerplate', {
  filter: node => {
    const tagName = node.nodeName.toLowerCase()
    return (
      tagName === 'script' ||
      tagName === 'style' ||
      tagName === 'noscript' ||
      tagName === 'iframe' ||
      node.textContent.includes('Advertisement') ||
      node.textContent.includes('cookies')
    )
  },
  replacement: () => ''
})

turndownService.addRule('deduplicateLinks', {
  filter: 'a',
  replacement: (content, node) => {
    const href = node.getAttribute('href')
    if (!href || content.trim() === '') return ''
    return `[${content}](${href})`
  }
})

turndownService.addRule('removeMetadata', {
  filter: node => {
    return (
      node.nodeName.toLowerCase() === 'time' ||
      node.textContent.match(/\d{1,2}:\d{2}(AM|PM)/)
    )
  },
  replacement: () => ''
})

turndownService.addRule('cleanEmptyBrackets', {
  filter: node =>
    node.nodeName.toLowerCase() === 'a' && !node.textContent.trim(),
  replacement: () => ''
})

// Add a rule for images to simplify <img> tags into Markdown format
turndownService.addRule('imageSimplify', {
  filter: 'img',
  replacement: function (content, node) {
    const alt = node.getAttribute('alt') || ''
    const src = node.getAttribute('src') || ''
    return `${alt}`
  }
})

// Add a rule for links to ensure proper formatting
turndownService.addRule('linkSimplify', {
  filter: 'a',
  replacement: function (content, node) {
    const href = node.getAttribute('href') || ''
    return `[${content}](${href})`
  }
})

// Add a rule to handle blockquotes properly
turndownService.addRule('blockquote', {
  filter: 'blockquote',
  replacement: function (content) {
    return content
      .split('\n')
      .map(line => `> ${line}`)
      .join('\n')
  }
})

// Add a rule for tables if needed
turndownService.addRule('tableSimplify', {
  filter: ['table'],
  replacement: function (content, node) {
    // Simplify table rendering logic here if necessary.
    return content // Placeholder - extend as needed.
  }
})

let browser
const url = process.argv[2]

async function initializeBrowser () {
  try {
    var agent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    browser = await chromium.launch({
      executablePath: '/run/current-system/sw/bin/chromium',
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-popup-blocking',
        '--disable-notifications',
        `--user-agent=${agent}`,
        '--window-size=768,1024',
        '--force-device-scale-factor=1'
      ],
      ignoreHTTPSErrors: true
    })
  } catch (error) {
    console.error('Failed to launch the browser:', error)
    process.exit(1)
  }
}

async function validateAndParseUrl (inputUrl) {
  try {
    const parsedUrl = new URL(
      inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`
    )
    return parsedUrl.href
  } catch {
    throw new Error('Invalid URL format')
  }
}

async function openOneTab (targetUrl) {
  const page = await browser.newPage()
  try {
    const validUrl = await validateAndParseUrl(targetUrl)

    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/2.4.0/purify.min.js',
      integrity: 'sha384-o+H3+gk+2+1+2+3+4',
      crossOrigin: 'anonymous'
    })
    console.log('DOMPurify script injected.')

    await page.goto(validUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    })

    await page.waitForSelector('body', { state: 'attached', timeout: 60000 })

    await page.evaluate(() => {
      const removeElements = selectors => {
        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => el.remove())
        })
      }

      removeElements([
        'div[aria-modal="true"]',
        'div[role="alertdialog"]',
        '#gateway-content',
        '.ad',
        '.popup',
        '.overlay',
        'iframe'
      ])
    })

    console.log('Attempted to remove popups and overlays.')

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(2000)
    await page.evaluate(() => window.scrollTo(0, 0))

    if (await page.locator('.captcha-container').isVisible()) {
      console.log('CAPTCHA detected')
    }

    await page.evaluate(() => {
      document.body.style.overflow = 'visible'
      document.body.style.height = 'auto'
      document.documentElement.style.overflow = 'auto'
      document.documentElement.style.height = 'auto'

      const elementsToFix = document.querySelectorAll(
        'body, #app, #root, main, [class*="content"]'
      )
      elementsToFix.forEach(el => {
        el.style.overflow = 'visible'
        el.style.height = 'auto'
        el.style.maxHeight = 'none'
        el.style.position = 'static'
      })
    })

    var rawHTMLContent = await page.content()

    const markdownContent = turndownService.turndown(rawHTMLContent)

    return markdownContent

    // return cleanHTML;
    // return rawHTMLContent;
  } finally {
    await page.close()
  }
}

;(async () => {
  await initializeBrowser() // Initialize the browser
  const result = await openOneTab(url) // Open the tab and get the content

  if (result) {
    console.log(result)
  } else {
    console.log('Failed to extract the article.')
  }

  await browser.close()
})()
