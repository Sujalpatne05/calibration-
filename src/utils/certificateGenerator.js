export function fillTemplate(template, data = {}) {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key) => {
    const value = Object.prototype.hasOwnProperty.call(data, key) ? data[key] : ''
    return String(value ?? '')
  })
}

export function combinePagesHtml(pages) {
  return pages.join('\n<div class="page-break"></div>\n')
}

export function buildPdfContainerHtml(html) {
  return `<div class="pdf-root">${html}</div>`
}

export default {
  fillTemplate,
  combinePagesHtml,
  buildPdfContainerHtml,
}
