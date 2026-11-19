import { parsePipeline } from './parse.js';

export function createCompletion({ input, commands, languages, posts, getPath }) {
  const commandNames = Object.values(commands);

  function complete() {
    const value = input.value;
    const cursor = input.selectionStart;
    if (cursor !== value.length) return;
    const pipeline = parsePipeline(value);
    if (!pipeline) return;
    if (pipeline.length > 1) {
      const stage = pipeline[1][0] ?? '';
      if (pipeline.length === 2 && pipeline[0].length && pipeline[1].length <= 1 &&
          value.endsWith(stage) && commands.less.startsWith(stage)) replace([commands.less], stage);
      return;
    }
    const parts = value.trimStart().split(/\s+/);
    if (parts.length === 1) {
      const matches = commandNames.filter(command => command.startsWith(parts[0]));
      return replace([...matches, ...pathMatches(parts[0], true)], parts[0]);
    }

    const command = parts[0];
    if (command === commands.lang && parts.length === 2) {
      const matches = languages.filter(lang => lang.startsWith(parts[1]));
      return replace(matches, parts[1]);
    }
    if (![commands.cd, commands.list, commands.less].includes(command)) return;
    const argument = parts.slice(1).join(' ');
    replace(pathMatches(argument, command === commands.less), argument);
  }

  function pathMatches(argument, includePosts) {
    const slash = argument.lastIndexOf('/');
    const prefix = slash >= 0 ? argument.slice(0, slash + 1) : '';
    const namePrefix = slash >= 0 ? argument.slice(slash + 1) : argument;
    const directory = getPath().resolve(prefix);
    if (directory.isRoot) {
      return posts.categoryMatches(namePrefix).map(category => `${prefix}${category}/`);
    }
    return includePosts && directory.isCategory
      ? posts.nameMatches(directory.category, namePrefix).map(name => `${prefix}${name}`) : [];
  }

  function replace(matches, existing) {
    if (!matches.length) return;
    const shared = commonPrefix(matches);
    if (shared.length < existing.length) return;
    input.value = input.value.slice(0, input.value.length - existing.length) + shared;
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
