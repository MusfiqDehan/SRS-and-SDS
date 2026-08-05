// Client-side document export helpers (HTML, DOCX via Word-compatible HTML, PDF via print).

function buildStyledHtml(title, innerHtml) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
    <style>
      * { box-shadow: none !important; }
      body { font-family: "Times New Roman", Times, serif; color: #000; background: #fff; padding: 24px; }
      h1 { font-size: 22px; margin: 18px 0 8px; }
      h2 { font-size: 18px; margin: 16px 0 6px; }
      h3 { font-size: 15px; margin: 12px 0 6px; }
      p, li { font-size: 12pt; line-height: 1.6; }
      ul, ol { margin: 12px 0; padding-left: 24px; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0; }
      table, th, td { border: 1px solid #000; }
      th, td { padding: 6px; text-align: left; font-size: 11pt; }
      th { background-color: #3b82f6; color: #fff; }
      img { max-width: 100%; height: auto; display: block; margin: 12px 0; }
      iframe { display: none; }
    </style>
  </head>
  <body>${innerHtml}</body>
</html>`;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const today = () => new Date().toISOString().split('T')[0];

export function exportHtml(title, innerHtml, name) {
  const content = buildStyledHtml(title, innerHtml);
  triggerDownload(new Blob([content], { type: 'text/html' }), `${name}-${today()}.html`);
}

// Minimal Word-compatible export: an .doc file with HTML payload that Word and
// Google Docs open correctly, without any third-party dependency.
export function exportDocx(title, innerHtml, name) {
  const html = buildStyledHtml(title, innerHtml).replace(
    '<html>',
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
  );
  triggerDownload(
    new Blob(['\ufeff', html], { type: 'application/msword' }),
    `${name}-${today()}.doc`
  );
}

export function exportPdf() {
  window.print();
}
