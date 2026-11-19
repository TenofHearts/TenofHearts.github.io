let loading;
let queue = Promise.resolve();

function loadMathJax() {
  if (!loading) {
    window.MathJax = { startup: { typeset: false } };
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
      script.onload = () => resolve(window.MathJax.startup.promise);
      script.onerror = () => { script.remove(); reject(new Error('MathJax unavailable')); };
      document.head.append(script);
    }).catch(error => {
      loading = undefined;
      throw error;
    });
  }
  return loading;
}

export function typesetArticle(output) {
  const body = output.querySelector('.cli-article-body');
  if (!body || !/\\\(|\\\[|\$\$/.test(body.textContent)) return;

  // MathJax 3 expects dynamic typesetting calls to run one at a time.
  queue = queue.then(async () => {
    if (!body.isConnected) return;
    await loadMathJax();
    if (!body.isConnected) return;
    try {
      await window.MathJax.typesetPromise([body]);
    } finally {
      if (!body.isConnected) clearMath(body);
    }
  }).catch(() => { /* The article remains readable as TeX when MathJax is unavailable. */ });
}

export function clearMath(output) {
  window.MathJax?.typesetClear?.([output]);
}
