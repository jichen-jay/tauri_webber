<script>
  import { Command } from "@tauri-apps/plugin-shell";

  let url = ""; // Input URL (not used in this example since it's hardcoded in Node.js)
  let result = ""; // Output from the scraping process
  let htmlContent = ""; // Parsed HTML content for rendering

  async function scrapeWebpage(targetUrl) {
    try {
      const command = await Command.create("exec-sh", [
        "./backend/src/index.js",
        targetUrl,
      ]).execute();

      if (command.stdout) {
        result = command.stdout;
        htmlContent = command.stdout;
      }
    } catch (error) {
      result = `Scraping failed: ${error.message}`;
      htmlContent = `<p class="error">${error.message}</p>`;
    }
  }

  async function fetchPage() {
    if (!url.trim()) {
      result = "Please enter a valid URL";
      return;
    }

    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      result = "Invalid URL format";
      return;
    }

    await scrapeWebpage(url);
  }
</script>

<div class="container">
  <input
    type="text"
    bind:value={url}
    placeholder="Enter URL (not used in this test)"
  />

  <button on:click={fetchPage}>Scrape Webpage</button>

  <!-- <div class="output-area">
    <textarea readonly bind:value={result}></textarea>
  </div> -->

  <div id="content-container">
    {@html htmlContent}
  </div>
</div>

<style>
  :global(body) {
    font-family: sans-serif;
  }
  .container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  .output-area textarea {
    width: 100%;
    height: 20rem;
    resize: none;
  }
</style>
