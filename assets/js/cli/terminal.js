export function createTerminal(root, selectors) {
  const transcript = root.querySelector(selectors.transcript);
  const prompt = root.querySelector(selectors.prompt);
  const input = root.querySelector(selectors.input);
  const label = prompt.querySelector('label');

  function setWorkingDirectory(path) {
    label.textContent = `guest@blog:${path}$`;
  }

  function appendCommand(command) {
    const line = document.createElement('p');
    line.className = 'cli-command-line';
    line.textContent = `${label.textContent} ${command}`;
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

  function appendHelp(commands, language) {
    const entries = [
      [`${commands.list} [category]`, 'list directories or posts', '列出目录或文章'],
      [`${commands.cd} <dir>`, 'change category', '切换分类目录'],
      [`${commands.find} <text>`, 'search posts', '搜索文章'],
      [`${commands.read} <post>`, 'read a post', '阅读文章'],
      [commands.pwd, 'show the current directory', '显示当前目录'],
      [commands.about, 'show blog information', '查看作者简介'],
      [commands.clear, 'clear the terminal', '清空终端'],
      [`${commands.lang} [zh|en]`, 'show or switch the content language', '查看或切换内容语言'],
      [commands.gui, 'open GUI mode', '切换到图形界面']
    ];
    const width = Math.max(...entries.map(([command]) => command.length));
    appendText(entries.map(([command, en, zh]) => `${command.padEnd(width + 3)}${language === 'zh' ? zh : en}`).join('\n'));
  }

  function clear() {
    transcript.replaceChildren();
  }

  return { appendCommand, append, appendText, appendHelp, clear, setWorkingDirectory };
}
