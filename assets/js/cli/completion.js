export function createCompletion({ input, commands, languages, posts, getPath }) {
  const commandNames = Object.values(commands);

  function complete() {
    const value = input.value;
    const cursor = input.selectionStart;
    if (cursor !== value.length) return;
    const parts = value.split(/\s+/);
    if (parts.length === 1) {
      const matches = commandNames.filter(command => command.startsWith(parts[0]));
      return replace(matches, parts[0].length, matches, parts[0]);
    }

    const command = parts[0];
    if (command === commands.lang && parts.length === 2) {
      const matches = languages.filter(lang => lang.startsWith(parts[1]));
      return replace(matches, parts[1].length, matches, parts[1]);
    }
    if (!['cd', 'ls', 'read'].includes(command)) return;
    const argument = parts.slice(1).join(' ');
    const slash = argument.lastIndexOf('/');
    const prefix = slash >= 0 ? argument.slice(0, slash + 1) : '';
    const namePrefix = slash >= 0 ? argument.slice(slash + 1) : argument;
    const currentPath = getPath();
    let matches = [];
    if (command === 'cd' || (command === 'ls' && currentPath.isRoot && slash < 0) || (command === 'read' && currentPath.isRoot && slash < 0)) {
      matches = posts.categoryMatches(namePrefix).map(category => `${prefix}${category}/`);
    } else {
      const directory = slash >= 0 ? currentPath.resolve(prefix.slice(0, -1)) : currentPath;
      if (directory.isCategory) {
        matches = posts.nameMatches(directory.category, namePrefix).map(name => `${prefix}${name}`);
      }
    }
    replace(matches, argument.length, matches, argument);
  }

  function replace(matches, start, values, existing) {
    if (!matches.length) return;
    const shared = commonPrefix(values);
    const replacement = matches.length === 1 || shared.startsWith(existing) ? (matches.length === 1 ? values[0] : shared) : existing;
    input.value = input.value.slice(0, input.value.length - start) + replacement;
    input.setSelectionRange(input.value.length, input.value.length);
  }

  function commonPrefix(values) {
    let prefix = values[0];
    values.slice(1).forEach(value => {
      while (!value.startsWith(prefix)) prefix = prefix.slice(0, -1);
    });
    return prefix;
  }

  return { complete };
}
