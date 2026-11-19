export function createTerminal(root, selectors) {
  const transcript = root.querySelector(selectors.transcript);
  const prompt = root.querySelector(selectors.prompt);
  const input = root.querySelector(selectors.input);
  let workingDirectory = '~/journal';

  function setWorkingDirectory(path) {
    workingDirectory = path;
  }

  function appendCommand(command) {
    const line = document.createElement('p');
    line.className = 'cli-command-line';
    line.textContent = `guest@blog:${workingDirectory}$ ${command}`;
    transcript.append(line);
    line.scrollIntoView({ block: 'nearest' });
  }

  function append(output) {
    if (typeof output === 'string') return appendText(output);
    output.classList.add('cli-command-output');
    transcript.append(output);
    output.scrollIntoView({ block: 'nearest' });
    if (output.matches('[data-cli-pager]')) openPager(output);
  }

  function openPager(pager) {
    prompt.hidden = true;
    pager.focus();
    pager.onkeydown = event => {
      const page = pager.clientHeight * .85;
      if (event.key === 'q' || event.key === 'Escape') {
        event.preventDefault();
        pager.remove();
        prompt.hidden = false;
        input.focus();
      } else if (event.key === ' ' || event.key === 'PageDown') {
        event.preventDefault();
        pager.scrollTop += page;
      } else if (event.key === 'b' || event.key === 'PageUp') {
        event.preventDefault();
        pager.scrollTop -= page;
      } else if (event.key === 'ArrowDown' || event.key === 'j') {
        event.preventDefault();
        pager.scrollTop += 48;
      } else if (event.key === 'ArrowUp' || event.key === 'k') {
        event.preventDefault();
        pager.scrollTop -= 48;
      } else if (event.key === 'g' || event.key === 'Home') {
        event.preventDefault();
        pager.scrollTop = 0;
      } else if (event.key === 'G' || event.key === 'End') {
        event.preventDefault();
        pager.scrollTop = pager.scrollHeight;
      }
    };
  }

  function appendText(text) {
    const output = document.createElement('pre');
    output.className = 'cli-command-output cli-text-output';
    output.textContent = text;
    transcript.append(output);
    output.scrollIntoView({ block: 'nearest' });
  }

  function appendHelp(commands) {
    const entries = [
      [`${commands.list} [category]`, 'list directories or posts'],
      [`${commands.cd} <dir>`, 'change category'],
      [`${commands.find} <text>`, 'search posts'],
      [`${commands.read} <post>`, 'read a post'],
      [commands.pwd, 'show the current directory'],
      [commands.about, 'show blog information'],
      [commands.clear, 'clear the terminal'],
      [commands.gui, 'open GUI mode']
    ];
    const width = Math.max(...entries.map(([command]) => command.length));
    appendText(entries.map(([command, description]) => `${command.padEnd(width + 3)}${description}`).join('\n'));
  }

  function clear() {
    transcript.replaceChildren();
  }

  return { appendCommand, append, appendText, appendHelp, clear, setWorkingDirectory };
}
