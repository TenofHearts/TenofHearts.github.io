import { renderCategoryList, renderPostList } from './posts.js';
import { CliPath } from './path.js';

export function createCommandRunner({ commands, posts, reader, about, terminal, guiUrl, language, languageUrls, switchLanguage, initialPath }) {
  let currentPath = initialPath && posts.category(initialPath.category || '') ? initialPath : new CliPath();
  terminal.setWorkingDirectory(currentPath.toString());

  function run(line) {
    const [command, ...words] = line.trim().split(/\s+/);
    const argument = words.join(' ');
    if (!command) return;
    terminal.appendCommand(line);
    if (command === commands.clear) return terminal.clear();
    if (command === commands.list) return list(argument);
    if (command === commands.cd) return changeDirectory(argument);
    if (command === commands.gui) return location.assign(guiUrl);
    if (command === commands.lang) {
      if (!argument || argument === language) return terminal.appendText(language);
      if (!Object.hasOwn(languageUrls, argument)) return terminal.appendText('Usage: lang [zh|en]');
      return switchLanguage(argument, currentPath);
    }
    if (command === commands.help) return terminal.appendHelp(commands, language);
    if (command === commands.pwd) return terminal.appendText(currentPath.toString());
    if (command === commands.about) return terminal.append(about());
    if (command === commands.find && argument) {
      const matches = posts.find(argument).filter(post => !currentPath.isCategory || post.category === currentPath.category);
      return matches.length
        ? terminal.append(renderPostList(matches, currentPath.category))
        : terminal.appendText(`find: no posts matching "${argument}"`);
    }
    if (command === commands.read && argument) {
      const post = /^\d+$/.test(argument)
        ? posts.at(currentPath.isCategory ? posts.inCategory(currentPath.category) : [], Number(argument))
        : posts.resolve(currentPath.resolve(argument));
      if (!post) return terminal.appendText(`read: no such post: ${argument}`);
      return reader(post)
        .then(pager => terminal.append(pager))
        .catch(error => terminal.appendText(`read: ${error.message}`));
    }
    unknown();
  }

  function list(argument) {
    const target = currentPath.resolve(argument || '.');
    if (target.isRoot) return terminal.append(renderCategoryList(posts.categories()));
    if (!target.isCategory || !posts.category(target.category)) {
      return terminal.appendText(`ls: cannot access '${argument}': No such category`);
    }
    const category = posts.category(target.category);
    return terminal.append(renderPostList(posts.inCategory(category), currentPath.category));
  }

  function changeDirectory(argument) {
    if (!argument || argument === '.') return;
    const path = currentPath.resolve(argument);
    if (!path.isRoot && (!path.isCategory || !posts.category(path.category))) {
      return terminal.appendText(`cd: no such category: ${argument}`);
    }
    currentPath = path.isRoot ? new CliPath() : new CliPath([posts.category(path.category)]);
    terminal.setWorkingDirectory(currentPath.toString());
    return;
  }

  function unknown() {
    terminal.appendText('Unknown command or argument. Type help.');
  }

  return { run, getPath: () => currentPath };
}
