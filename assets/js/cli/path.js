export class CliPath {
  constructor(parts = []) {
    this.parts = Object.freeze([...parts]);
    Object.freeze(this);
  }

  static from(value, current = new CliPath()) {
    if (value instanceof CliPath) return value;
    const raw = String(value ?? '').trim();
    const base = current instanceof CliPath ? current.parts : [];
    const absolute = raw.startsWith('/') || raw === '~' || raw.startsWith('~/journal');
    let path = raw;
    if (path === '~') path = '';
    if (path.startsWith('~/journal')) path = path.slice('~/journal'.length);
    if (path.startsWith('/')) path = path.slice(1);

    const segments = absolute ? [] : [...base];
    path.split('/').forEach(segment => {
      if (!segment || segment === '.') return;
      if (segment === '..') {
        segments.pop();
        return;
      }
      segments.push(segment);
    });
    return new CliPath(segments);
  }

  get isRoot() { return this.parts.length === 0; }
  get isCategory() { return this.parts.length === 1; }
  get category() { return this.isCategory ? this.parts[0] : null; }
  get last() { return this.parts[this.parts.length - 1]; }
  parent() { return new CliPath(this.parts.slice(0, -1)); }
  resolve(value) { return CliPath.from(value, this); }
  toString() { return this.isRoot ? '~/journal' : `~/journal/${this.parts.join('/')}`; }
}

export function resolvePath(value, current = new CliPath()) {
  return CliPath.from(value, current);
}
