// Split words and pipeline stages without treating quoted or escaped pipes as operators.
export function parsePipeline(line) {
  const stages = [[]];
  let quote = '', word = null;
  function finishWord() {
    if (word !== null) stages.at(-1).push(word);
    word = null;
  }
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (!quote && (ch === '|' || /\s/.test(ch))) {
      finishWord();
      if (ch === '|') stages.push([]);
      continue;
    }
    word ??= '';
    if (!quote && (ch === '"' || ch === "'")) quote = ch;
    else if (ch === quote) quote = '';
    else if (ch === '\\' && (!quote || (quote === '"' && /["\\$`]/.test(line[i + 1])))) {
      if (++i === line.length) return null;
      word += line[i];
    } else word += ch;
  }
  if (quote) return null;
  finishWord();
  return stages;
}
