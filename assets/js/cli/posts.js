export function createPostIndex(root, selectors) {
  const index = root.querySelector(selectors.index);
  const posts = [...root.querySelectorAll(selectors.post)].map(element => ({
    category: element.dataset.cliCategory || 'uncategorized',
    name: element.dataset.cliName,
    contentUrl: element.dataset.cliContentUrl,
    sourceUrl: element.dataset.cliSourceUrl,
    element,
    link: element.querySelector(selectors.postLink),
    content: element.querySelector(selectors.postContent)
  }));
  const categories = [...new Set(posts.map(post => post.category))];

  return {
    posts,
    all() { return posts; },
    categories() { return categories; },
    category(name) {
      return categories.find(category => category.toLowerCase() === name.toLowerCase());
    },
    inCategory(category) { return posts.filter(post => post.category === category); },
    find(query) {
      const needle = query.toLowerCase();
      return posts.filter(post => post.element.textContent.toLowerCase().includes(needle));
    },
    at(entries, number) { return entries[number - 1]; },
    categoryMatches(prefix) {
      return categories.filter(category => category.toLowerCase().startsWith(prefix.toLowerCase()));
    },
    nameMatches(category, prefix) {
      return posts
        .filter(post => post.category.toLowerCase() === category.toLowerCase() && post.name.toLowerCase().startsWith(prefix.toLowerCase()))
        .map(post => post.name);
    },
    resolve(path) {
      if (!path || path.parts.length !== 2) return undefined;
      const [category, name] = path.parts;
      return posts.find(post => post.category.toLowerCase() === category.toLowerCase() && post.name.toLowerCase() === name.toLowerCase());
    },
    source: index
  };
}

export function renderCategoryList(categories, document = globalThis.document) {
  const list = document.createElement('ul');
  list.className = 'cli-directory-list';
  categories.forEach(category => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${category}`;
    link.textContent = `${category}/`;
    link.dataset.cliCommand = `ls ${category}/`;
    item.append('drwxr-xr-x ', link);
    list.append(item);
  });
  return list;
}

export function renderPostList(posts, category = null, document = globalThis.document) {
  const list = document.createElement('ol');
  list.className = 'cli-post-list';
  posts.forEach((post, index) => {
    const item = document.createElement('li');
    const number = document.createElement('span');
    const date = document.createElement('time');
    const link = document.createElement('a');
    number.className = 'cli-post-number';
    number.textContent = `[${index + 1}]`;
    date.dateTime = post.link.closest('li').querySelector('time').dateTime;
    date.textContent = post.link.closest('li').querySelector('time').textContent;
    link.href = post.link.href;
    link.textContent = post.link.textContent;
    link.dataset.cliCommand = `read ${category ? post.name : `${post.category}/${post.name}`}`;
    item.append(number, ' ', date, ' ', link);
    list.append(item);
  });
  return list;
}
