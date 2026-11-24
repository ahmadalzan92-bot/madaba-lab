// أداة تجميع: تُنتج index.html مستقلة بذاتها تحتوي بوابة النظام والتطبيق الحالي كصفحة فرعية
const fs = require("fs");

const css = fs.readFileSync("styles.css", "utf8");
const data = fs.readFileSync("data.js", "utf8");
const officeExport = fs.readFileSync("office-export.js", "utf8");
const app = fs.readFileSync("app.js", "utf8");
const logoSrc = "data:image/png;base64," + fs.readFileSync("logo-web.png").toString("base64");
const cardIconSrc = "data:image/png;base64," + fs.readFileSync("portal-card-icon.png").toString("base64");

const styleOpen = "  <style>";
const styleClose = "  </style>";
const scriptOpen = "  <script>";
const scriptClose = "  </script>";

function replaceBlock(source, open, close, content) {
  const start = source.indexOf(open);
  if (start === -1) throw new Error(`لم يتم العثور على ${open}`);
  const end = source.indexOf(close, start + open.length);
  if (end === -1) throw new Error(`لم يتم العثور على ${close}`);
  return source.slice(0, start) + open + "\n" + content + "\n" + close + source.slice(end + close.length);
}

function setImgSrc(tag, src) {
  return /src="[^"]*"/.test(tag) ? tag.replace(/src="[^"]*"/, `src="${src}"`) : tag.replace(/>$/, ` src="${src}">`);
}

function embedAssets(source) {
  return source
    .replace(/<img\b[^>]*\bid="(?:appLogo|portalLogo)"[^>]*>/g, (tag) => setImgSrc(tag, logoSrc))
    .replace(/<img\b[^>]*\bid="portalCardIcon"[^>]*>/g, (tag) => setImgSrc(tag, cardIconSrc));
}

// 1) بناء التطبيق الحالي من مصادره داخل قالب التطبيق
let appHtml = fs.readFileSync("app-template.html", "utf8");
const bundledJS = data + "\n\n" + officeExport + "\n\n" + app;
appHtml = embedAssets(appHtml);
appHtml = replaceBlock(appHtml, styleOpen, styleClose, css);
appHtml = replaceBlock(appHtml, scriptOpen, scriptClose, bundledJS);

// 2) إدراج التطبيق كاملاً داخل بوابة النظام
let portalHtml = fs.readFileSync("portal.html", "utf8");
if (!portalHtml.includes("<!-- APP_HTML -->")) throw new Error("لم يتم العثور على مكان إدراج التطبيق في portal.html");
portalHtml = embedAssets(portalHtml).replace("<!-- APP_HTML -->", appHtml);

fs.writeFileSync("index.html", portalHtml, "utf8");
console.log("Bundled standalone portal index.html:", Buffer.byteLength(portalHtml, "utf8"), "bytes");
