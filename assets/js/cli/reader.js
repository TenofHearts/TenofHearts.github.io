export function renderContent(titleText, source, baseUrl, document = globalThis.document) {
  const reader = document.createElement('article');
  const heading = document.createElement('h2');
  const body = document.createElement('div');
  reader.className = 'cli-article';
  heading.textContent = titleText;
  body.className = 'cli-article-body';
  const content = source.cloneNode(true);
  content.querySelectorAll('[href], [src]').forEach(element => {
    for (const attribute of ['href', 'src']) {
      if (element.hasAttribute(attribute)) {
        element.setAttribute(attribute, new URL(element.getAttribute(attribute), baseUrl));
      }
    }
  });
  body.replaceChildren(...content.childNodes);
  reader.append(heading, body);
  return reader;
}

export async function renderPost(post, document = globalThis.document) {
  const response = await fetch(post.contentUrl);
  if (!response.ok) throw new Error(`Unable to load ${post.name}`);
  const source = document.createElement('template');
  source.innerHTML = await response.text();
  return renderContent(post.link.textContent, source.content, new URL(post.sourceUrl, document.baseURI), document);
}

export function renderAbout(title, template, url, document = globalThis.document) {
  return renderContent(title, template.content, url, document);
}
