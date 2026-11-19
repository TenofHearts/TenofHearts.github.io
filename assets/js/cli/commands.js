import { renderCategoryList, renderPostList } from './posts.js';
import { CliPath } from './path.js';
import { parsePipeline } from './parse.js';

export function createCommandRunner({ commands, posts, reader, about, terminal, guiUrl, language, languageUrls, switchLanguage, initialPath }) {
  let currentPath = initialPath && posts.category(initialPath.category || '') ? initialPath : new CliPath();
  let numberedPosts = posts.inCategory(currentPath.category);
  terminal.setWorkingDirectory(currentPath.toString());

  async function run(line) {
    if (!line.trim()) return;
    terminal.appendCommand(line);
    const pipeline = parsePipeline(line);
    if (!pipeline) return terminal.appendText('Syntax error: unclosed quote or trailing backslash');
    const [source, ...stages] = pipeline;
    const piped = stages.length > 0;
    if (!source.length || (piped && (stages.length !== 1 || stages[0].length !== 1 || stages[0][0] !== commands.less))) {
      return terminal.appendText(`Usage: <command> | ${commands.less}`);
    }
    const [command, ...words] = source;
    const argument = words.join(' ');
    if (piped && ([commands.clear, commands.cd, commands.gui, commands.less].includes(command) ||
        (command === commands.lang && argument && argument !== language))) {
      return terminal.appendText(`${command}: cannot pipe this command`);
    }
    const write = piped ? terminal.openPager : terminal.append;
    if (command === commands.echo) return write(`${argument}\n`);
    if (command === commands.clear) return terminal.clear();
    if (command === commands.list) return list(argument, write);
    if (command === commands.cd) return changeDirectory(argument);
    if (command === commands.gui) return location.assign(guiUrl);
    if (command === commands.lang) {
      if (!argument || argument === language) return write(language);
      if (!Object.hasOwn(languageUrls, argument)) return terminal.appendText('Usage: lang [zh|en]');
      return switchLanguage(argument, currentPath);
    }
    if (command === commands.help) return write(terminal.helpText(commands, language));
    if (command === commands.pwd) return write(currentPath.toString());
    if (command === commands.about) return terminal.openPager(about());
    if (command === commands.find && argument) {
      const matches = posts.find(argument).filter(post => !currentPath.isCategory || post.category === currentPath.category);
      if (matches.length) return listPosts(matches, write);
      numberedPosts = [];
      return terminal.appendText(`find: no posts matching "${argument}"`);
    }
    const less = command === commands.less;
    if (less && !argument) return terminal.appendText('Missing filename ("less --help" for help)');
    if (less && argument === '--help') return terminal.appendText('Usage: less <post> or <command> | less');
    const name = less ? argument : source.join(' ');
    const post = /^\d+$/.test(name) ? posts.at(numberedPosts, Number(name)) : posts.resolve(currentPath.resolve(name));
    if (!post) return terminal.appendText(less ? `${commands.less}: no such post: ${name}` : 'Unknown command or post. Type help.');
    try {
      const article = await reader(post);
      return less ? terminal.openPager(article) : write(article);
    } catch (error) {
      return terminal.appendText(`${name}: ${error.message}`);
    }
  }

  function listPosts(entries, write) {
    numberedPosts = entries;
    return write(renderPostList(entries, currentPath.category));
  }

  function list(argument, write) {
    const target = currentPath.resolve(argument || '.');
    if (target.isRoot) {
      numberedPosts = [];
      return write(renderCategoryList(posts.categories()));
    }
    if (!target.isCategory || !posts.category(target.category)) {
      return terminal.appendText(`ls: cannot access '${argument}': No such category`);
    }
    const category = posts.category(target.category);
    return listPosts(posts.inCategory(category), write);
  }

  function changeDirectory(argument) {
    if (!argument || argument === '.') return;
    const path = currentPath.resolve(argument);
    if (!path.isRoot && (!path.isCategory || !posts.category(path.category))) {
      return terminal.appendText(`cd: no such category: ${argument}`);
    }
    currentPath = path.isRoot ? new CliPath() : new CliPath([posts.category(path.category)]);
    numberedPosts = posts.inCategory(currentPath.category);
    terminal.setWorkingDirectory(currentPath.toString());
    return;
  }

  return { run, getPath: () => currentPath };
}
