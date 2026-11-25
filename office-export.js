/* ==================== تصدير Office 2010 حقيقي (XLSX / DOCX) ====================
   ملفات ZIP/OOXML تُولّد محلياً بدون أي مكتبات خارجية، بنفس ترتيب وتصميم
   زر «عرض التقرير»: الشعار، الترويسة الرسمية، بيانات المشروع، جدول الفحوصات،
   صناديق الحسم، الملاحظة الرسمية، التوقيعات المختارة، والتذييل.
   ============================================================================ */

const OOXML_XMLNS = {
  ct: "http://schemas.openxmlformats.org/package/2006/content-types",
  rel: "http://schemas.openxmlformats.org/package/2006/relationships",
  officeRel: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  spreadsheet: "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
  word: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
  drawing: "http://schemas.openxmlformats.org/drawingml/2006/main",
  xdr: "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing",
  wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
  pic: "http://schemas.openxmlformats.org/drawingml/2006/picture"
};

function escXML(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function xmlHeader() {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
}

/* ---------- CRC32 + ZIP (store) — أساس ملفات Office 2010 ---------- */
const OOXML_CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function ooxmlCrc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = OOXML_CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function ooxmlUtf8(text) {
  return new TextEncoder().encode(String(text));
}

function ooxmlZip(parts) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  parts.forEach((part) => {
    const name = ooxmlUtf8(part.name);
    const data = part.data instanceof Uint8Array ? part.data : ooxmlUtf8(part.data);
    const crc = ooxmlCrc32(data);

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // UTF-8 filenames
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true);
    local.set(name, 30);

    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    central.set(name, 46);

    locals.push(local, data);
    centrals.push(central);
    offset += local.length + data.length;
  });

  const centralSize = centrals.reduce((sum, c) => sum + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, parts.length, true);
  ev.setUint16(10, parts.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  return new Blob([...locals, ...centrals, end], { type: "application/octet-stream" });
}

function downloadBlobFile(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getReportLogoImage() {
  const src = typeof getAppLogoSrc === "function" ? getAppLogoSrc() : "";
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=\s]+)$/.exec(String(src));
  if (!match) return null;
  try {
    const binary = atob(match[1].replace(/\s/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    let w = 58;
    let h = 58;
    if (bytes.length > 24 && bytes[0] === 0x89 && bytes[1] === 0x50) {
      w = ((bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19]) >>> 0;
      h = ((bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23]) >>> 0;
    }
    if (!w || !h || w > 4096 || h > 4096) { w = 58; h = 58; }
    return { bytes, w, h };
  } catch (e) {
    return null;
  }
}

function logoExtent(logo, targetPx) {
  const px = targetPx || 42;
  if (!logo || !logo.w || !logo.h) return { cx: px * 9525, cy: px * 9525 };
  const ratio = logo.h / logo.w;
  return { cx: Math.round(px * 9525), cy: Math.round(px * ratio * 9525) };
}

function officeCoreProps(title) {
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  return `${xmlHeader()}
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escXML(title)}</dc:title>
  <dc:subject>تقرير الحسميات والشذوذات المخبرية</dc:subject>
  <dc:creator>مديرية أشغال محافظة مأدبا - المختبر المركزي</dc:creator>
  <cp:lastModifiedBy>مديرية أشغال محافظة مأدبا</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`;
}

function officeAppProps(application) {
  return `${xmlHeader()}
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>${escXML(application)}</Application>
  <AppVersion>14.0000</AppVersion>
  <Company>مديرية أشغال محافظة مأدبا</Company>
</Properties>`;
}

function officePackageRels() {
  return `${xmlHeader()}
<Relationships xmlns="${OOXML_XMLNS.rel}">
  <Relationship Id="rId1" Type="${OOXML_XMLNS.officeRel}/officeDocument" Target="xl/workbook.xml" />
  <Relationship Id="rId2" Type="${OOXML_XMLNS.officeRel}/metadata/core-properties" Target="docProps/core.xml" />
  <Relationship Id="rId3" Type="${OOXML_XMLNS.officeRel}/extended-properties" Target="docProps/app.xml" />
</Relationships>`;
}

/* ==================== XLSX ==================== */
const XLSX_FONT_DEFS = [
  { sz: 10, color: "FF111111" },
  { sz: 9, b: 1, color: "FF111111" },
  { sz: 12, b: 1, color: "FF2B4922" },
  { sz: 11, b: 1, color: "FF9A7418" },
  { sz: 8.5, color: "FF111111" },
  { sz: 14, b: 1, u: 1, color: "FF1E3518" },
  { sz: 9, color: "FF475569" },
  { sz: 10.5, b: 1, color: "FF2B4922" },
  { sz: 9, b: 1, color: "FF334155" },
  { sz: 9, color: "FF111111" },
  { sz: 8.5, b: 1, color: "FF1E3518" },
  { sz: 8.5, color: "FF111111" },
  { sz: 8.5, color: "FF111111" },
  { sz: 8.5, b: 1, color: "FF111111" },
  { sz: 8, color: "FF475569" },
  { sz: 11, b: 1, color: "FF1E3518" },
  { sz: 8.5, b: 1, color: "FF1E3518" },
  { sz: 9, color: "FF111111" },
  { sz: 9, b: 1, color: "FF1E3518" },
  { sz: 7.5, color: "FF475569" }
];

const XLSX_FILL_DEFS = [null, null, "FFEEF5EB", "FFE4DAC4", "FFF1F5F9", "FFF8FAFC", "FFFEF3C7"];
const XLSX_BORDER_THIN = { style: "thin", color: "FF94A3B8" };
const XLSX_BORDER_GOLD = { style: "medium", color: "FFC59B27" };
const XLSX_BORDER_GREEN = { style: "medium", color: "FF2B4922" };
const XLSX_BORDER_GREEN_DOUBLE = { style: "double", color: "FF2B4922" };
const XLSX_BORDER_DEFS = [
  {},
  { left: XLSX_BORDER_THIN, right: XLSX_BORDER_THIN, top: XLSX_BORDER_THIN, bottom: XLSX_BORDER_THIN },
  { left: XLSX_BORDER_THIN, right: XLSX_BORDER_GOLD, top: XLSX_BORDER_THIN, bottom: XLSX_BORDER_THIN },
  { left: XLSX_BORDER_THIN, right: XLSX_BORDER_THIN, top: XLSX_BORDER_GREEN, bottom: XLSX_BORDER_THIN },
  { left: XLSX_BORDER_THIN, right: XLSX_BORDER_THIN, top: XLSX_BORDER_GOLD, bottom: XLSX_BORDER_THIN },
  { top: XLSX_BORDER_GREEN_DOUBLE },
  { top: XLSX_BORDER_THIN }
];

// فهارس الأنماط: تطابق ألوان وحدود وخطوط زر «عرض التقرير»
const XS = {
  base: 0, center: 1, kingdom: 2, ministry: 3, directorate: 4, ref: 5,
  title: 6, subtitle: 7, section: 8, metaLabel: 9, metaValue: 10,
  tableHead: 11, tableCell: 12, tableNum: 13, tableCellAlt: 14, tableNumAlt: 15,
  total: 16, totalNum: 17, sumLabel: 18, sumValue: 19,
  sumLabelGrand: 20, sumValueGrand: 21, note: 22,
  sigLabel: 23, sigName: 24, sigSub: 25, footer: 26
};

const XLSX_XF_DEFS = [
  { f: 0 },
  { f: 0, a: "horizontal=\"center\" vertical=\"center\" wrapText=\"1\"" },
  { f: 1, a: "horizontal=\"center\" vertical=\"center\"" },
  { f: 2, a: "horizontal=\"center\" vertical=\"center\"" },
  { f: 3, a: "horizontal=\"center\" vertical=\"center\"" },
  { f: 4, b: 1, a: "horizontal=\"right\" vertical=\"top\" wrapText=\"1\"" },
  { f: 5, a: "horizontal=\"center\" vertical=\"center\" wrapText=\"1\"" },
  { f: 6, a: "horizontal=\"center\" vertical=\"center\" wrapText=\"1\"" },
  { f: 7, fl: 2, b: 2, a: "horizontal=\"right\" vertical=\"center\" wrapText=\"1\"" },
  { f: 8, fl: 4, b: 1, a: "horizontal=\"right\" vertical=\"center\" wrapText=\"1\"" },
  { f: 9, b: 1, a: "horizontal=\"right\" vertical=\"center\" wrapText=\"1\"" },
  { f: 10, fl: 3, b: 1, a: "horizontal=\"center\" vertical=\"center\" wrapText=\"1\"" },
  { f: 11, b: 1, a: "horizontal=\"center\" vertical=\"center\" wrapText=\"1\"" },
  { f: 12, b: 1, a: "horizontal=\"right\" vertical=\"center\"" },
  { f: 11, fl: 5, b: 1, a: "horizontal=\"center\" vertical=\"center\" wrapText=\"1\"" },
  { f: 12, fl: 5, b: 1, a: "horizontal=\"right\" vertical=\"center\"" },
  { f: 13, fl: 4, b: 1, a: "horizontal=\"center\" vertical=\"center\"" },
  { f: 13, fl: 4, b: 1, a: "horizontal=\"right\" vertical=\"center\"" },
  { f: 14, b: 3, a: "horizontal=\"center\" vertical=\"center\" wrapText=\"1\"" },
  { f: 15, b: 3, a: "horizontal=\"center\" vertical=\"center\"" },
  { f: 14, fl: 6, b: 4, a: "horizontal=\"center\" vertical=\"center\" wrapText=\"1\"" },
  { f: 15, fl: 6, b: 4, a: "horizontal=\"center\" vertical=\"center\"" },
  { f: 16, fl: 5, b: 1, a: "horizontal=\"right\" vertical=\"center\" wrapText=\"1\"" },
  { f: 17, a: "horizontal=\"center\" vertical=\"center\"" },
  { f: 18, b: 6, a: "horizontal=\"center\" vertical=\"center\" wrapText=\"1\"" },
  { f: 17, a: "horizontal=\"center\" vertical=\"center\"" },
  { f: 19, b: 5, a: "horizontal=\"center\" vertical=\"center\" wrapText=\"1\"" }
];

function buildXlsxStyles() {
  const fonts = XLSX_FONT_DEFS.map((f) => `<font>${f.b ? "<b/>" : ""}${f.u ? "<u/>" : ""}<sz val="${f.sz}"/><color rgb="${f.color}"/><name val="Cairo"/><family val="2"/></font>`).join("");
  const fills = XLSX_FILL_DEFS.map((fill, i) => {
    if (i < 2) return `<fill><patternFill patternType="${i === 0 ? "none" : "gray125"}"/></fill>`;
    return `<fill><patternFill patternType="solid"><fgColor rgb="${fill}"/><bgColor indexed="64"/></patternFill></fill>`;
  }).join("");
  const sideXml = (name, side) => side ? `<${name} style="${side.style}"><color rgb="${side.color}"/></${name}>` : `<${name}/>`;
  const borders = XLSX_BORDER_DEFS.map((b) => `<border>${sideXml("left", b.left)}${sideXml("right", b.right)}${sideXml("top", b.top)}${sideXml("bottom", b.bottom)}<diagonal/></border>`).join("");
  const xfs = XLSX_XF_DEFS.map((x) => {
    const attrs = [`numFmtId="0"`, `fontId="${x.f}"`, `fillId="${x.fl || 0}"`, `borderId="${x.b || 0}"`, `xfId="0"`, "applyAlignment=\"1\""];
    return `<xf ${attrs.join(" ")}>${x.a ? `<alignment ${x.a}/>` : ""}</xf>`;
  }).join("");

  return `${xmlHeader()}
<styleSheet xmlns="${OOXML_XMLNS.spreadsheet}">
  <numFmts count="0"/>
  <fonts count="${XLSX_FONT_DEFS.length}">${fonts}</fonts>
  <fills count="${XLSX_FILL_DEFS.length}">${fills}</fills>
  <borders count="${XLSX_BORDER_DEFS.length}">${borders}</borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="${XLSX_XF_DEFS.length}">${xfs}</cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function buildXlsxDrawing(logo) {
  const ext = logoExtent(logo, 42);
  return `${xmlHeader()}
<xdr:wsDr xmlns:xdr="${OOXML_XMLNS.xdr}" xmlns:a="${OOXML_XMLNS.drawing}" xmlns:r="${OOXML_XMLNS.officeRel}">
  <xdr:oneCellAnchor>
    <xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
    <xdr:ext cx="${ext.cx}" cy="${ext.cy}"/>
    <xdr:pic>
      <xdr:nvPicPr><xdr:cNvPr id="2" name="شعار الوزارة"/><xdr:cNvPicPr/></xdr:nvPicPr>
      <xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>
      <xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${ext.cx}" cy="${ext.cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr>
    </xdr:pic>
    <xdr:clientData/>
  </xdr:oneCellAnchor>
</xdr:wsDr>`;
}

function buildXlsx(p, report, view) {
  const shown = view || (typeof getReportView === "function" ? getReportView(p, report) : { items: report.items, totals: report.totals });
  const t = shown.totals;
  const logo = getReportLogoImage();
  const sig = getSignatureFlags(report);
  const merges = [];
  const rows = [];

  const xc = (ref, value, style) => {
    const text = String(value == null ? "" : value);
    if (!text) return `<c r="${ref}" s="${style}"/>`;
    return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escXML(text)}</t></is></c>`;
  };
  const merge = (range) => merges.push(range);
  const mergedCell = (range, value, style) => { merge(range); return xc(range.split(":")[0], value, style); };
  const row = (r, height, cells) => `<row r="${r}" ht="${height}" customHeight="1">${cells.join("")}</row>`;

  const reportDate = typeof ltrDate === "function" ? ltrDate(report.date) : formatDate(report.date);
  const refText = [
    `رقم التقرير: ${report.reportNo}`,
    `التسلسل: (${report.serialNumber})`,
    `التاريخ: ${reportDate}`,
    `رقم المشروع: ${p.projectNo}`
  ].join("\n");

  // الترويسة الرسمية: الشعار | العنوان | صندوق رقم التقرير
  rows.push(row(1, 13, [xc("A1", "", XS.center), mergedCell("B1:F1", "المملكة الأردنية الهاشمية", XS.kingdom), xc("G1", "", XS.ref)]));
  rows.push(row(2, 13, [xc("A2", "", XS.center), mergedCell("B2:F2", "وزارة الأشغال العامة والإسكان", XS.ministry), xc("G2", "", XS.ref)]));
  rows.push(row(3, 13, [xc("A3", "", XS.center), mergedCell("B3:F3", "مديرية أشغال محافظة مأدبا", XS.directorate), xc("G3", "", XS.ref)]));
  rows.push(row(4, 13, [xc("A4", "", XS.center), mergedCell("B4:F4", "المختبر المركزي-الحسميات والشذوذات", XS.kingdom), xc("G4", "", XS.ref)]));
  merge("A1:A4");
  merge("G1:J4");
  rows[0] = rows[0].replace(xc("G1", "", XS.ref), xc("G1", refText, XS.ref));

  rows.push(row(5, 22, [mergedCell("A5:J5", "تقرير الحسميات والشذوذات المخبرية", XS.title)]));
  rows.push(row(6, 16, [mergedCell("A6:J6", "مُعدّ وفق أسس القبول والقبول مع الحسم والرفض لمشاريع الطرق — الإصدار 2023 م (البند 2.0، صفحة 16–17)", XS.subtitle)]));
  rows.push(row(7, 18, [mergedCell("A7:J7", "أولاً: بيانات المشروع", XS.section)]));

  const metaRows = [
    ["اسم المشروع:", p.name, "رقم المشروع:", p.projectNo],
    ["المقاول:", p.contractor || "---", "نوع العينة:", p.sampleType || "---"],
    ["الموقع:", p.location || "---", "طول المشروع:", p.lengthKm || "---"]
  ];
  metaRows.forEach((m, i) => {
    const r = 8 + i;
    rows.push(row(r, 18, [
      xc(`A${r}`, m[0], XS.metaLabel),
      mergedCell(`B${r}:D${r}`, m[1], XS.metaValue),
      xc(`E${r}`, "", XS.base),
      xc(`F${r}`, m[2], XS.metaLabel),
      mergedCell(`G${r}:J${r}`, m[3], XS.metaValue)
    ]));
  });

  rows.push(row(11, 18, [mergedCell("A11:J11", "ثانياً: جدول الفحوصات والحسميات المالية", XS.section)]));

  const heads = ["#", "الموقع / العينة", "الطبقة (الجدول)", "الفحص المخبري", "قيمة الأعمال (ك×س)\nد.أ", "ق1\nالتنفيذ", "ق2\nضبط الجودة", "ق3\nالاستلام", "الحسم الكلي\nد.أ", "القرار"];
  const colLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  rows.push(row(12, 30, heads.map((h, i) => xc(`${colLetters[i]}12`, h, XS.tableHead))));

  let r = 13;
  shown.items.forEach((it, idx) => {
    const alt = idx % 2 === 1;
    const c = XS.tableCell;
    const n = XS.tableNum;
    rows.push(row(r, 20, [
      xc(`A${r}`, idx + 1, alt ? XS.tableCellAlt : c),
      xc(`B${r}`, it.location, alt ? XS.tableCellAlt : c),
      xc(`C${r}`, tableRefText(it), alt ? XS.tableCellAlt : c),
      xc(`D${r}`, it.itemName, alt ? XS.tableCellAlt : c),
      xc(`E${r}`, formatMoney(it.totalWorkValue), alt ? XS.tableNumAlt : n),
      xc(`F${r}`, formatMoney(it.q1), alt ? XS.tableNumAlt : n),
      xc(`G${r}`, formatMoney(it.q2), alt ? XS.tableNumAlt : n),
      xc(`H${r}`, formatMoney(it.q3), alt ? XS.tableNumAlt : n),
      xc(`I${r}`, formatMoney(it.totalDeduction), alt ? XS.tableNumAlt : n),
      xc(`J${r}`, it.finalDecision, alt ? XS.tableCellAlt : c)
    ]));
    r++;
  });

  rows.push(row(r, 20, [
    mergedCell(`A${r}:D${r}`, "الإجمالي العام", XS.total),
    xc(`E${r}`, formatMoney(t.work), XS.totalNum),
    xc(`F${r}`, formatMoney(t.q1), XS.totalNum),
    xc(`G${r}`, formatMoney(t.q2), XS.totalNum),
    xc(`H${r}`, formatMoney(t.q3), XS.totalNum),
    xc(`I${r}`, formatMoney(t.deduction), XS.totalNum),
    xc(`J${r}`, "---", XS.total)
  ]));
  r += 2;

  rows.push(row(r, 16, [
    mergedCell(`A${r}:B${r}`, "حسم فحوصات التنفيذ (ق1)", XS.sumLabel),
    mergedCell(`C${r}:D${r}`, "حسم ضبط الجودة (ق2)", XS.sumLabel),
    mergedCell(`E${r}:F${r}`, "حسم لجنة الاستلام (ق3)", XS.sumLabel),
    mergedCell(`G${r}:J${r}`, "إجمالي الحسم (ق.ك)", XS.sumLabelGrand)
  ]));
  rows.push(row(r + 1, 22, [
    mergedCell(`A${r + 1}:B${r + 1}`, formatMoney(t.q1), XS.sumValue),
    mergedCell(`C${r + 1}:D${r + 1}`, formatMoney(t.q2), XS.sumValue),
    mergedCell(`E${r + 1}:F${r + 1}`, formatMoney(t.q3), XS.sumValue),
    mergedCell(`G${r + 1}:J${r + 1}`, `${formatMoney(t.deduction)} د.أ`, XS.sumValueGrand)
  ]));
  r += 2;

  rows.push(row(r, 18, [mergedCell(`A${r}:J${r}`, "ملاحظة: الكميات كما وردتنا من قسم المساحة والدراسات", XS.note)]));
  r += 2;

  const signatureBlocks = [];
  if (sig.engineer) signatureBlocks.push(["أعدّ التقرير", "مهندس المختبر / مختبر الطرق", "الاسم: ................................."]);
  if (sig.head) signatureBlocks.push(["تدقيق ومراجعة", "رئيس قسم مختبر مديرية أشغال محافظة مأدبا", "الاسم: م.براءة الغليلات"]);
  if (sig.director) signatureBlocks.push(["وافق", "مدير أشغال محافظة مأدبا", "الاسم: ................................."]);

  if (signatureBlocks.length) {
    const ranges = signatureBlocks.length === 1
      ? ["A:J"]
      : signatureBlocks.length === 2
        ? ["A:E", "F:J"]
        : ["A:D", "E:G", "H:J"];
    signatureBlocks.forEach((b, i) => {
      const range = ranges[i];
      const first = range.split(":")[0];
      const col = first.match(/[A-Z]+/)[0];
      const colNum = col.charCodeAt(0) - 64;
      const startLetter = String.fromCharCode(64 + colNum);
      const endLetter = range.split(":")[1].match(/[A-Z]+/)[0];
      const startRef = `${startLetter}${r}`;
      const endRef = `${endLetter}${r}`;
      rows.push(row(r, 14, [mergedCell(`${startRef}:${endRef}`, b[0], XS.sigLabel)]));
      rows.push(row(r + 1, 20, [mergedCell(`${startLetter}${r + 1}:${endLetter}${r + 1}`, b[1], XS.sigName)]));
      rows.push(row(r + 2, 14, [mergedCell(`${startLetter}${r + 2}:${endLetter}${r + 2}`, b[2], XS.sigSub)]));
    });
    r += 3;
  }

  rows.push(row(r + 1, 18, [mergedCell(`A${r + 1}:J${r + 1}`, `مديرية أشغال محافظة مأدبا — المختبر المركزي-الحسميات والشذوذات — وزارة الأشغال العامة والإسكان | رقم التقرير: ${report.reportNo} | صفحة 1 من 1`, XS.footer)]));

  const cols = [5.5, 13, 11, 12, 12, 11, 11, 11, 12, 14]
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("");

  const sheet = `${xmlHeader()}
<worksheet xmlns="${OOXML_XMLNS.spreadsheet}" xmlns:r="${OOXML_XMLNS.officeRel}">
  <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
  <sheetViews><sheetView rightToLeft="1" showGridLines="0" workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>${cols}</cols>
  <sheetData>${rows.join("")}</sheetData>
  <mergeCells count="${merges.length}">${merges.map((m) => `<mergeCell ref="${m}"/>`).join("")}</mergeCells>
  <pageMargins left="0.28" right="0.28" top="0.28" bottom="0.28" header="0.1" footer="0.1"/>
  <pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="1"/>
  <drawing r:id="rId1"/>
</worksheet>`;

  const parts = [
    { name: "[Content_Types].xml", data: `${xmlHeader()}
<Types xmlns="${OOXML_XMLNS.ct}">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>` },
    { name: "_rels/.rels", data: officePackageRels() },
    { name: "xl/workbook.xml", data: `${xmlHeader()}
<workbook xmlns="${OOXML_XMLNS.spreadsheet}" xmlns:r="${OOXML_XMLNS.officeRel}">
  <sheets><sheet name="تقرير الحسميات" sheetId="1" r:id="rId1"/></sheets>
</workbook>` },
    { name: "xl/_rels/workbook.xml.rels", data: `${xmlHeader()}
<Relationships xmlns="${OOXML_XMLNS.rel}">
  <Relationship Id="rId1" Type="${OOXML_XMLNS.officeRel}/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="${OOXML_XMLNS.officeRel}/styles" Target="styles.xml"/>
</Relationships>` },
    { name: "xl/styles.xml", data: buildXlsxStyles() },
    { name: "xl/worksheets/sheet1.xml", data: sheet },
    { name: "xl/worksheets/_rels/sheet1.xml.rels", data: `${xmlHeader()}
<Relationships xmlns="${OOXML_XMLNS.rel}">
  <Relationship Id="rId1" Type="${OOXML_XMLNS.officeRel}/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>` },
    { name: "xl/drawings/drawing1.xml", data: buildXlsxDrawing(logo) },
    { name: "xl/drawings/_rels/drawing1.xml.rels", data: `${xmlHeader()}
<Relationships xmlns="${OOXML_XMLNS.rel}">
  <Relationship Id="rId1" Type="${OOXML_XMLNS.officeRel}/image" Target="../media/logo.png"/>
</Relationships>` },
    { name: "docProps/core.xml", data: officeCoreProps(report.reportNo) },
    { name: "docProps/app.xml", data: officeAppProps("Microsoft Excel") }
  ];
  if (logo) parts.push({ name: "xl/media/logo.png", data: logo.bytes });

  return ooxmlZip(parts);
}

/* ==================== DOCX ==================== */
function wRunProps(size, bold, color, extra) {
  return `<w:rFonts w:ascii="Cairo" w:hAnsi="Cairo" w:eastAsia="Cairo" w:cs="Cairo"/>` +
    (bold ? "<w:b/><w:bCs/>" : "") +
    (color ? `<w:color w:val="${color}"/>` : "") +
    `<w:sz w:val="${Math.round(size * 2)}"/><w:szCs w:val="${Math.round(size * 2)}"/>` +
    (extra || "") + "<w:rtl/>";
}

function wStyle(id, name, spec) {
  return `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/><w:basedOn w:val="Normal"/>` +
    `<w:pPr><w:bidi/>${spec.pPr || ""}</w:pPr>` +
    `<w:rPr>${wRunProps(spec.size || 8, !!spec.bold, spec.color, spec.rPr)}</w:rPr></w:style>`;
}

function buildDocxStyles() {
  const center = '<w:jc w:val="center"/>';
  const sectionBorder = '<w:pBdr><w:right w:val="single" w:sz="24" w:space="4" w:color="C59B27"/></w:pBdr>';
  const styles = [
    `<w:style w:type="paragraph" w:default="1" w:styleId="Normal">${wStyle("Normal", "Normal", { size: 11, color: "111111" })}`,
    wStyle("MemoMinistry", "Memo Ministry", { size: 16, bold: true, color: "111111", pPr: '<w:jc w:val="center"/><w:spacing w:after="60"/>' }),
    wStyle("MemoDocTitle", "Memo Doc Title", { size: 15, bold: true, color: "111111", pPr: '<w:jc w:val="center"/><w:spacing w:before="600" w:after="600"/>' }),
    wStyle("MemoCellRight", "Memo Cell Right", { size: 11, bold: true, color: "111111", pPr: '<w:jc w:val="right"/>' }),
    wStyle("MemoCellCenter", "Memo Cell Center", { size: 11, bold: true, color: "111111", pPr: '<w:jc w:val="center"/>' }),
    wStyle("MemoSubject", "Memo Subject", { size: 13, bold: true, color: "111111", pPr: '<w:ind w:left="500" w:right="180"/><w:spacing w:before="400" w:after="300" w:line="360" w:lineRule="auto"/><w:rPr><w:u w:val="single"/></w:rPr>' }),
    wStyle("MemoBody", "Memo Body", { size: 12.5, bold: true, color: "111111", pPr: '<w:ind w:left="500"/><w:spacing w:before="200" w:after="160" w:line="360" w:lineRule="auto"/><w:jc w:val="both"/>' }),
    wStyle("MemoNotice", "Memo Notice", { size: 12.5, bold: true, color: "111111", pPr: '<w:ind w:left="380"/><w:spacing w:before="180" w:after="200" w:line="360" w:lineRule="auto"/>' }),
    wStyle("MemoPoint", "Memo Point", { size: 12.5, bold: true, color: "111111", pPr: '<w:spacing w:before="140" w:after="160" w:line="340" w:lineRule="auto"/>' }),
    wStyle("MemoClosing", "Memo Closing", { size: 13, bold: true, color: "111111", pPr: '<w:jc w:val="center"/><w:spacing w:before="700" w:after="950"/>' }),
    wStyle("MemoCC", "Memo CC", { size: 11, bold: true, color: "111111", pPr: '<w:jc w:val="right"/><w:spacing w:after="80"/>' }),
    `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:bidi/><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr>${wRunProps(8, false, "111111")}</w:rPr></w:style>`,
    wStyle("RPKingdom", "RP Kingdom", { size: 9, bold: true, pPr: center }),
    wStyle("RPMinistry", "RP Ministry", { size: 12, bold: true, color: "2B4922", pPr: center }),
    wStyle("RPDirectorate", "RP Directorate", { size: 11, bold: true, color: "9A7418", pPr: center }),
    wStyle("RPRef", "RP Reference", { size: 7.5 }),
    wStyle("RPTitle", "RP Title", { size: 14, bold: true, color: "1E3518", pPr: center + '<w:spacing w:before="120" w:after="60"/>', rPr: "<w:u w:val=\"single\"/>" }),
    wStyle("RPSubtitle", "RP Subtitle", { size: 7.5, color: "475569", pPr: center + '<w:spacing w:after="140"/>' }),
    wStyle("RPSection", "RP Section", { size: 9, bold: true, color: "2B4922", pPr: sectionBorder + '<w:shd w:val="clear" w:fill="EEF5EB"/><w:spacing w:before="140" w:after="80"/>' }),
    wStyle("RPMetaLabel", "RP Meta Label", { size: 8, bold: true, color: "334155" }),
    wStyle("RPMetaValue", "RP Meta Value", { size: 8 }),
    wStyle("RPTableHeader", "RP Table Header", { size: 7.5, bold: true, color: "1E3518", pPr: center }),
    wStyle("RPTableCell", "RP Table Cell", { size: 7.5, pPr: center }),
    wStyle("RPTableNum", "RP Table Number", { size: 7.5 }),
    wStyle("RPSumLabel", "RP Sum Label", { size: 7, color: "475569", pPr: center }),
    wStyle("RPSumValue", "RP Sum Value", { size: 9, bold: true, color: "1E3518", pPr: center }),
    wStyle("RPNote", "RP Note", { size: 7.5, bold: true, color: "1E3518" }),
    wStyle("RPSigLabel", "RP Signature Label", { size: 8, pPr: center }),
    wStyle("RPSigName", "RP Signature Name", { size: 8, bold: true, color: "1E3518", pPr: center }),
    wStyle("RPSigSub", "RP Signature Sub", { size: 8, pPr: center }),
    wStyle("RPFooter", "RP Footer", { size: 7, color: "475569", pPr: center }),
    wStyle("MemoMinistry", "Memo Ministry", { size: 15, bold: true, color: "111111", pPr: center }),
    wStyle("MemoDocTitle", "Memo Doc Title", { size: 15, bold: true, color: "111111", pPr: center }),
    wStyle("MemoCellRight", "Memo Cell Right", { size: 11, bold: true, color: "111111" }),
    wStyle("MemoCellCenter", "Memo Cell Center", { size: 11, bold: true, color: "111111", pPr: center }),
    wStyle("MemoSubject", "Memo Subject", { size: 13, bold: true, color: "111111", pPr: '<w:ind w:right="720" w:left="420"/><w:spacing w:before="440" w:after="360" w:line="360" w:lineRule="auto"/>', rPr: '<w:u w:val="single"/>' }),
    wStyle("MemoBody", "Memo Body", { size: 12.5, bold: true, color: "111111", pPr: '<w:jc w:val="both"/><w:spacing w:before="240" w:after="200" w:line="380" w:lineRule="auto"/>' }),
    wStyle("MemoNotice", "Memo Notice", { size: 12.5, bold: true, color: "111111", pPr: '<w:ind w:right="360"/><w:spacing w:before="180" w:after="200" w:line="380" w:lineRule="auto"/>' }),
    wStyle("MemoPoint", "Memo Point", { size: 12.5, bold: true, color: "111111", pPr: '<w:spacing w:before="140" w:after="160" w:line="380" w:lineRule="auto"/>' }),
    wStyle("MemoClosing", "Memo Closing", { size: 13, bold: true, color: "111111", pPr: center + '<w:spacing w:before="720" w:after="960"/>' }),
    wStyle("MemoCC", "Memo CC", { size: 10.5, bold: true, color: "111111", pPr: '<w:spacing w:before="80" w:after="80" w:line="320" w:lineRule="auto"/>' })
  ];
  return `${xmlHeader()}<w:styles xmlns:w="${OOXML_XMLNS.word}">${styles.join("")}</w:styles>`;
}

function wPUnicodeDotG(opts = {}) {
  return `<w:p>${opts.pPr || ""}<w:r><w:t xml:space="preserve">· ع </w:t></w:r></w:p>`;
}

function buildMemoDocxHeader(logo) {
  return `${xmlHeader()}
<w:hdr xmlns:w="${OOXML_XMLNS.word}" xmlns:r="${OOXML_XMLNS.officeRel}" xmlns:wp="${OOXML_XMLNS.wp}" xmlns:a="${OOXML_XMLNS.drawing}" xmlns:pic="${OOXML_XMLNS.pic}">
  ${wTbl([wTr([
    wTc(logo ? [wLogoDrawing(logo, "rId1")] : [wP("🏛️", "MemoMinistry")], 2000, "MemoMinistry"),
    wTc([wP("وزارة الأشغال العامة والإسكان", "MemoMinistry"), wP("مذكرة داخلية", "MemoDocTitle")], 4000, "MemoMinistry")
  ])], [2000, 4000])}
</w:hdr>`;
}

function buildMemoDocxFooter() {
  return `${xmlHeader()}<w:ftr xmlns:w="${OOXML_XMLNS.word}"><w:p><w:pPr><w:jc w:val="right"/></w:pPr></w:p></w:ftr>`;
}

function buildMemoDocx(p, report, meta, items, points) {
  const docNo = (meta && meta.docNo) || `${p.projectNo}/مذكرة/${String(report.serialNumber).padStart(3, "0")}`;
  const memoDate = typeof ltrDate === "function" ? ltrDate((meta && meta.date) || report.date) : formatDate((meta && meta.date) || report.date);
  const fromText = (meta && meta.fromText) || "رئيس قسم المختبر / م.براءة الغليلات";
  const toText = (meta && meta.toText) || "مدير أشغال محافظة مادبا";
  const subjectText = (meta && meta.subject) || (typeof buildDefaultMemoSubject === "function" ? buildDefaultMemoSubject(p) : `عطاء رقم ${p.projectNo} الخاص بـ ${p.name}`);
  const logo = getReportLogoImage();
  const thin = { top: { sz: 6 }, left: {}, bottom: {}, right: {} };
  const body = [];
  const colWidths = [3800, 3000, 1600, 1600];

  body.push(wTbl([
    wTr([wTc("", colWidths[0], "MemoCellRight", { shade: "F8FAFC", borders: thin }), wTc("", colWidths[1], "MemoCellCenter", { shade: "F8FAFC", borders: thin }), wTc("التوقيع", colWidths[2], "MemoCellCenter", { shade: "F8FAFC", borders: thin }), wTc("التاريخ", colWidths[3], "MemoCellCenter", { shade: "F8FAFC", borders: thin })]),
    wTr([
      wTc(`من   ${fromText}`, colWidths[0], "MemoCellRight", { shade: "F2E8CF", borders: thin }),
      wTc(toText, colWidths[1], "MemoCellCenter", { shade: "F2E8CF", borders: thin }),
      wTc(" ", colWidths[2], "MemoCellCenter", { shade: "F2E8CF", borders: thin }),
      wTc(memoDate, colWidths[3], "MemoCellCenter", { shade: "F2E8CF", borders: thin })
    ]),
    wTr([
      wTc("من", colWidths[0], "MemoCellRight", { borders: thin }),
      wTc("إلى", colWidths[1], "MemoCellRight", { borders: thin }),
      wTc(" ", colWidths[2], "MemoCellCenter", { borders: thin }),
      wTc(" ", colWidths[3], "MemoCellCenter", { borders: thin })
    ]),
    wTr([
      wTc("من", colWidths[0], "MemoCellRight", { borders: thin }),
      wTc("إلى", colWidths[1], "MemoCellRight", { borders: thin }),
      wTc(" ", colWidths[2], "MemoCellCenter", { borders: thin }),
      wTc(" ", colWidths[3], "MemoCellCenter", { borders: thin })
    ])
  ], colWidths));

  body.push(wP(`الموضوع :- ${subjectText}`, "MemoSubject"));
  body.push(wPUnicodeDotG());
  body.push(wP("إشارة إلى موضوع البحث أعلاه ، بخصوص الحسميات على الشذوذات في الفحوصات المخبرية التابعه للعطاء مدار البحث. واستنادا إلى أسس القبول والقبول مع الحسم والرفض لمشاريع الطرق عام 2024.", "MemoBody"));
  body.push(wP("* أرجو العلم أن قيمة الحسم كما هو موضح بالمرفق كــــــــــــــــــــما يلي :", "MemoNotice"));
  (points || []).forEach((line) => body.push(wP(line, "MemoPoint")));
  body.push(wPUnicodeDotG());
  body.push(wP("وتفضلوا الاحترام ،،،", "MemoClosing"));
  body.push(wP("نسخه/ نسخه/ رئيس قسم المــــــــــــــــــــختبر", "MemoCC"));
  body.push(wP("نسخه / للــــــــــــــــــــــــــــــــــــــــملف", "MemoCC"));

  const document = `${xmlHeader()}
<w:document xmlns:w="${OOXML_XMLNS.word}" xmlns:r="${OOXML_XMLNS.officeRel}" xmlns:wp="${OOXML_XMLNS.wp}" xmlns:a="${OOXML_XMLNS.drawing}" xmlns:pic="${OOXML_XMLNS.pic}">
  <w:body>
    ${body.join("")}
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId1"/>
      <w:footerReference w:type="default" r:id="rId2"/>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="720" w:right="900" w:bottom="720" w:left="900" w:header="360" w:footer="360" w:gutter="0"/>
      <w:bidi/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const parts = [
    { name: "[Content_Types].xml", data: `${xmlHeader()}
<Types xmlns="${OOXML_XMLNS.ct}">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>` },
    { name: "_rels/.rels", data: `${xmlHeader()}
<Relationships xmlns="${OOXML_XMLNS.rel}">
  <Relationship Id="rId1" Type="${OOXML_XMLNS.officeRel}/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="${OOXML_XMLNS.officeRel}/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="${OOXML_XMLNS.officeRel}/extended-properties" Target="docProps/app.xml"/>
</Relationships>` },
    { name: "word/document.xml", data: document },
    { name: "word/styles.xml", data: buildDocxStyles() },
    { name: "word/header1.xml", data: buildMemoDocxHeader(logo) },
    { name: "word/footer1.xml", data: buildMemoDocxFooter() },
    { name: "word/_rels/document.xml.rels", data: `${xmlHeader()}
<Relationships xmlns="${OOXML_XMLNS.rel}">
  <Relationship Id="rId1" Type="${OOXML_XMLNS.officeRel}/header" Target="header1.xml"/>
  <Relationship Id="rId2" Type="${OOXML_XMLNS.officeRel}/footer" Target="footer1.xml"/>
  <Relationship Id="rId3" Type="${OOXML_XMLNS.officeRel}/styles" Target="styles.xml"/>
</Relationships>` },
    { name: "word/_rels/header1.xml.rels", data: `${xmlHeader()}
<Relationships xmlns="${OOXML_XMLNS.rel}">
  <Relationship Id="rId1" Type="${OOXML_XMLNS.officeRel}/image" Target="media/logo.png"/>
</Relationships>` },
    { name: "docProps/core.xml", data: officeCoreProps(docNo) },
    { name: "docProps/app.xml", data: officeAppProps("Microsoft Office Word") }
  ];
  if (logo) parts.push({ name: "word/media/logo.png", data: logo.bytes });

  return ooxmlZip(parts);
}

function wP(text, style, opts) {
  opts = opts || {};
  const pPr = `<w:pPr><w:pStyle w:val="${style}"/>${opts.keepNext ? "<w:keepNext/>" : ""}${opts.pPr || ""}</w:pPr>`;
  const runs = Array.isArray(text)
    ? text.map((r) => `<w:r>${r.bold ? "<w:rPr><w:b/><w:bCs/><w:rtl/></w:rPr>" : ""}<w:t xml:space="preserve">${escXML(r.text)}</w:t></w:r>`).join("")
    : `<w:r><w:t xml:space="preserve">${escXML(text)}</w:t></w:r>`;
  return `<w:p>${pPr}${runs}</w:p>`;
}

function wTcBorders(spec) {
  if (!spec) return "";
  const sides = ["top", "left", "bottom", "right", "insideH", "insideV"]
    .map((s) => spec[s] ? `<w:${s} w:val="${spec[s].val || "single"}" w:sz="${spec[s].sz || 6}" w:space="0" w:color="${spec[s].color || "94A3B8"}"/>` : "")
    .join("");
  return `<w:tcBorders>${sides}</w:tcBorders>`;
}

function wTc(text, width, style, opts) {
  opts = opts || {};
  const tcPr = `<w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${wTcBorders(opts.borders)}${opts.shade ? `<w:shd w:val="clear" w:fill="${opts.shade}"/>` : ""}<w:vAlign w:val="center"/></w:tcPr>`;
  // المصفوفة تعني فقرات OOXML جاهزة (w:p / w:drawing)؛ النص المفرد يُغلَّف تلقائياً
  const paras = Array.isArray(text) ? text : [wP(text, style)];
  return `<w:tc>${tcPr}${paras.join("")}</w:tc>`;
}

function wTr(cells, opts) {
  opts = opts || {};
  return `<w:tr><w:trPr>${opts.noSplit === false ? "" : "<w:cantSplit/>"}${opts.header ? "<w:tblHeader/>" : ""}</w:trPr>${cells.join("")}</w:tr>`;
}

function wTbl(rows, widths) {
  return `<w:tbl><w:tblPr><w:bidiVisual/><w:tblW w:w="${widths.reduce((a, b) => a + b, 0)}" w:type="dxa"/><w:tblLayout w:type="fixed"/></w:tblPr>` +
    `<w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>${rows.join("")}</w:tbl>`;
}

function wLogoDrawing(logo, rId) {
  const ext = logoExtent(logo, 42);
  return `<w:p><w:pPr><w:bidi/><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${ext.cx}" cy="${ext.cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>` +
    `<wp:docPr id="10" name="شعار وزارة الأشغال العامة والإسكان" descr="شعار وزارة الأشغال العامة والإسكان"/>` +
    `<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="${OOXML_XMLNS.drawing}" noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
    `<a:graphic xmlns:a="${OOXML_XMLNS.drawing}"><a:graphicData uri="${OOXML_XMLNS.pic}">` +
    `<pic:pic xmlns:pic="${OOXML_XMLNS.pic}"><pic:nvPicPr><pic:cNvPr id="11" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip xmlns:r="${OOXML_XMLNS.officeRel}" r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${ext.cx}" cy="${ext.cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

function buildDocxHeader(logo, p, report, docLabel) {
  const border = { top: {}, left: {}, bottom: {}, right: {} };
  const refDate = typeof ltrDate === "function" ? ltrDate(report.date) : formatDate(report.date);
  const refParas = [
    wP([{ text: (docLabel || "رقم التقرير:") + " " }, { text: report.reportNo, bold: true }], "RPRef"),
    wP(`التسلسل: (${report.serialNumber})`, "RPRef"),
    wP(`التاريخ: ${refDate}`, "RPRef"),
    wP(`رقم المشروع: ${p.projectNo}`, "RPRef")
  ];
  return `${xmlHeader()}
<w:hdr xmlns:w="${OOXML_XMLNS.word}" xmlns:r="${OOXML_XMLNS.officeRel}" xmlns:wp="${OOXML_XMLNS.wp}" xmlns:a="${OOXML_XMLNS.drawing}" xmlns:pic="${OOXML_XMLNS.pic}">
  ${wTbl([wTr([
    wTc(logo ? [wLogoDrawing(logo, "rId1")] : [wP("🏛️", "RPKingdom")], 1000, "RPKingdom"),
    wTc([
      wP("المملكة الأردنية الهاشمية", "RPKingdom"),
      wP("وزارة الأشغال العامة والإسكان", "RPMinistry"),
      wP("مديرية أشغال محافظة مأدبا", "RPDirectorate"),
      wP("المختبر المركزي-الحسميات والشذوذات", "RPKingdom")
    ], 6600, "RPKingdom"),
    wTc(refParas, 3200, "RPRef", { borders: border })
  ], { noSplit: true })], [1000, 6600, 3200])}
</w:hdr>`;
}

function buildDocxFooter(report, docLabel) {
  const text = `مديرية أشغال محافظة مأدبا — المختبر المركزي-الحسميات والشذوذات — وزارة الأشغال العامة والإسكان | ${docLabel || "رقم التقرير:"} ${report.reportNo} | صفحة 1 من 1`;
  return `${xmlHeader()}
<w:ftr xmlns:w="${OOXML_XMLNS.word}">
  ${wP(text, "RPFooter", { pPr: '<w:pBdr><w:top w:val="double" w:sz="12" w:space="2" w:color="2B4922"/></w:pBdr><w:spacing w:before="80"/>' })}
</w:ftr>`;
}

function buildDocx(p, report, view) {
  const shown = view || (typeof getReportView === "function" ? getReportView(p, report) : { items: report.items, totals: report.totals });
  const t = shown.totals;
  const logo = getReportLogoImage();
  const sig = getSignatureFlags(report);
  const body = [];

  body.push(wP("تقرير الحسميات والشذوذات المخبرية", "RPTitle", { keepNext: true }));
  body.push(wP("مُعدّ وفق أسس القبول والقبول مع الحسم والرفض لمشاريع الطرق — الإصدار 2023 م (البند 2.0، صفحة 16–17)", "RPSubtitle"));

  body.push(wP("أولاً: بيانات المشروع", "RPSection", { keepNext: true }));
  const thin = { top: {}, left: {}, bottom: {}, right: {} };
  const metaPairs = [
    ["اسم المشروع:", p.name, "رقم المشروع:", p.projectNo],
    ["المقاول:", p.contractor || "---", "نوع العينة:", p.sampleType || "---"],
    ["الموقع:", p.location || "---", "طول المشروع:", p.lengthKm || "---"]
  ];
  body.push(wTbl(metaPairs.map((m) => wTr([
    wTc(m[0], 1500, "RPMetaLabel", { shade: "F1F5F9", borders: thin }),
    wTc(m[1], 3900, "RPMetaValue", { borders: thin }),
    wTc(m[2], 1500, "RPMetaLabel", { shade: "F1F5F9", borders: thin }),
    wTc(m[3], 3900, "RPMetaValue", { borders: thin })
  ])), [1500, 3900, 1500, 3900]));

  body.push(wP("ثانياً: جدول الفحوصات والحسميات المالية", "RPSection", { keepNext: true }));
  const widths = [420, 1850, 850, 1800, 1250, 850, 950, 850, 1050, 1130];
  const heads = ["#", "الموقع / العينة", "الطبقة (الجدول)", "الفحص المخبري", "قيمة الأعمال (ك×س)\nد.أ", "ق1\nالتنفيذ", "ق2\nضبط الجودة", "ق3\nالاستلام", "الحسم الكلي\nد.أ", "القرار"];
  const tableRows = [wTr(heads.map((h) => wTc(h.split("\n").map((line) => wP(line, "RPTableHeader")), widths[heads.indexOf(h)], "RPTableHeader", { shade: "E4DAC4", borders: thin })), { header: true })];

  shown.items.forEach((it, idx) => {
    const shade = idx % 2 === 1 ? "F8FAFC" : null;
    const numStyle = "RPTableNum";
    const cellStyle = "RPTableCell";
    tableRows.push(wTr([
      wTc(String(idx + 1), widths[0], cellStyle, { shade, borders: thin }),
      wTc(it.location, widths[1], cellStyle, { shade, borders: thin }),
      wTc(tableRefText(it), widths[2], cellStyle, { shade, borders: thin }),
      wTc(it.itemName, widths[3], cellStyle, { shade, borders: thin }),
      wTc(formatMoney(it.totalWorkValue), widths[4], numStyle, { shade, borders: thin }),
      wTc(formatMoney(it.q1), widths[5], numStyle, { shade, borders: thin }),
      wTc(formatMoney(it.q2), widths[6], numStyle, { shade, borders: thin }),
      wTc(formatMoney(it.q3), widths[7], numStyle, { shade, borders: thin }),
      wTc(formatMoney(it.totalDeduction), widths[8], numStyle, { shade, borders: thin }),
      wTc(it.finalDecision, widths[9], cellStyle, { shade, borders: thin })
    ]));
  });

  tableRows.push(wTr([
    wTc("الإجمالي العام", widths[0] + widths[1] + widths[2] + widths[3], "RPTableCell", { shade: "F1F5F9", borders: thin }),
    wTc(formatMoney(t.work), widths[4], "RPTableNum", { shade: "F1F5F9", borders: thin }),
    wTc(formatMoney(t.q1), widths[5], "RPTableNum", { shade: "F1F5F9", borders: thin }),
    wTc(formatMoney(t.q2), widths[6], "RPTableNum", { shade: "F1F5F9", borders: thin }),
    wTc(formatMoney(t.q3), widths[7], "RPTableNum", { shade: "F1F5F9", borders: thin }),
    wTc(formatMoney(t.deduction), widths[8], "RPTableNum", { shade: "F1F5F9", borders: thin }),
    wTc("---", widths[9], "RPTableCell", { shade: "F1F5F9", borders: thin })
  ]));
  body.push(wTbl(tableRows, widths));

  const greenTop = { top: { val: "single", sz: 18, color: "2B4922" }, left: {}, bottom: {}, right: {} };
  const goldTop = { top: { val: "single", sz: 18, color: "C59B27" }, left: {}, bottom: {}, right: {} };
  body.push(wP("", "RPSumValue", { pPr: '<w:spacing w:before="60"/>' }));
  body.push(wTbl([
    wTr([
      wTc("حسم فحوصات التنفيذ (ق1)", 2700, "RPSumLabel", { borders: greenTop }),
      wTc("حسم ضبط الجودة (ق2)", 2700, "RPSumLabel", { borders: greenTop }),
      wTc("حسم لجنة الاستلام (ق3)", 2700, "RPSumLabel", { borders: greenTop }),
      wTc("إجمالي الحسم (ق.ك)", 2700, "RPSumLabel", { shade: "FEF3C7", borders: goldTop })
    ]),
    wTr([
      wTc(formatMoney(t.q1), 2700, "RPSumValue", { borders: greenTop }),
      wTc(formatMoney(t.q2), 2700, "RPSumValue", { borders: greenTop }),
      wTc(formatMoney(t.q3), 2700, "RPSumValue", { borders: greenTop }),
      wTc(`${formatMoney(t.deduction)} د.أ`, 2700, "RPSumValue", { shade: "FEF3C7", borders: goldTop })
    ])
  ], [2700, 2700, 2700, 2700]));

  body.push(wP([{ text: "ملاحظة: ", bold: true }, { text: "الكميات كما وردتنا من قسم المساحة والدراسات", bold: true }], "RPNote", {
    pPr: '<w:pBdr><w:top w:val="single" w:sz="6" w:space="2" w:color="94A3B8"/><w:left w:val="single" w:sz="6" w:space="2" w:color="94A3B8"/><w:bottom w:val="single" w:sz="6" w:space="2" w:color="94A3B8"/><w:right w:val="single" w:sz="6" w:space="2" w:color="94A3B8"/></w:pBdr><w:shd w:val="clear" w:fill="F8FAFC"/><w:spacing w:before="140" w:after="80"/>'
  }));

  const signatureBlocks = [];
  if (sig.engineer) signatureBlocks.push(["أعدّ التقرير", "مهندس المختبر / مختبر الطرق", "الاسم: ................................."]);
  if (sig.head) signatureBlocks.push(["تدقيق ومراجعة", "رئيس قسم مختبر مديرية أشغال محافظة مأدبا", "الاسم: م.براءة الغليلات"]);
  if (sig.director) signatureBlocks.push(["وافق", "مدير أشغال محافظة مأدبا", "الاسم: ................................."]);

  if (signatureBlocks.length) {
    const widthsByCount = { 1: [10800], 2: [5400, 5400], 3: [3600, 3600, 3600] };
    const sigWidths = widthsByCount[signatureBlocks.length];
    const sigCells = signatureBlocks.map((b, i) => wTc([
      wP(b[0], "RPSigLabel", { pPr: '<w:spacing w:before="180" />' }),
      wP(b[1], "RPSigName", { pPr: '<w:pBdr><w:top w:val="single" w:sz="6" w:space="4" w:color="334155"/></w:pBdr><w:spacing w:before="10" w:after="40"/>' }),
      wP(b[2], "RPSigSub")
    ], sigWidths[i], "RPSigLabel"));
    body.push(wP("", "RPSigLabel", { pPr: '<w:spacing w:before="60"/>' }));
    body.push(wTbl([wTr(sigCells, { noSplit: true })], sigWidths));
  }

  const document = `${xmlHeader()}
<w:document xmlns:w="${OOXML_XMLNS.word}" xmlns:r="${OOXML_XMLNS.officeRel}" xmlns:wp="${OOXML_XMLNS.wp}" xmlns:a="${OOXML_XMLNS.drawing}" xmlns:pic="${OOXML_XMLNS.pic}">
  <w:body>
    ${body.join("")}
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId1"/>
      <w:footerReference w:type="default" r:id="rId2"/>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="454" w:right="454" w:bottom="454" w:left="454" w:header="170" w:footer="170" w:gutter="0"/>
      <w:bidi/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const parts = [
    { name: "[Content_Types].xml", data: `${xmlHeader()}
<Types xmlns="${OOXML_XMLNS.ct}">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>` },
    { name: "_rels/.rels", data: `${xmlHeader()}
<Relationships xmlns="${OOXML_XMLNS.rel}">
  <Relationship Id="rId1" Type="${OOXML_XMLNS.officeRel}/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="${OOXML_XMLNS.officeRel}/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="${OOXML_XMLNS.officeRel}/extended-properties" Target="docProps/app.xml"/>
</Relationships>` },
    { name: "word/document.xml", data: document },
    { name: "word/styles.xml", data: buildDocxStyles() },
    { name: "word/header1.xml", data: buildDocxHeader(logo, p, report) },
    { name: "word/footer1.xml", data: buildDocxFooter(report) },
    { name: "word/_rels/document.xml.rels", data: `${xmlHeader()}
<Relationships xmlns="${OOXML_XMLNS.rel}">
  <Relationship Id="rId1" Type="${OOXML_XMLNS.officeRel}/header" Target="header1.xml"/>
  <Relationship Id="rId2" Type="${OOXML_XMLNS.officeRel}/footer" Target="footer1.xml"/>
  <Relationship Id="rId3" Type="${OOXML_XMLNS.officeRel}/styles" Target="styles.xml"/>
</Relationships>` },
    { name: "word/_rels/header1.xml.rels", data: `${xmlHeader()}
<Relationships xmlns="${OOXML_XMLNS.rel}">
  <Relationship Id="rId1" Type="${OOXML_XMLNS.officeRel}/image" Target="media/logo.png"/>
</Relationships>` },
    { name: "docProps/core.xml", data: officeCoreProps(report.reportNo) },
    { name: "docProps/app.xml", data: officeAppProps("Microsoft Office Word") }
  ];
  if (logo) parts.push({ name: "word/media/logo.png", data: logo.bytes });

  return ooxmlZip(parts);
}

/* ==================== كتاب المقاول / المذكرة الداخلية (docx حقيقي) ==================== */
function buildCorrespondenceDocx(kind, p, report, items, meta) {
  const rawPoints = (meta && meta.note && meta.note.trim())
    ? meta.note.trim()
    : (typeof buildDefaultMemoPoints === "function" ? buildDefaultMemoPoints(items) : "");
  const points = rawPoints.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return buildMemoDocx(p, report, meta, items, points);
}

/* ==================== تصدير المذكرة المحرّرة (Word حي — altChunk) ==================== */
function buildCorrespondenceDocxFromHtml(html, docNo, meta) {
  const logo = getReportLogoImage();
  const safeHtml = String(html || "")
    .replace(/contenteditable="[^"]*"/g, "")
    .replace(/spellcheck="[^"]*"/g, "");
  const htmlPart = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${escXML(docNo || "مذكرة")}</title></head><body>${safeHtml}</body></html>`;
  const emptyFooter = `${xmlHeader()}<w:ftr xmlns:w="${OOXML_XMLNS.word}"><w:p><w:pPr><w:pStyle w:val="RPFooter"/></w:pPr></w:p></w:ftr>`;
  const document = `${xmlHeader()}
<w:document xmlns:w="${OOXML_XMLNS.word}" xmlns:r="${OOXML_XMLNS.officeRel}" xmlns:wp="${OOXML_XMLNS.wp}" xmlns:a="${OOXML_XMLNS.drawing}" xmlns:pic="${OOXML_XMLNS.pic}">
  <w:body>
    <w:altChunk r:id="rIdAlt"/>
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId1"/>
      <w:footerReference w:type="default" r:id="rId2"/>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="720" w:right="900" w:bottom="720" w:left="900" w:header="360" w:footer="360" w:gutter="0"/>
      <w:bidi/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const parts = [
    { name: "[Content_Types].xml", data: `${xmlHeader()}
<Types xmlns="${OOXML_XMLNS.ct}">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="html" ContentType="text/html"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
  <Override PartName="/word/altChunk1.html" ContentType="text/html"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>` },
    { name: "_rels/.rels", data: `${xmlHeader()}
<Relationships xmlns="${OOXML_XMLNS.rel}">
  <Relationship Id="rId1" Type="${OOXML_XMLNS.officeRel}/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="${OOXML_XMLNS.officeRel}/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="${OOXML_XMLNS.officeRel}/extended-properties" Target="docProps/app.xml"/>
</Relationships>` },
    { name: "word/document.xml", data: document },
    { name: "word/styles.xml", data: buildDocxStyles() },
    { name: "word/header1.xml", data: buildMemoDocxHeader(logo) },
    { name: "word/footer1.xml", data: emptyFooter },
    { name: "word/altChunk1.html", data: htmlPart },
    { name: "word/_rels/document.xml.rels", data: `${xmlHeader()}
<Relationships xmlns="${OOXML_XMLNS.rel}">
  <Relationship Id="rId1" Type="${OOXML_XMLNS.officeRel}/header" Target="header1.xml"/>
  <Relationship Id="rId2" Type="${OOXML_XMLNS.officeRel}/footer" Target="footer1.xml"/>
  <Relationship Id="rId3" Type="${OOXML_XMLNS.officeRel}/styles" Target="styles.xml"/>
  <Relationship Id="rIdAlt" Type="${OOXML_XMLNS.officeRel}/afChunk" Target="altChunk1.html"/>
</Relationships>` },
    { name: "word/_rels/header1.xml.rels", data: `${xmlHeader()}
<Relationships xmlns="${OOXML_XMLNS.rel}">
  <Relationship Id="rId1" Type="${OOXML_XMLNS.officeRel}/image" Target="media/logo.png"/>
</Relationships>` },
    { name: "docProps/core.xml", data: officeCoreProps(docNo) },
    { name: "docProps/app.xml", data: officeAppProps("Microsoft Office Word") }
  ];
  if (logo) parts.push({ name: "word/media/logo.png", data: logo.bytes });

  return ooxmlZip(parts);
}
