const { Notebook } = require("crossnote");
const path = require("path");

async function previewMarkdown() {
  const notebook = await Notebook.init({
    notebookPath: path.resolve(__dirname, "../../"),
    config: {
      previewTheme: "github-light.css",
      mathRenderingOption: "KaTeX",
      codeBlockTheme: "github.css",
      enableScriptExecution: true,
    },
  });

  const engine = notebook.getNoteMarkdownEngine("scmp.md");
  await engine.openInBrowser({ runAllCodeChunks: true });
}

previewMarkdown().catch(console.error);
