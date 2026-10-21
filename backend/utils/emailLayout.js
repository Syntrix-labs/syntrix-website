const { escapeHtml } = require('./chatNotifier');

/**
 * The branded dark-green email used for project and meeting notices.
 * `paragraphs` are trusted HTML (escape any user text before passing it in);
 * `quote` is plain text and is escaped here. `extra` is optional trusted HTML
 * placed after the button.
 */
function emailLayout({ heading, paragraphs, quote, cta, extra = '' }) {
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#cfe8d6">${p}</p>`)
    .join('');
  const quoteHtml = quote
    ? `<p style="margin:0 0 18px;padding:14px 16px;border-left:3px solid #34d399;background:#0c2a1d;border-radius:8px;font-size:15px;line-height:1.6;color:#eafff2">${escapeHtml(quote)}</p>`
    : '';
  return `
  <div style="margin:0;padding:24px;background:#04140d;font-family:Helvetica,Arial,sans-serif">
    <div style="max-width:540px;margin:0 auto;background:#0a1f16;border:1px solid #16352a;border-radius:16px;overflow:hidden">
      <div style="padding:22px 28px;border-bottom:1px solid #16352a">
        <p style="margin:0;font-size:12px;letter-spacing:4px;color:#7f9a86">SYNTRIX LABS</p>
      </div>
      <div style="padding:28px">
        <h1 style="margin:0 0 16px;font-size:21px;font-weight:500;color:#eafff2">${heading}</h1>
        ${body}${quoteHtml}
        <a href="${cta.href}" style="display:inline-block;margin-top:6px;padding:12px 22px;border-radius:12px;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px">${cta.label}</a>
        ${extra}
      </div>
    </div>
  </div>`;
}

module.exports = { emailLayout };
