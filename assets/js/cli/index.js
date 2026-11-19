import { cliConfig } from './config.js';
import { createPostIndex } from './posts.js';
import { renderAbout, renderPost } from './reader.js';
import { createCommandRunner } from './commands.js';
import { createTerminal } from './terminal.js';
import { createCompletion } from './completion.js';

const root = document.querySelector(cliConfig.selectors.root);
const input = root.querySelector(cliConfig.selectors.input);
const aboutTemplate = root.querySelector(cliConfig.selectors.aboutContent);
const posts = createPostIndex(root, cliConfig.selectors);
const terminal = createTerminal(root, cliConfig.selectors);
const runner = createCommandRunner({
  commands: cliConfig.commands,
  posts,
  reader: post => renderPost(post),
  about: () => renderAbout(root.dataset.cliAboutTitle, aboutTemplate, root.dataset.cliAboutUrl),
  terminal,
  guiUrl: root.dataset.cliGuiUrl
});
const completion = createCompletion({
  input,
  commands: cliConfig.commands,
  posts,
  getPath: runner.getPath
});

const form = root.querySelector(cliConfig.selectors.prompt);
const history = [];
let historyIndex = 0;
form.onsubmit = event => {
  event.preventDefault();
  const command = input.value.trim();
  if (command) {
    history.push(command);
    historyIndex = history.length;
    runner.run(command);
  }
  input.value = '';
  input.focus();
};
input.onkeydown = event => {
  if (event.key === 'Tab') {
    event.preventDefault();
    completion.complete();
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
