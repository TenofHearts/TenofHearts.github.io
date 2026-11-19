import { cliConfig } from './config.js';
import { createPostIndex } from './posts.js';
import { renderAbout, renderPost } from './reader.js';
import { createCommandRunner } from './commands.js';
import { createTerminal } from './terminal.js';
import { createCompletion } from './completion.js';

const root = document.querySelector(cliConfig.selectors.root);
const input = root.querySelector(cliConfig.selectors.input);
const terminal = createTerminal(root, cliConfig.selectors);
const languageUrls = { zh: root.dataset.cliZhUrl, en: root.dataset.cliEnUrl };
let runner, completion;

function useEdition(edition, language, initialPath) {
  const posts = createPostIndex(edition, cliConfig.selectors);
  const aboutTemplate = edition.querySelector(cliConfig.selectors.aboutContent);
  runner = createCommandRunner({
    commands: cliConfig.commands, posts, reader: renderPost, terminal,
    about: () => renderAbout(edition.dataset.cliAboutTitle, aboutTemplate, new URL(edition.dataset.cliAboutUrl, document.baseURI)),
    guiUrl: edition.dataset.cliGuiUrl, language, languageUrls, switchLanguage, initialPath
  });
  completion = createCompletion({ input, languages: Object.keys(languageUrls), commands: cliConfig.commands, posts, getPath: runner.getPath });
}

async function switchLanguage(language, currentPath) {
  try {
    const response = await fetch(languageUrls[language]);
    if (!response.ok) throw new Error();
    const page = new DOMParser().parseFromString(await response.text(), 'text/html');
    const edition = page.querySelector(cliConfig.selectors.root);
    if (!edition || page.documentElement.lang !== language) throw new Error();
    useEdition(edition, language, currentPath);
    window.history.replaceState(window.history.state, '', response.url);
    document.documentElement.lang = language;
    root.querySelector('.cli-banner')?.replaceWith(edition.querySelector('.cli-banner'));
    terminal.appendText(language);
  } catch {
    terminal.appendText(`lang: could not load ${language}`);
  }
}
useEdition(root, document.documentElement.lang);

const form = root.querySelector(cliConfig.selectors.prompt);
const history = [];
let historyIndex = 0;
let busy = false;
form.onsubmit = async event => {
  event.preventDefault();
  if (busy) return;
  const command = input.value.trim();
  input.value = '';
  input.focus();
  if (command) {
    history.push(command);
    historyIndex = history.length;
    busy = true;
    try { await runner.run(command); } finally { busy = false; }
  }
};
input.onkeydown = event => {
  if (event.key === 'Tab' && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
    const previous = input.value;
    completion.complete();
    if (input.value !== previous) event.preventDefault();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    historyIndex = Math.max(0, historyIndex - 1);
    input.value = history[historyIndex] || '';
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    historyIndex = Math.min(history.length, historyIndex + 1);
    input.value = history[historyIndex] || '';
  }
};
root.querySelector(cliConfig.selectors.transcript).onclick = event => {
  const link = event.target.closest('[data-cli-command]');
  if (!link) return;
  event.preventDefault();
  input.value = link.dataset.cliCommand;
  form.requestSubmit();
};
input.focus();
