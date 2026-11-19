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
  }

  function openPager(output) {
    const pager = document.createElement('dialog');
    pager.className = 'cli-pager';
    pager.setAttribute('aria-label', 'less');
    const viewport = document.createElement('div');
    viewport.className = 'cli-pager-viewport';
    const content = typeof output === 'string' ? textOutput(output) : output;
    viewport.append(content);
    const status = document.createElement('button');
    status.className = 'cli-pager-status';
    status.title = 'Quit (q)';
    pager.append(viewport, status);
    transcript.append(pager);
    prompt.hidden = true;
    pager.showModal();
    pager.focus();
    function updateStatus() {
      const atEnd = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= 1;
      const marker = atEnd ? '(END)' : ':';
      if (status.textContent === marker) return;
      status.textContent = marker;
      status.classList.toggle('at-end', atEnd);
      status.setAttribute('aria-label', atEnd ? 'End of output. Quit pager' : 'More below. Quit pager');
    }
    viewport.onscroll = updateStatus;
    const resize = new ResizeObserver(updateStatus);
    resize.observe(viewport);
    resize.observe(content);
    updateStatus();
    function close() {
      resize.disconnect();
      pager.close();
      pager.remove();
      prompt.hidden = false;
      input.focus();
    }
    status.onclick = close;
    pager.oncancel = event => { event.preventDefault(); close(); };
    // Let listing links submit their command at the restored prompt.
    pager.onclick = event => { if (event.target.closest('[data-cli-command]')) close(); };
    pager.onkeydown = event => {
      const page = viewport.clientHeight * .85;
      if (event.key === 'q' || event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === ' ' || event.key === 'PageDown') {
        event.preventDefault();
        viewport.scrollTop += page;
      } else if (event.key === 'b' || event.key === 'PageUp') {
        event.preventDefault();
        viewport.scrollTop -= page;
      } else if (event.key === 'ArrowDown' || event.key === 'j') {
        event.preventDefault();
        viewport.scrollTop += 48;
      } else if (event.key === 'ArrowUp' || event.key === 'k') {
        event.preventDefault();
        viewport.scrollTop -= 48;
      } else if (event.key === 'g' || event.key === 'Home') {
        event.preventDefault();
        viewport.scrollTop = 0;
      } else if (event.key === 'G' || event.key === 'End') {
        event.preventDefault();
        viewport.scrollTop = viewport.scrollHeight;
      }
    };
  }

  function textOutput(text) {
    const output = document.createElement('pre');
    output.className = 'cli-text-output';
    output.textContent = text;
    return output;
  }

  function appendText(text) {
    append(textOutput(text));
  }

  function helpText(commands, language) {
    const entries = [
      [`${commands.list} [category]`, 'list directories or posts', '列出目录或文章'],
      [`${commands.cd} <dir>`, 'change category', '切换分类目录'],
      [`${commands.find} <text>`, 'search posts', '搜索文章'],
      [`${commands.echo} [text ...]`, 'print text', '输出文本'],
      ['<post>', 'print a post in the terminal', '在终端中输出文章'],
      [`${commands.less} <post>`, 'page through a post (q to quit)', '分页查看文章（按 q 退出）'],
      [`<command> | ${commands.less}`, 'page through command output', '分页查看命令输出'],
      [commands.pwd, 'show the current directory', '显示当前目录'],
      [commands.about, 'show blog information', '查看作者简介'],
      [commands.clear, 'clear the terminal', '清空终端'],
      [`${commands.lang} [zh|en]`, 'show or switch the content language', '查看或切换内容语言'],
      [commands.gui, 'open GUI mode', '切换到图形界面']
    ];
    const width = Math.max(...entries.map(([command]) => command.length));
    return entries.map(([command, en, zh]) => `${command.padEnd(width + 3)}${language === 'zh' ? zh : en}`).join('\n');
  }

  function clear() {
    transcript.replaceChildren();
  }

  return { appendCommand, append, appendText, helpText, openPager, clear, setWorkingDirectory };
}
