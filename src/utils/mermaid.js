const BLOCK_SELECTOR = 'pre > code.language-mermaid';

let renderSeq = 0;

export function findMermaidBlocks(root) {
  return Array.from(root.querySelectorAll(BLOCK_SELECTOR)).map(code => code.parentElement);
}

export function mermaidThemeFor(siteTheme) {
  return siteTheme === 'dark' ? 'dark' : 'default';
}

// 載入失敗不快取 rejected promise，下一次 load 才能重試
export function createMermaidLoader(importer) {
  let pending = null;
  return function load() {
    if (!pending) {
      pending = Promise.resolve()
        .then(importer)
        .then(mod => mod.default)
        .catch(err => {
          pending = null;
          throw err;
        });
    }
    return pending;
  };
}

function markError(pre, message) {
  if (pre.nextElementSibling?.classList.contains('mermaid-error')) return;
  const note = document.createElement('p');
  note.className = 'mermaid-error';
  note.setAttribute('role', 'alert');
  note.textContent = message;
  pre.insertAdjacentElement('afterend', note);
}

// 放大檢視會把同一份 svg 再放進頁面；文章內的副本改用另一組 id，避免文件出現重複 id
// （mermaid 的樣式以 #id 限定範圍，所以 svg 內所有出現處一併替換）
function buildFigure(source, svg, onOpen) {
  const figure = document.createElement('figure');
  figure.className = 'mermaid-diagram';
  figure.dataset.mermaidSource = source;

  const canvas = document.createElement('div');
  canvas.className = 'mermaid-diagram__canvas';
  canvas.innerHTML = svg;
  const svgId = canvas.querySelector('svg')?.id;
  if (svgId) canvas.innerHTML = svg.split(svgId).join(`${svgId}-inline`);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'mermaid-diagram__zoom';
  button.textContent = '放大';

  const open = () => onOpen?.({ svg, trigger: button });
  button.addEventListener('click', open);
  canvas.addEventListener('click', open);

  figure.append(canvas, button);
  return figure;
}

// 已渲染的 figure 從 data-mermaid-source 還原原始碼，換主題時重畫不會疊出第二層
function collectTargets(root) {
  const targets = findMermaidBlocks(root).map(pre => ({
    el: pre,
    source: pre.querySelector('code').textContent,
  }));
  root.querySelectorAll('figure.mermaid-diagram').forEach(figure => {
    targets.push({ el: figure, source: figure.dataset.mermaidSource });
  });
  return targets;
}

export async function renderMermaidBlocks(root, { load, theme, onOpen } = {}) {
  const targets = collectTargets(root);
  if (targets.length === 0) return { rendered: 0, failed: 0 };

  let mermaid;
  try {
    mermaid = await load();
  } catch (err) {
    targets.forEach(t => {
      if (t.el.tagName === 'PRE') markError(t.el, '流程圖載入失敗，已顯示原始碼。');
    });
    return { rendered: 0, failed: targets.length };
  }

  // strict 會過濾圖內的 HTML 與腳本；文章內容可能含外部貼上的圖
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme });

  let rendered = 0;
  let failed = 0;
  for (const { el, source } of targets) {
    try {
      const id = `mermaid-diagram-${++renderSeq}`;
      const { svg } = await mermaid.render(id, source);
      el.replaceWith(buildFigure(source, svg, onOpen));
      rendered += 1;
    } catch (err) {
      failed += 1;
      if (el.tagName === 'PRE') markError(el, '流程圖語法錯誤，已顯示原始碼。');
    }
  }
  return { rendered, failed };
}
