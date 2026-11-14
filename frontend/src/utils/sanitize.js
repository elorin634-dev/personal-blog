/**
 * 基础 XSS 防护：白名单式 HTML 清洗
 *
 * 为什么需要：
 * 文章/项目正文以简单 HTML 存储，渲染时使用 v-html。只要数据可能来自第三方转载
 * 或数据库被写入恶意内容，就必须在插入 DOM 前收敛标签与属性。
 *
 * 实现方式：
 * 1. 用 DOMParser 解析成 DOM（解析阶段不会执行脚本）
 * 2. 危险标签（script/style/iframe/form...）连同内容一起删除
 * 3. 未在白名单内的标签「解包」，只保留其文本与已清洗的子节点
 * 4. 属性白名单：a 只保留 href/title，并校验协议；其余属性一律移除
 *
 * 局限：这是客户端纵深防御，不能替代服务端校验。
 * 若后续开放评论/留言，服务端必须在入库前做纯文本化处理（见 docs/api.md）。
 */

const ALLOWED_TAGS = new Set([
  'P', 'DIV', 'SPAN', 'BR', 'HR',
  'H2', 'H3', 'H4',
  'UL', 'OL', 'LI',
  'STRONG', 'B', 'EM', 'I', 'U', 'S',
  'CODE', 'PRE', 'BLOCKQUOTE',
  'A', 'FIGURE', 'FIGCAPTION',
  'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD',
]);

const ALLOWED_ATTRS = {
  A: ['href', 'title'],
  CODE: ['class'],
  TH: ['colspan', 'rowspan'],
  TD: ['colspan', 'rowspan'],
};

// 这些标签即使内容看起来无害也整体删除
const DROP_WITH_CONTENT = new Set([
  'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON',
  'TEXTAREA', 'SELECT', 'OPTION', 'LINK', 'META', 'BASE', 'SVG', 'MATH',
  'TEMPLATE', 'NOSCRIPT', 'VIDEO', 'AUDIO', 'SOURCE', 'CANVAS',
]);

function isSafeUrl(rawUrl) {
  const url = String(rawUrl || '').trim();
  if (!url) return false;
  if (url.startsWith('/') || url.startsWith('#')) return true;

  try {
    const parsed = new URL(url, window.location.origin);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function cleanElement(element) {
  // 先递归处理子节点，再决定当前节点去留
  Array.from(element.children).forEach(cleanElement);

  if (DROP_WITH_CONTENT.has(element.tagName)) {
    element.remove();
    return;
  }

  if (!ALLOWED_TAGS.has(element.tagName)) {
    // 未知标签解包：保留文本，避免整段内容丢失
    const parent = element.parentNode;
    if (!parent) return;
    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    element.remove();
    return;
  }

  const allowed = ALLOWED_ATTRS[element.tagName] || [];
  Array.from(element.attributes).forEach((attr) => {
    if (!allowed.includes(attr.name)) {
      element.removeAttribute(attr.name);
    }
  });

  if (element.tagName === 'A') {
    const href = element.getAttribute('href');
    if (!href || !isSafeUrl(href)) {
      element.removeAttribute('href');
    } else {
      element.setAttribute('rel', 'noopener noreferrer');
      if (/^https?:/i.test(href)) {
        element.setAttribute('target', '_blank');
      }
    }
  }
}

export function sanitizeHtml(html) {
  if (!html) return '';
  // 构建期 / 非浏览器环境不做处理，避免报错
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return '';

  const doc = new DOMParser().parseFromString(
    `<div id="sanitize-root">${String(html)}</div>`,
    'text/html'
  );
  const root = doc.getElementById('sanitize-root');
  if (!root) return '';

  Array.from(root.children).forEach(cleanElement);
  return root.innerHTML;
}
