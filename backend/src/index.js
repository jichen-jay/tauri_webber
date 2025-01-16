import { chromium } from 'playwright'

let browser
const url = process.argv[2]

async function initializeBrowser () {
  try {
    browser = await chromium.launch({
      executablePath: '/run/current-system/sw/bin/chromium',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
    await page.goto(validUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    })
    return await page.content()
  } finally {
    await page.close()
  }
}

// const url = 'https://ft.com/' // Change as needed

// const url = "https://agriculture.canada.ca/en/sector/animal-industry/red-meat-and-livestock-market-information/prices"; // Change as needed

;(async () => {
  await initializeBrowser() // Initialize the browser
  const result = await openOneTab(url) // Open the tab and get the content

  if (result) {
    console.log(result)
  } else {
    console.log('Failed to extract the article.')
  }

  await browser.close()

  return result
})()
