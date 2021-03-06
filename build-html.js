const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const Handlebars = require('handlebars');

module.exports = function(isProduction = false, paths) {
  setupHandlebars(Handlebars, paths);

  // Prevent pages.json caching in case it includes changes
  const pagesFile = path.join(paths.src, 'templates', 'pages.json');
  delete require.cache[require.resolve(pagesFile)];
  const pages = require(pagesFile);
  const pagesDir = path.join(paths.src, 'templates', 'pages');
  const baseTitle = 'Cherish Birth';

  // Build main pages
  pages.forEach(page => {
    if (!(page.url && page.template)) return;

    const pageTemplate = loadHandlebarsTemplate(path.join(pagesDir, `${page.template}.hbs`));
    const pageHtml = renderTemplate(pageTemplate, {
      browserTitle: (page.browserTitle !== false ? `${page.pageTitle} | ` : '') + baseTitle,
      activeMenu: page.activeMenuId || null,
    });
    writeFile(path.join(paths.dist, page.url), pageHtml);
  });

  // Build 404 page
  const notFoundTemplate = loadHandlebarsTemplate(path.join(pagesDir, '404.hbs'));
  const notFoundHtml = renderTemplate(notFoundTemplate, { browserTitle: `Not Found | ${baseTitle}` });
  writeFile(paths.dist, notFoundHtml, '404.html');

  // Build sitemap
  const sitemapTemplate = loadHandlebarsTemplate(path.join(pagesDir, 'sitemap.hbs'));
  const sitemapXml = renderTemplate(sitemapTemplate);
  writeFile(paths.dist, sitemapXml, 'sitemap.xml');

  function renderTemplate(template, data = {}) {
    const templateData = Object.assign({ isProduction, pages }, data);
    return template(templateData);
  }
};

function loadHandlebarsTemplate(templateFile) {
  const pageTemplate = fs.readFileSync(templateFile, { encoding: 'utf8' });
  return Handlebars.compile(pageTemplate);
}

function writeFile(outputDir, html, fileName = 'index.html') {
  mkdirp.sync(outputDir);
  fs.writeFileSync(path.join(outputDir, fileName), html);
}

function setupHandlebars(Handlebars, paths) {
  Handlebars.registerHelper('concat', (...args) => args.slice(0, -1).join(''));
  Handlebars.registerHelper('noDoubleSlash', (text) => text.replace(/(\/){2,}/g, '/'));
  Handlebars.registerHelper('equal', function equal(value1, value2, options) {
    const op = value1 === value2 ? 'fn' : 'inverse';
    return options[op](this);
  });

  // Find and add all partials
  const partialsDir = path.join(paths.src, 'templates', 'partials');
  const partialsFiles = fs.readdirSync(partialsDir);
  partialsFiles.forEach(partialFile =>
    Handlebars.registerPartial(
      partialFile.split('.')[0],
      fs.readFileSync(path.join(partialsDir, partialFile), { encoding: 'utf8' })
    ));
}
