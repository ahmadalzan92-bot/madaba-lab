// المحرك الهندسي لحساب الحسميات والشذوذات المخبرية لمشاريع الطرق (إصدار 2023)
// وزارة الأشغال العامة والإسكان - مديرية أشغال محافظة مأدبا - المملكة الأردنية الهاشمية

const PROJECTS_STORAGE_KEY = "madaba_pw_projects_v1";
let projectsState = {
  nextProjectSerial: 1,
  activeProjectId: null,
  projects: []
};
let currentPrintReportHTML = "";
let currentPrintProjectId = null;
let currentPrintReportId = null;
let currentCalculationResult = null;
let currentCompactionResult = null;

// كورات درجة الرك مقسّمة حسب الجهة/المرحلة: تنفيذ، ضبط جودة، لجنة استلام
let compactionCoresByStage = {
  exec: [
    { id: 1, label: "كور رقم (1)", readingPct: 97.0 },
    { id: 2, label: "كور رقم (2)", readingPct: 94.0 },
    { id: 3, label: "كور رقم (3)", readingPct: 96.5 },
    { id: 4, label: "كور رقم (4)", readingPct: 94.0 },
    { id: 5, label: "كور رقم (5)", readingPct: 96.0 }
  ],
  qc: [
    { id: 1, label: "كور رقم (1)", readingPct: 97.0 },
    { id: 2, label: "كور رقم (2)", readingPct: 98.0 },
    { id: 3, label: "كور رقم (3)", readingPct: 97.5 }
  ],
  acceptance: [
    { id: 1, label: "كور رقم (1)", readingPct: 97.5 },
    { id: 2, label: "كور رقم (2)", readingPct: 97.0 },
    { id: 3, label: "كور رقم (3)", readingPct: 97.0 }
  ]
};
// إبقاء الاسم القديم مرجعاً لكورات التنفيذ لعدم كسر أي استدعاء قديم
let compactionCoresState = compactionCoresByStage.exec;

// إعدادات الجدول المرجعي ونوع الطريق لحاسبة الرك
let compactionSetupState = { roadCategory: "main", tableKey: "t10_old" };
let currentCompactionStageResults = {};

/* ==================== توحيد الأرقام اللاتينية (0-9) في كل البرنامج ==================== */
const ARABIC_DIGITS_RE = /[\u0660-\u0669\u06F0-\u06F9]/g;
const HAS_ARABIC_DIGITS_RE = /[\u0660-\u0669\u06F0-\u06F9]/;

function toWesternDigits(value) {
  return String(value == null ? "" : value).replace(ARABIC_DIGITS_RE, (ch) => {
    const code = ch.charCodeAt(0);
    return String(code <= 0x0669 ? code - 0x0660 : code - 0x06F0);
  });
}

function forceInputWesternDigits(el) {
  if (!el || el.tagName !== "INPUT") return;
  if (el.type === "number") {
    el.type = "text";
    el.setAttribute("inputmode", "decimal");
    el.setAttribute("lang", "en");
    el.setAttribute("dir", "ltr");
  }
  if (HAS_ARABIC_DIGITS_RE.test(el.value || "")) el.value = toWesternDigits(el.value);
}

function normalizeDigitInputs(root = document) {
  forceInputWesternDigits(root.nodeType === 1 && root.tagName === "INPUT" ? root : null);
  root.querySelectorAll('input[type="number"], input[inputmode="decimal"]').forEach(forceInputWesternDigits);
}

function normalizeTextDigits(root = document) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (HAS_ARABIC_DIGITS_RE.test(node.nodeValue)) node.nodeValue = toWesternDigits(node.nodeValue);
  }
}

function initWesternDigits() {
  normalizeDigitInputs(document);
  normalizeTextDigits(document);
  document.addEventListener("input", (e) => {
    const el = e.target;
    if (!el || typeof el.value !== "string") return;
    if (!HAS_ARABIC_DIGITS_RE.test(el.value)) return;
    const pos = typeof el.selectionStart === "number" ? el.selectionStart : el.value.length;
    el.value = toWesternDigits(el.value);
    try { el.setSelectionRange(pos, pos); } catch (err) { /* تجاهل الحقول غير النصية */ }
  });
  const observer = new MutationObserver((mutations) => {
    let changed = false;
    mutations.forEach((m) => {
      m.addedNodes.forEach((n) => {
        if (n.nodeType === 1) {
          normalizeDigitInputs(n);
          if (HAS_ARABIC_DIGITS_RE.test(n.textContent || "")) changed = true;
        } else if (n.nodeType === 3 && HAS_ARABIC_DIGITS_RE.test(n.nodeValue)) {
          changed = true;
        }
      });
    });
    if (changed) normalizeTextDigits(document);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

document.addEventListener("DOMContentLoaded", () => {
  initWesternDigits();
  initDateBidiProtection();
  initNavigationTabs();
  initProjectsModule();
  initMainCalculatorSelectors();
  renderStageCoresInputs("exec");
  renderStageCoresInputs("qc");
  calculateStageCores();
  syncCompactionSelectors();
  renderAllCompactionCores();
  calculateAsphaltCompaction();
  calculateSubbaseThickness();
  calculateTestPitsCount();
  renderInteractiveExamples();
  renderReferenceTables();
  updateDuplicateWarningBanner(); // تنبيه التكرار عند التحميل إذا كانت النتيجة الأولية مطابقة لسجل المشروع

  window.addEventListener("afterprint", () => {
    const printContainer = document.getElementById("printReportContainer");
    if (printContainer) printContainer.innerHTML = "";
  });
});

// ==================== التنقل بين التبويبات ====================
function initNavigationTabs() {
  const tabButtons = document.querySelectorAll(".nav-tab");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab");
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabPanels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add("active");
      // إعادة قياس حقول الكشف النصية بعد إظهار التبويب حتى تظهر الكلمات كاملة
      if (targetId === "tab-main-calc" && typeof autoSizeLogTextareas === "function") {
        requestAnimationFrame(autoSizeLogTextareas);
      }
      // تحديث لوحة التقارير عند فتح تبويب التقارير
      if (targetId === "tab-reports" && typeof renderReportsDashboard === "function") {
        renderReportsDashboard();
      }
      // إعادة الصفحة للأعلى عند تغيير القسم حتى تظهر بداية القسم كاملة
      window.scrollTo(0, 0);
    });
  });
}

function switchToTab(tabId) {
  const btn = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
  if (btn) btn.click();
}

// ==================== 1. الحاسبة الشاملة (معادلة 1 و 2 وجميع الجداول 5-16) ====================
function initMainCalculatorSelectors() {
  const roadCategorySelect = document.getElementById("roadCategorySelect");
  const tableSelect = document.getElementById("tableSelect");
  const testItemSelect = document.getElementById("testItemSelect");
  const weightCaseSelect = document.getElementById("weightCaseSelect");

  // تعبئة حالات الأوزان النسبية من الجدول رقم (3)
  weightCaseSelect.innerHTML = MPWH_DATA.table3_stageWeights
    .map((c) => `<option value="${c.caseId}">${c.name} [ت:${c.w1Text} | ض:${c.w2Text} | س:${c.w3Text}]</option>`)
    .join("");
  weightCaseSelect.value = "3"; // افتراضياً الحالة 3 (60% تنفيذ + 40% ضبط جودة) كما في المثال 1

  roadCategorySelect.addEventListener("change", () => {
    populateTablesDropdown();
    populateTestItemsDropdown();
    calculateMainDeduction();
  });

  tableSelect.addEventListener("change", () => {
    populateTestItemsDropdown();
    calculateMainDeduction();
  });

  testItemSelect.addEventListener("change", () => {
    onTestItemChanged();
    calculateMainDeduction();
  });

  weightCaseSelect.addEventListener("change", () => {
    updateStageCardsWeightsUI();
    calculateMainDeduction();
  });

  document.getElementById("repQuantityInput").addEventListener("input", calculateMainDeduction);
  document.getElementById("unitPriceInput").addEventListener("input", calculateMainDeduction);

  initWeightSelectors();
  populateTablesDropdown();
  populateTestItemsDropdown();
  updateStageCardsWeightsUI();
  // تحميل المثال الأول للفرشيات افتراضياً لعرض حساب متكامل فور فتح الموقع
  loadBookPresetToMain("ex_subbase_1", false);
}

function populateTablesDropdown() {
  const cat = document.getElementById("roadCategorySelect").value;
  const tableSelect = document.getElementById("tableSelect");

  let availableTables = [];
  if (cat === "main") {
    availableTables = MPWH_DATA.tables.filter((t) => t.roadCategory === "main");
  } else {
    // في الطرق الزراعية: نعرض جداول الملحق (2) (13-16) + الجداول غير المذكورة من الملحق (1) عملاً بالبند (3.1) صفحة 24!
    const agriTables = MPWH_DATA.tables.filter((t) => t.roadCategory === "agricultural");
    const sharedMainTables = MPWH_DATA.tables.filter((t) => [5, 6, 7, 11, 12].includes(t.tableNum));
    availableTables = [...agriTables, ...sharedMainTables];
  }

  tableSelect.innerHTML = availableTables
    .map((t) => {
      const prefix = cat === "agricultural" && t.roadCategory === "main" ? "[بند 3.1 من ملحق 1] " : "";
      return `<option value="${t.variantKey || t.tableNum}">${prefix}${t.title}</option>`;
    })
    .join("");
}

function populateTestItemsDropdown() {
  const tableKey = document.getElementById("tableSelect").value;
  const tableObj = MPWH_DATA.tables.find((t) => (t.variantKey || String(t.tableNum)) === tableKey);
  const testItemSelect = document.getElementById("testItemSelect");
  if (!tableObj) return;

  testItemSelect.innerHTML = tableObj.items
    .map((item) => `<option value="${item.id}">${item.num}. ${item.name} (${item.unit})</option>`)
    .join("");

  // تحديث وحدة الكيل الافتراضية
  document.getElementById("unitLabelSpan").textContent = tableObj.defaultUnit;
  document.getElementById("priceUnitSpan").textContent = tableObj.defaultUnit;

  onTestItemChanged();
}

function getSelectedTableAndItem() {
  const tableKey = document.getElementById("tableSelect").value;
  const itemId = document.getElementById("testItemSelect").value;
  const tableObj = MPWH_DATA.tables.find((t) => (t.variantKey || String(t.tableNum)) === tableKey);
  const itemObj = tableObj ? tableObj.items.find((i) => i.id === itemId) : null;
  return { tableObj, itemObj };
}

function onTestItemChanged() {
  const { tableObj, itemObj } = getSelectedTableAndItem();
  if (!tableObj || !itemObj) return;

  // إظهار أو إخفاء قائمة اتجاه الشذوذ (نقص/زيادة) عندما يكون الحد المسموح غير متماثل
  const dirGroups = document.querySelectorAll(".AsymmetricDirGroup");
  if (itemObj.direction === "asymmetric_both" || itemObj.direction === "asymmetric_exec") {
    dirGroups.forEach((g) => g.classList.remove("hidden"));
  } else {
    dirGroups.forEach((g) => g.classList.add("hidden"));
  }

  // إظهار خيار طرح التفاوت المسموح بدون حسم في مرحلة الاستلام إذا كان للبند تفاوت مسموح بدون حسم > 0
  const freeTolWrap = document.getElementById("freeTolAcceptCheckWrap");
  const freeTolLabel = document.getElementById("freeTolCheckboxLabel");
  if (itemObj.accept && itemObj.accept.freeTol && itemObj.accept.freeTol > 0) {
    freeTolWrap.classList.remove("hidden");
    freeTolLabel.textContent = `طرح التفاوت المسموح بدون حسم (${itemObj.accept.textFreeTol}) تلقائياً من الشذوذ المدخل`;
  } else {
    freeTolWrap.classList.add("hidden");
  }

  // إظهار خيار الملاحظة (1) للجداول (5، 6، 7، 8، 9، 13، 14)
  const qcOptionDiv = document.getElementById("qcAfterCompactionOption");
  if ([5, 6, 7, 8, 9, 13, 14].includes(tableObj.tableNum)) {
    qcOptionDiv.classList.remove("hidden");
  } else {
    qcOptionDiv.classList.add("hidden");
    document.getElementById("qcAppliesAcceptRulesCheckbox").checked = false;
  }

  renderSelectedTestSpecSummary(tableObj, itemObj);
}

function renderSelectedTestSpecSummary(tableObj, itemObj) {
  const container = document.getElementById("selectedTestSpecSummary");
  container.innerHTML = `
    <div class="spec-summary-title">
      <span>📌 ضوابط الفحص من ${tableObj.title} (صفحة ${tableObj.page}) — البند (${itemObj.num}): ${itemObj.name}</span>
      <span class="unit-badge">وحدة الفحص: ${itemObj.unit}</span>
    </div>
    <div class="spec-summary-grid">
      <div class="spec-mini-card">
        <strong>أولاً: فحوصات التنفيذ وضبط الجودة</strong>
        <div>التجاوز المسموح مع حسم (ح): <strong>${itemObj.exec.textMaxDev}</strong></div>
        <div>نسبة الحسم (ن): <strong>${itemObj.exec.textRate}</strong></div>
      </div>
      <div class="spec-mini-card">
        <strong>ثانياً: فحوصات لجنة الاستلام</strong>
        <div>التفاوت المسموح بدون حسم: <strong>${itemObj.accept.textFreeTol || "---"}</strong></div>
        <div>التجاوز المسموح مع حسم (ح): <strong>${itemObj.accept.textMaxDev}</strong></div>
        <div>نسبة الحسم (ن): <strong>${itemObj.accept.textRate}</strong></div>
      </div>
    </div>
    ${itemObj.notes ? `<div style="margin-top:8px;font-size:0.82rem;color:#7c2d12;font-weight:700;">💡 ملاحظة الجدول: ${itemObj.notes}</div>` : ""}
  `;
}

/* ==================== التحكم اليدوي بأوزان المراحل (قوائم منسدلة) ==================== */
const WEIGHT_SELECT_IDS = ["weightSelectExec", "weightSelectQC", "weightSelectAccept"];

function initWeightSelectors() {
  let options = '<option value="auto">تلقائي (حسب الجدول 3)</option>';
  for (let pct = 0; pct <= 100; pct += 5) options += `<option value="${pct}">${pct}%</option>`;
  WEIGHT_SELECT_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = options;
  });
}

function resetWeightOverrides() {
  WEIGHT_SELECT_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "auto";
  });
}

function getStageWeights() {
  const caseId = parseInt(document.getElementById("weightCaseSelect").value, 10);
  const weightCase = MPWH_DATA.table3_stageWeights.find((c) => c.caseId === caseId) || MPWH_DATA.table3_stageWeights[0];
  const read = (id, fallback) => {
    const el = document.getElementById(id);
    if (!el || el.value === "auto" || el.value === "") return fallback;
    const n = parseFloat(el.value);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) / 100 : fallback;
  };
  return {
    weightCase,
    w1: read("weightSelectExec", weightCase.w1),
    w2: read("weightSelectQC", weightCase.w2),
    w3: read("weightSelectAccept", weightCase.w3)
  };
}

function onWeightOverrideChange() {
  updateStageCardsWeightsUI();
  calculateMainDeduction();
}

function updateStageCardsWeightsUI() {
  const { weightCase, w1, w2, w3 } = getStageWeights();
  if (!weightCase) return;

  const pairs = [
    ["weightBadgeExec", "weightSelectExec", 1, w1, "stageCardExec"],
    ["weightBadgeQC", "weightSelectQC", 2, w2, "stageCardQC"],
    ["weightBadgeAccept", "weightSelectAccept", 3, w3, "stageCardAccept"]
  ];

  pairs.forEach(([badgeId, selectId, n, weight, cardId]) => {
    const badge = document.getElementById(badgeId);
    if (badge) badge.textContent = `و${n} = ${Math.round(weight * 100)}%`;
    const select = document.getElementById(selectId);
    if (select && select.options.length) {
      select.options[0].textContent = `تلقائي (${Math.round(weightCase[`w${n}`] * 100)}%)`;
    }
    const card = document.getElementById(cardId);
    if (card) card.classList.toggle("disabled-stage", weight === 0);
  });

  const warn = document.getElementById("weightsWarning");
  if (warn) {
    const sum = Number(((w1 + w2 + w3) * 100).toFixed(2));
    if (Math.abs(sum - 100) > 0.001) {
      warn.textContent = `⚠️ مجموع الأوزان الآن ${sum}% بدل 100% — عدّل القيم أو اختر «تلقائي» للعودة إلى أوزان الجدول رقم (3).`;
      warn.classList.remove("hidden");
    } else {
      warn.classList.add("hidden");
    }
  }
}

function onInputModeChange() {
  const mode = document.querySelector('input[name="deviationInputMode"]:checked').value;
  const specLimitsContainer = document.getElementById("specLimitsContainer");
  const directWraps = document.querySelectorAll(".direct-input-wrap");
  const labWraps = document.querySelectorAll(".lab-input-wrap");

  if (mode === "lab_values") {
    specLimitsContainer.classList.remove("hidden");
    directWraps.forEach((el) => el.classList.add("hidden"));
    labWraps.forEach((el) => el.classList.remove("hidden"));
  } else {
    specLimitsContainer.classList.add("hidden");
    directWraps.forEach((el) => el.classList.remove("hidden"));
    labWraps.forEach((el) => el.classList.add("hidden"));
  }
  calculateMainDeduction();
}

// دالة تقييم مرحلة واحدة (تنفيذ أو ضبط جودة أو استلام) وفق المعادلة (2): ق = [ك × س × ن × (ش / ح)] × و
function evaluateSingleStage(stageKey, itemObj, ruleSet, isAcceptanceRule, weight, repQty, unitPrice) {
  const mode = document.querySelector('input[name="deviationInputMode"]:checked').value;
  const dirSelect = document.getElementById(
    stageKey === "exec" ? "dirSelectExec" : stageKey === "qc" ? "dirSelectQC" : "dirSelectAccept"
  );
  const selectedDir = dirSelect ? dirSelect.value : itemObj.direction || "minus";

  // إذا كان وزن المرحلة = 0 (لم يتم إجراء فحوصات في هذه المرحلة حسب الجدول 3)
  if (weight === 0) {
    return {
      active: false,
      status: "inactive",
      statusText: "لم يتم إجراء فحوصات (الوزن النسبي = 0%)",
      deduction: 0,
      rawDev: 0,
      effectiveDev: 0,
      maxAllowedDev: 0,
      deductRatePct: 0,
      weight,
      formulaStr: "0 (لم يتم إجراء فحوصات في هذه المرحلة)"
    };
  }

  // حالات خاصة (سماكة الإسفلت أو سماكة الفرشيات أو قرار اللجنة)
  if (ruleSet.mode === "special_asphalt_thickness") {
    return {
      active: true,
      status: "special",
      statusText: "يحسب في تبويب «سماكة الخلطة الإسفلتية (جدول 4)»",
      deduction: 0,
      rawDev: 0,
      effectiveDev: 0,
      maxAllowedDev: 0,
      deductRatePct: 0,
      weight,
      formulaStr: "انتقل إلى تبويب سماكة الخلطة الإسفلتية (الجدول رقم 4 - البند 2.2.2)"
    };
  }
  if (ruleSet.mode === "special_subbase_thickness") {
    return {
      active: true,
      status: "special",
      statusText: "يحسب في تبويب «سماكة الفرشيات (البند 2.1)»",
      deduction: 0,
      rawDev: 0,
      effectiveDev: 0,
      maxAllowedDev: 0,
      deductRatePct: 0,
      weight,
      formulaStr: "انتقل إلى تبويب سماكة الفرشيات (البند 2.1 صفحة 18)"
    };
  }
  if (ruleSet.mode === "committee_decision" || ruleSet.mode === "spec_compliance") {
    return {
      active: true,
      status: "special",
      statusText: ruleSet.textMaxDev,
      deduction: 0,
      rawDev: 0,
      effectiveDev: 0,
      maxAllowedDev: 0,
      deductRatePct: 0,
      weight,
      formulaStr: ruleSet.textMaxDev
    };
  }
  if (ruleSet.mode === "not_applicable" || ruleSet.mode === "not_required") {
    return {
      active: true,
      status: "accepted",
      statusText: ruleSet.textMaxDev || "غير مطلوب في هذه المرحلة",
      deduction: 0,
      rawDev: 0,
      effectiveDev: 0,
      maxAllowedDev: 0,
      deductRatePct: 0,
      weight,
      formulaStr: "0 (غير مطلوب في هذه المرحلة)"
    };
  }

  // استخراج الشذوذ الخام (rawDev) واتجاهه
  let rawDev = 0;
  let actualDirection = selectedDir;

  if (mode === "direct") {
    const inputId = stageKey === "exec" ? "devInputExec" : stageKey === "qc" ? "devInputQC" : "devInputAccept";
    rawDev = Math.max(0, parseFloat(document.getElementById(inputId).value) || 0);
  } else {
    const specMin = parseFloat(document.getElementById("specMinInput").value) || 0;
    const specMax = parseFloat(document.getElementById("specMaxInput").value) || specMin;
    const labId = stageKey === "exec" ? "labValExec" : stageKey === "qc" ? "labValQC" : "labValAccept";
    const labVal = parseFloat(document.getElementById(labId).value) || 0;

    if (itemObj.direction === "minus") {
      rawDev = labVal < specMin ? specMin - labVal : 0;
      actualDirection = "minus";
    } else if (itemObj.direction === "plus") {
      rawDev = labVal > specMin ? labVal - specMin : 0;
      actualDirection = "plus";
    } else {
      // مجال (بين حد أدنى specMin وحد أعلى specMax)
      if (labVal < specMin) {
        rawDev = specMin - labVal;
        actualDirection = "minus";
      } else if (labVal > specMax) {
        rawDev = labVal - specMax;
        actualDirection = "plus";
      } else {
        rawDev = 0;
      }
    }
    rawDev = Math.round(rawDev * 10000) / 10000;
  }

  if (rawDev === 0) {
    return {
      active: true,
      status: "accepted",
      statusText: "مطابق للمواصفة (مقبول بدون حسم)",
      deduction: 0,
      rawDev: 0,
      effectiveDev: 0,
      maxAllowedDev: 0,
      deductRatePct: ruleSet.deductRate || 0,
      weight,
      formulaStr: "الشذوذ = 0 ← ق = 0.000 دينار"
    };
  }

  // إذا كان الفحص "غير مسموح / يجب أن يحقق المواصفة" ويوجد شذوذ > 0
  if (ruleSet.mode === "reject_if_fail") {
    return {
      active: true,
      status: "rejected",
      statusText: `مرفوض (${ruleSet.textMaxDev})`,
      deduction: 0,
      rawDev,
      effectiveDev: rawDev,
      maxAllowedDev: 0,
      deductRatePct: 0,
      weight,
      formulaStr: `يوجد شذوذ (${rawDev}) بينما البند (${ruleSet.textMaxDev}) ← ترفض الأعمال / يعاد تدقيقها ومعالجتها`
    };
  }

  // معالجة التفاوت المسموح بدون حسم (في مرحلة الاستلام أو عند تفعيل الملاحظة 1 لضبط الجودة)
  const freeTol = ruleSet.freeTol || 0;
  let effectiveDev = rawDev;
  const shouldDeductFreeTol =
    mode === "lab_values" ||
    (isAcceptanceRule && document.getElementById("autoDeductFreeTolCheckbox").checked);

  if (freeTol > 0 && shouldDeductFreeTol) {
    effectiveDev = Math.max(0, Math.round((rawDev - freeTol) * 10000) / 10000);
  }

  // إذا كان الشذوذ ضمن التفاوت المسموح بدون حسم
  if (effectiveDev === 0) {
    return {
      active: true,
      status: "accepted",
      statusText: `مقبول بدون حسم (الشذوذ ${rawDev} ضمن التفاوت المسموح بدون حسم ${ruleSet.textFreeTol})`,
      deduction: 0,
      rawDev,
      effectiveDev: 0,
      maxAllowedDev: ruleSet.maxDev || 0,
      deductRatePct: ruleSet.deductRate || 0,
      weight,
      formulaStr: `الشذوذ (${rawDev}) ≤ التفاوت المسموح بدون حسم (${freeTol}) ← ق = 0.000 دينار`
    };
  }

  if (ruleSet.mode === "free_only") {
    // مثل CBR للطمم الإنشائي في الاستلام حيث التفاوت بدون حسم -1 وما زاد يتطلب إعادة فحص
    return {
      active: true,
      status: "rejected",
      statusText: `تجاوز التفاوت المسموح بدون حسم (${ruleSet.textFreeTol}) — يتطلب إعادة الفحص في مختبرين (*)`,
      deduction: 0,
      rawDev,
      effectiveDev,
      maxAllowedDev: 0,
      deductRatePct: 0,
      weight,
      formulaStr: `الشذوذ (${rawDev}) تجاوز (${freeTol}) ← إعادة الفحص في مختبرين بواقع عينتين في كل مختبر`
    };
  }

  // تحديد الحد الأقصى المسموح للشذوذ مع حسم (ح)
  let maxAllowedDev = ruleSet.maxDev;
  if (ruleSet.mode === "asymmetric") {
    maxAllowedDev = actualDirection === "plus" ? ruleSet.maxDevPlus : ruleSet.maxDevMinus;
  }

  // فحص هل تجاوز الشذوذ الفعلي الحد الأقصى المسموح مع حسم (ش > ح)
  if (effectiveDev > maxAllowedDev + 1e-9) {
    return {
      active: true,
      status: "rejected",
      statusText: `مرفوض — الشذوذ الصافي (${effectiveDev}) تجاوز الحد الأقصى المسموح مع حسم (${maxAllowedDev})`,
      deduction: 0,
      rawDev,
      effectiveDev,
      maxAllowedDev,
      deductRatePct: ruleSet.deductRate || 0,
      weight,
      formulaStr: `ش (${effectiveDev}) > ح (${maxAllowedDev}) ← خارج حدود القبول مع حسم (مرفوض / يتطلب المعالجة أو إعادة الفحص حسب الملاحظات)`
    };
  }

  // توزيع الحسم على درجات الشذوذ الفعلي (كل درجة = وحدة شذوذ واحدة)
  // مثال: ش = 1.94 => الدرجة الأولى 1.00×5% + الدرجة الثانية 0.94×15% = 19.1% (لا شيء للثالثة)
  if (ruleSet.mode === "tiered_degrees" && Array.isArray(ruleSet.tiers) && ruleSet.tiers.length) {
    let lower = 0;
    let totalRatePct = 0;
    const parts = [];
    for (const tier of ruleSet.tiers) {
      const upper = Number(tier.upTo);
      if (!Number.isFinite(upper) || upper <= lower) continue;
      const portion = Math.max(0, Math.min(effectiveDev, upper) - lower);
      if (portion > 1e-9) {
        const rate = Number(tier.rate) || 0;
        totalRatePct += portion * rate;
        parts.push(`${portion.toFixed(2)}×${rate}%`);
      }
      lower = upper;
      if (effectiveDev <= upper + 1e-9) break;
    }
    const effectiveRatePct = Number(totalRatePct.toFixed(3));
    const deduction = repQty * unitPrice * (effectiveRatePct / 100) * weight;
    return {
      active: true,
      status: "deduct",
      statusText: `مقبول مع حسم (${deduction.toFixed(3)} د.أ)`,
      deduction,
      rawDev,
      effectiveDev,
      maxAllowedDev,
      deductRatePct: effectiveRatePct,
      weight,
      formulaStr: `[ ${repQty} × ${unitPrice} × (توزيع الدرجات: ${parts.join(" + ") || "0"} = ${effectiveRatePct}%) ] × (${Math.round(weight * 100)}/100) = ${deduction.toFixed(3)} د.أ`
    };
  }

  const deductRatePct = ruleSet.deductRate;

  // تطبيق المعادلة رقم (2): ق = [ ك × س × ن × ( ش / ح ) ] × و
  const deduction = repQty * unitPrice * (deductRatePct / 100) * (effectiveDev / maxAllowedDev) * weight;
  const formulaStr = `[ ${repQty} × ${unitPrice} × (${deductRatePct}/100) × (${effectiveDev}/${maxAllowedDev}) ] × (${Math.round(weight * 100)}/100) = ${deduction.toFixed(3)} د.أ`;

  return {
    active: true,
    status: "deduct",
    statusText: `مقبول مع حسم (${deduction.toFixed(3)} د.أ)`,
    deduction,
    rawDev,
    effectiveDev,
    maxAllowedDev,
    deductRatePct,
    weight,
    formulaStr
  };
}

function calculateMainDeduction() {
  const { tableObj, itemObj } = getSelectedTableAndItem();
  if (!tableObj || !itemObj) return;

  const { w1, w2, w3 } = getStageWeights();
  const repQty = Math.max(0, parseFloat(document.getElementById("repQuantityInput").value) || 0);
  const unitPrice = Math.max(0, parseFloat(document.getElementById("unitPriceInput").value) || 0);
  const qcUsesAcceptRules = document.getElementById("qcAppliesAcceptRulesCheckbox").checked;

  // تقييم المراحل الثلاث
  const resExec = evaluateSingleStage("exec", itemObj, itemObj.exec, false, w1, repQty, unitPrice);
  const resQC = evaluateSingleStage(
    "qc",
    itemObj,
    qcUsesAcceptRules ? itemObj.accept : itemObj.exec,
    qcUsesAcceptRules,
    w2,
    repQty,
    unitPrice
  );
  const resAccept = evaluateSingleStage("accept", itemObj, itemObj.accept, true, w3, repQty, unitPrice);

  // تحديث الملخص الصغير داخل كل بطاقة مرحلة
  renderStageMiniStatus("stageResultExec", resExec, "ق1");
  renderStageMiniStatus("stageResultQC", resQC, "ق2");
  renderStageMiniStatus("stageResultAccept", resAccept, "ق3");

  // المعادلة رقم (1): ق.ك = ق1 + ق2 + ق3
  const q1 = resExec.deduction;
  const q2 = resQC.deduction;
  const q3 = resAccept.deduction;
  const totalDeduction = q1 + q2 + q3;
  const totalWorkValue = repQty * unitPrice;
  const deductionPercentageOfWork = totalWorkValue > 0 ? (totalDeduction / totalWorkValue) * 100 : 0;

  // تحديد القرار النهائي (مقبول بدون حسم / مقبول مع حسم / مرفوض)
  const anyRejected = [resExec, resQC, resAccept].some((r) => r.status === "rejected");
  const anySpecial = [resExec, resQC, resAccept].some((r) => r.status === "special");

  let finalDecision = "مقبول بدون حسم";
  let statusClass = "status-accepted";
  if (anyRejected) {
    finalDecision = "مرفوض (تجاوز الحدود المسموحة في الأسس)";
    statusClass = "status-rejected";
  } else if (totalDeduction > 0) {
    finalDecision = "مقبول مع حسم مالي";
    statusClass = "status-deduct";
  } else if (anySpecial) {
    finalDecision = "يتبع القواعد الخاصة الموضحة أدناه";
    statusClass = "status-deduct";
  }

  currentCalculationResult = {
    location: document.getElementById("sampleLocationInput").value.trim() || "منطقة ممثلة",
    tableNum: tableObj.tableNum,
    tableKey: tableObj.variantKey || String(tableObj.tableNum),
    tableLabel: tableObj.variantLabel || "",
    tableTitle: tableObj.title,
    itemName: itemObj.name,
    unit: tableObj.defaultUnit,
    repQty,
    unitPrice,
    totalWorkValue,
    q1,
    q2,
    q3,
    totalDeduction,
    finalDecision,
    anyRejected
  };
  updateDuplicateWarningBanner();

  const out = document.getElementById("mainCalcDetailedOutput");
  out.innerHTML = `
    <div class="status-banner ${statusClass}">
      <span>القرار الهندسي: ${finalDecision}</span>
      <span>نسبة الحسم الفعالة: ${deductionPercentageOfWork.toFixed(3)}%</span>
    </div>

    <div class="grand-deduction-box">
      <div>
        <div style="font-size:0.85rem;color:#d9e8d4;">قيمة الحسم الكلية للمنطقة الممثلة (ق.ك = ق1 + ق2 + ق3):</div>
        <div style="font-size:0.82rem;color:#cbd5e1;margin-top:2px;">قيمة الأعمال الكلية (ك × س) = ${totalWorkValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} دينار</div>
      </div>
      <div class="amount">${totalDeduction.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} د.أ</div>
    </div>

    <div class="step-box">
      <div class="step-box-header">
        <span>1️⃣ حسم فحوصات التنفيذ (ق<sub>1</sub>)</span>
        <span>الوزن النسبي (و<sub>1</sub>) = ${Math.round(w1 * 100)}%</span>
      </div>
      <div style="margin-bottom:4px;font-size:0.84rem;">الحالة: <strong>${resExec.statusText}</strong></div>
      <div class="math-trace">Q1 = ${resExec.formulaStr}</div>
    </div>

    <div class="step-box">
      <div class="step-box-header">
        <span>2️⃣ حسم فحوصات ضبط الجودة (ق<sub>2</sub>) ${qcUsesAcceptRules ? '<span class="unit-badge">بتطبيق ملاحظة 1 (تفاوتات الاستلام)</span>' : ""}</span>
        <span>الوزن النسبي (و<sub>2</sub>) = ${Math.round(w2 * 100)}%</span>
      </div>
      <div style="margin-bottom:4px;font-size:0.84rem;">الحالة: <strong>${resQC.statusText}</strong></div>
      <div class="math-trace">Q2 = ${resQC.formulaStr}</div>
    </div>

    <div class="step-box">
      <div class="step-box-header">
        <span>3️⃣ حسم فحوصات لجنة الاستلام (ق<sub>3</sub>)</span>
        <span>الوزن النسبي (و<sub>3</sub>) = ${Math.round(w3 * 100)}%</span>
      </div>
      <div style="margin-bottom:4px;font-size:0.84rem;">الحالة: <strong>${resAccept.statusText}</strong></div>
      <div class="math-trace">Q3 = ${resAccept.formulaStr}</div>
    </div>

    <div class="step-box" style="background:#f9f6ee;border-color:#d5c7a3;">
      <div class="step-box-header">
        <span>∑ تطبيق المعادلة رقم (1): ق.ك = ق<sub>1</sub> + ق<sub>2</sub> + ق<sub>3</sub></span>
        <span>صفحة (16)</span>
      </div>
      <div class="math-trace">Total Deduction = ${q1.toFixed(3)} + ${q2.toFixed(3)} + ${q3.toFixed(3)} = ${totalDeduction.toFixed(3)} JOD</div>
    </div>
  `;
}

function renderStageMiniStatus(containerId, res, qLabel) {
  const el = document.getElementById(containerId);
  if (!el) return;
  let color = "#475569";
  if (res.status === "accepted") color = "#15803d";
  if (res.status === "deduct") color = "#b45309";
  if (res.status === "rejected") color = "#b91c1c";

  el.innerHTML = `
    <div style="color:${color};font-weight:700;">${res.statusText}</div>
    ${
      res.active
        ? `<div style="font-size:0.78rem;color:#334155;margin-top:2px;">
            ش الصافي: <strong>${res.effectiveDev}</strong> | ح: <strong>${res.maxAllowedDev || "--"}</strong> | ن: <strong>${res.deductRatePct}%</strong> | <strong>${qLabel} = ${res.deduction.toFixed(3)} د.أ</strong>
          </div>`
        : ""
    }
  `;
}

// تحميل سريع لأمثلة الكتاب في الحاسبة الرئيسية
function loadBookPresetToMain(exampleId, shouldSwitchTab = true) {
  const ex = MPWH_DATA.examples.find((e) => e.id === exampleId);
  if (!ex || !ex.presetMainCalc) return;
  const p = ex.presetMainCalc;

  // التبديل لوضع الإدخال المباشر للشذوذ
  document.querySelector('input[name="deviationInputMode"][value="direct"]').checked = true;
  onInputModeChange();

  document.getElementById("roadCategorySelect").value = p.roadCategory;
  populateTablesDropdown();

  const presetTable =
    MPWH_DATA.tables.find((t) => t.tableNum === p.tableNum && (!t.variantLabel || t.variantLabel === "قديم")) ||
    MPWH_DATA.tables.find((t) => t.tableNum === p.tableNum);
  document.getElementById("tableSelect").value = presetTable
    ? (presetTable.variantKey || String(presetTable.tableNum))
    : String(p.tableNum);
  populateTestItemsDropdown();

  document.getElementById("testItemSelect").value = p.itemId;
  onTestItemChanged();

  document.getElementById("weightCaseSelect").value = String(p.weightCase);
  resetWeightOverrides();
  updateStageCardsWeightsUI();

  document.getElementById("sampleLocationInput").value = ex.title;
  document.getElementById("repQuantityInput").value = ex.defaultA;
  document.getElementById("unitPriceInput").value = ex.defaultB;

  if (p.dirExec) document.getElementById("dirSelectExec").value = p.dirExec;
  if (p.dirQC) document.getElementById("dirSelectQC").value = p.dirQC;
  if (p.deviationType) {
    document.getElementById("dirSelectExec").value = p.deviationType;
    document.getElementById("dirSelectQC").value = p.deviationType;
    document.getElementById("dirSelectAccept").value = p.deviationType;
  }

  document.getElementById("devInputExec").value = p.devExec || 0;
  document.getElementById("devInputQC").value = p.devQC || 0;
  document.getElementById("devInputAccept").value = p.devAccept || 0;

  calculateMainDeduction();
  if (shouldSwitchTab) switchToTab("tab-main-calc");
}

function resetMainCalculator() {
  document.getElementById("sampleLocationInput").value = "";
  document.getElementById("devInputExec").value = 0;
  document.getElementById("devInputQC").value = 0;
  document.getElementById("devInputAccept").value = 0;
  calculateMainDeduction();
}

/* ==================== إدارة المشاريع والتقارير — مديرية أشغال محافظة مأدبا ==================== */
function escHTML(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const CLOUD_API_BASE = "https://madaba-lab-api.ahmadalzan92.workers.dev";
const CLOUD_PENDING_KEY = "madaba_pw_cloud_pending_v1";
const CLOUD_ENABLED_KEY = "madaba_pw_cloud_enabled_v1";
let cloudSyncInFlight = false;

function isCloudAutoSyncHost() {
  if (typeof location === "undefined") return false;
  if (localStorage.getItem(CLOUD_ENABLED_KEY) === "1") return true;
  const host = (location.hostname || "").toLowerCase();
  const proto = location.protocol || "";
  if (proto === "file:") return true;
  if (!host || host === "127.0.0.1" || host === "localhost") return false;
  return true;
}

function setCloudBadgeState(state, text) {
  const badge = document.getElementById("cloudSyncBadge");
  const label = document.getElementById("cloudSyncText");
  if (!badge || !label) return;
  badge.classList.remove("online", "offline", "syncing");
  if (state) badge.classList.add(state);
  label.textContent = text;
}

function loadProjectsState() {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.projects)) {
        projectsState = {
          nextProjectSerial: parsed.nextProjectSerial || parsed.projects.length + 1 || 1,
          activeProjectId: parsed.activeProjectId || null,
          updatedAt: parsed.updatedAt || 0,
          projects: parsed.projects
        };
      }
    }
  } catch (e) {
    console.warn("تعذر تحميل بيانات المشاريع من التخزين المحلي", e);
  }
}

function saveProjectsState(skipCloudPush = false) {
  try {
    projectsState.updatedAt = Date.now();
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projectsState));
    if (!skipCloudPush) {
      localStorage.setItem(CLOUD_PENDING_KEY, "1");
      if (isCloudAutoSyncHost()) {
        pushProjectsToCloud();
      }
    }
  } catch (e) {
    console.warn("تعذر حفظ بيانات المشاريع في التخزين المحلي", e);
  }
}

async function pushProjectsToCloud() {
  if (typeof fetch !== "function") return false;
  try {
    setCloudBadgeState("syncing", "🔄 جاري الحفظ سحابياً...");
    const res = await fetch(`${CLOUD_API_BASE}/api/key/${encodeURIComponent(PROJECTS_STORAGE_KEY)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(projectsState) })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    localStorage.removeItem(CLOUD_PENDING_KEY);
    setCloudBadgeState("online", "☁️ متصل بالسحابة");
    return true;
  } catch (e) {
    setCloudBadgeState("offline", "⚠️ محفوظ محلياً");
    return false;
  }
}

async function syncProjectsWithCloud(manual = false) {
  if (cloudSyncInFlight || typeof fetch !== "function") return false;
  if (manual) {
    try { localStorage.setItem(CLOUD_ENABLED_KEY, "1"); } catch (e) {}
  } else if (!isCloudAutoSyncHost()) {
    setCloudBadgeState("", "☁️ السحابة: جاهز");
    return false;
  }

  cloudSyncInFlight = true;
  setCloudBadgeState("syncing", "🔄 جاري المزامنة...");
  try {
    const hasPending = localStorage.getItem(CLOUD_PENDING_KEY) === "1";
    const localCount = Array.isArray(projectsState.projects) ? projectsState.projects.length : 0;
    if (hasPending && localCount > 0) {
      await pushProjectsToCloud();
      cloudSyncInFlight = false;
      return true;
    }

    const res = await fetch(`${CLOUD_API_BASE}/api/key/${encodeURIComponent(PROJECTS_STORAGE_KEY)}`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();

    if (data && data.value) {
      const remoteState = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
      if (remoteState && Array.isArray(remoteState.projects)) {
        const localTs = Number(projectsState.updatedAt) || 0;
        const remoteTs = Number(remoteState.updatedAt) || Number(data.ts) || 0;
        if (localCount === 0 || remoteTs > localTs) {
          projectsState = {
            nextProjectSerial: remoteState.nextProjectSerial || remoteState.projects.length + 1 || 1,
            activeProjectId: remoteState.activeProjectId || null,
            updatedAt: remoteTs || Date.now(),
            projects: remoteState.projects
          };
          localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projectsState));
          localStorage.removeItem(CLOUD_PENDING_KEY);
          renderProjectsList();
          refreshActiveProjectUI();
          if (typeof renderReportsDashboard === "function") renderReportsDashboard();
          const active = getActiveProject();
          if (active) renderProjectWorkspace(active);
        } else if (localCount > 0 && localTs > remoteTs) {
          await pushProjectsToCloud();
        }
      }
    } else if (localCount > 0) {
      await pushProjectsToCloud();
    }
    setCloudBadgeState("online", "☁️ متصل بالسحابة");
    cloudSyncInFlight = false;
    return true;
  } catch (e) {
    setCloudBadgeState("offline", "⚠️ وضع محلي");
    cloudSyncInFlight = false;
    return false;
  }
}

function getProjectById(id) {
  return projectsState.projects.find((p) => p.id === id) || null;
}

function getActiveProject() {
  return getProjectById(projectsState.activeProjectId);
}

// الصيغة المعتمدة في التقارير: يوم / شهر / سنة — مثال: 1/9/2026
function todayDateStr() {
  const d = new Date();
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// توحيد عرض أي تاريخ مخزّن (بما فيه الصيغة القديمة YYYY-MM-DD) إلى يوم/شهر/سنة
function formatDate(value) {
  const s = String(value == null ? "" : value).trim();
  if (!s) return "---";
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return `${Number(iso[3])}/${Number(iso[2])}/${iso[1]}`;
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return `${Number(slash[1])}/${Number(slash[2])}/${slash[3]}`;
  return s;
}

function validEditedDate(input, fallback) {
  const raw = input.value.trim();
  if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
    alert("يرجى إدخال التاريخ بصيغة يوم/شهر/سنة — مثال: 1/9/2026");
    input.value = formatDate(fallback);
    return null;
  }
  return formatDate(raw);
}

/* ==================== حماية ترتيب التاريخ داخل النص العربي (RTL) ==================== */
// علامات اتجاه غير مرئية تُبقي التاريخ بترتيب يوم/شهر/سنة كما كُتب من لوحة المفاتيح
const BIDI_LRM = "\u200E";
const BIDI_RLM = "\u200F";
const DATE_IN_TEXT_RE = /\d{1,2}\/\d{1,2}\/\d{4}/g;
const DATE_IN_TEXT_TEST_RE = /\d{1,2}\/\d{1,2}\/\d{4}/;
const isBidiDateMark = (ch) => ch === BIDI_LRM || ch === BIDI_RLM;

function ltrDate(value) {
  const s = formatDate(value);
  return s === "---" ? s : BIDI_LRM + s + BIDI_RLM;
}

function protectDatesInText(value) {
  const clean = String(value == null ? "" : value)
    .split(BIDI_LRM).join("")
    .split(BIDI_RLM).join("");
  return clean.replace(DATE_IN_TEXT_RE, (m) => BIDI_LRM + m + BIDI_RLM);
}

// يُطبّق على حقول النصوص العربية الحرة، مع الحفاظ على موضع المؤشر أثناء الكتابة
function normalizeDateBidiInput(el) {
  if (!el || el.tagName !== "INPUT" || el.type !== "text") return;
  if (el.getAttribute("dir") === "ltr") return;
  if (el.classList.contains("rp-date-input") || el.classList.contains("cell-num")) return;
  const raw = el.value;
  if (!DATE_IN_TEXT_TEST_RE.test(raw) && !raw.includes(BIDI_LRM) && !raw.includes(BIDI_RLM)) return;

  let cleanPos = 0;
  const pos = typeof el.selectionStart === "number" ? el.selectionStart : raw.length;
  for (let i = 0; i < pos && i < raw.length; i++) if (!isBidiDateMark(raw[i])) cleanPos++;

  const normalized = protectDatesInText(raw);
  if (normalized === raw) return;
  el.value = normalized;

  let newPos = normalized.length;
  let seen = 0;
  for (let i = 0; i < normalized.length; i++) {
    if (isBidiDateMark(normalized[i])) continue;
    if (seen === cleanPos) { newPos = i; break; }
    seen++;
  }
  try { el.setSelectionRange(newPos, newPos); } catch (e) { /* حقول غير نصية */ }
}

function initDateBidiProtection() {
  document.addEventListener("input", (e) => normalizeDateBidiInput(e.target));
  document.addEventListener("change", (e) => normalizeDateBidiInput(e.target));
}

function formatProjectNo(serial, year) {
  return `مأدبا/${year}/${String(serial).padStart(3, "0")}`;
}

function formatMoney(value) {
  return (Number(value) || 0).toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function computeTotals(items) {
  const totals = { work: 0, q1: 0, q2: 0, q3: 0, deduction: 0, rejectedCount: 0 };
  (items || []).forEach((i) => {
    totals.work += Number(i.totalWorkValue) || 0;
    totals.q1 += Number(i.q1) || 0;
    totals.q2 += Number(i.q2) || 0;
    totals.q3 += Number(i.q3) || 0;
    totals.deduction += Number(i.totalDeduction) || 0;
    if (i.anyRejected) totals.rejectedCount += 1;
  });
  return totals;
}

/* ==================== منع التكرار والتنبيه ==================== */
function normCompare(value) {
  const n = Number(value);
  if (value !== "" && value !== null && value !== undefined && !Number.isNaN(n)) return n.toFixed(3);
  return String(value == null ? "" : value).trim();
}

function logItemSignature(item) {
  return [
    "location", "tableNum", "tableKey", "itemName", "unit", "repQty", "unitPrice",
    "totalWorkValue", "q1", "q2", "q3", "totalDeduction", "finalDecision", "anyRejected"
  ].map((k) => normCompare(item ? item[k] : "")).join("|");
}

function findDuplicateLogItem(project, item, excludeId) {
  if (!project || !item) return null;
  const sig = logItemSignature(item);
  return (
    project.logItems.find(
      (existing) => existing.id !== excludeId && logItemSignature(existing) === sig
    ) || null
  );
}

function reportSignature(items, totals) {
  const list = (items || []).map(logItemSignature).join(";");
  const t = totals || computeTotals(items);
  return `T:${[t.work, t.q1, t.q2, t.q3, t.deduction, t.rejectedCount].map(normCompare).join("|")}::I:${list}`;
}

function findDuplicateReport(project, items, totals) {
  if (!project) return null;
  const sig = reportSignature(items, totals);
  return project.reports.find((r) => {
    const view = getReportView(project, r);
    return reportSignature(view.items, view.totals) === sig;
  }) || null;
}

function duplicateResultLabel(item) {
  if (!item) return "الحساب";
  return `${item.location || "موقع غير محدد"} — ${item.itemName || "فحص"} (${formatMoney(item.totalDeduction)} د.أ)`;
}

// نتائج الحاسبة الثلاث التي تطابق سجل المشروع الحالي (لعرض تنبيه قبل الإضافة)
function currentResultDuplicates(p) {
  if (!p) return [];
  const found = [];
  [
    ["الحاسبة الشاملة", currentCalculationResult],
    ["كورات التنفيذ (سماكة)", currentExecStageCoresResult],
    ["كورات ضبط الجودة (سماكة)", currentQcStageCoresResult],
    ["ركل الخلطة الإسفلتية", currentCompactionResult]
  ].forEach(([label, result]) => {
    if (result && findDuplicateLogItem(p, result)) found.push(`${label}: ${duplicateResultLabel(result)}`);
  });
  return found;
}

function initProjectsModule() {
  loadProjectsState();
  renderProjectsList();
  refreshActiveProjectUI();
  const active = getActiveProject();
  if (active) showProjectWorkspaceView(active, false);
  syncProjectsWithCloud(false);

  ["newProjectName", "newProjectNo", "newProjectContractor", "newProjectConsultant", "newProjectSampleType", "newProjectLocation", "newProjectLength"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("keydown", (e) => { if (e.key === "Enter") createNewProject(); });
  });

  ["editProjectName", "editProjectNo", "editProjectContractor", "editProjectConsultant", "editProjectSampleType", "editProjectLocation", "editProjectLength"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); saveProjectEdits(); } });
  });

  const directorySearch = document.getElementById("projectsDirectorySearch");
  if (directorySearch) directorySearch.addEventListener("input", renderProjectsDirectory);
}

// عرض صفحة المشروع المخصصة كشاشة مستقلة داخل تبويب المشاريع
function showProjectWorkspaceView(p, shouldScroll = true) {
  if (!p) return;
  renderProjectWorkspace(p);
  const list = document.getElementById("projectsLayout");
  if (list) list.classList.add("hidden");
  const ws = document.getElementById("projectWorkspace");
  if (ws) ws.classList.remove("hidden");
  switchToTab("tab-projects");
  if (shouldScroll) {
    if (ws && typeof ws.scrollIntoView === "function") ws.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo(0, 0);
  }
}

// العودة إلى قائمة المشاريع
function showProjectsListView(switchTab = true) {
  const list = document.getElementById("projectsLayout");
  if (list) list.classList.remove("hidden");
  const ws = document.getElementById("projectWorkspace");
  if (ws) ws.classList.add("hidden");
  if (switchTab) switchToTab("tab-projects");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearNewProjectForm() {
  ["newProjectName", "newProjectNo", "newProjectContractor", "newProjectConsultant", "newProjectSampleType", "newProjectLength"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("newProjectLocation").value = "محافظة مأدبا";
}

const NEW_PROJECT_MODAL_FIELD_MAP = {
  newProjectName: "newProjectModalName",
  newProjectNo: "newProjectModalNo",
  newProjectContractor: "newProjectModalContractor",
  newProjectConsultant: "newProjectModalConsultant",
  newProjectSampleType: "newProjectModalSampleType",
  newProjectLocation: "newProjectModalLocation",
  newProjectLength: "newProjectModalLength"
};

function openNewProjectModal() {
  const modal = document.getElementById("newProjectModal");
  if (!modal) return;
  Object.entries(NEW_PROJECT_MODAL_FIELD_MAP).forEach(([formId, modalId]) => {
    const formEl = document.getElementById(formId);
    const modalEl = document.getElementById(modalId);
    if (formEl && modalEl) modalEl.value = formEl.value;
  });
  const locationEl = document.getElementById("newProjectModalLocation");
  if (locationEl && !locationEl.value.trim()) locationEl.value = "محافظة مأدبا";
  modal.classList.remove("hidden");
  const nameEl = document.getElementById("newProjectModalName");
  if (nameEl) {
    nameEl.focus();
    nameEl.select();
  }
}

function closeNewProjectModal() {
  const modal = document.getElementById("newProjectModal");
  if (modal) modal.classList.add("hidden");
}

function submitNewProjectModal() {
  Object.entries(NEW_PROJECT_MODAL_FIELD_MAP).forEach(([formId, modalId]) => {
    const formEl = document.getElementById(formId);
    const modalEl = document.getElementById(modalId);
    if (formEl && modalEl) formEl.value = modalEl.value;
  });

  if (!createNewProject()) return;
  closeNewProjectModal();
  Object.values(NEW_PROJECT_MODAL_FIELD_MAP).forEach((modalId) => {
    const el = document.getElementById(modalId);
    if (el) el.value = "";
  });
  const locationEl = document.getElementById("newProjectModalLocation");
  if (locationEl) locationEl.value = "محافظة مأدبا";
}

function createNewProject() {
  const name = document.getElementById("newProjectName").value.trim();
  if (!name) {
    alert("يرجى إدخال اسم المشروع قبل إنشائه.");
    document.getElementById("newProjectName").focus();
    return false;
  }

  const manualNo = document.getElementById("newProjectNo").value.trim();
  const duplicateProject = projectsState.projects.find(
    (p) =>
      p.name.trim() === name ||
      (manualNo && p.projectNo.trim().toLowerCase() === manualNo.toLowerCase())
  );
  if (duplicateProject) {
    alert(`المشروع مكرر: يوجد مشروع مسجل بنفس الاسم أو الرقم «${duplicateProject.name}» (${duplicateProject.projectNo}). لم يتم إنشاء مشروع جديد.`);
    return false;
  }

  const serial = projectsState.nextProjectSerial++;
  const year = new Date().getFullYear();
  const project = {
    id: `prj_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    serialNumber: serial,
    projectNo: manualNo || formatProjectNo(serial, year),
    name,
    contractor: document.getElementById("newProjectContractor").value.trim(),
    consultant: document.getElementById("newProjectConsultant").value.trim(),
    sampleType: document.getElementById("newProjectSampleType").value.trim(),
    location: document.getElementById("newProjectLocation").value.trim(),
    lengthKm: document.getElementById("newProjectLength").value.trim(),
    createdDate: todayDateStr(),
    logItems: [],
    reports: [],
    nextReportSerial: 1
  };

  projectsState.projects.push(project);
  projectsState.activeProjectId = project.id;
  saveProjectsState();
  clearNewProjectForm();
  renderProjectsList();
  refreshActiveProjectUI();
  showProjectWorkspaceView(project);
  return true;
}

function openProject(id) {
  const p = getProjectById(id);
  if (!p) return;
  projectsState.activeProjectId = p.id;
  saveProjectsState();
  renderProjectsList();
  refreshActiveProjectUI();
  showProjectWorkspaceView(p);
}

function closeProjectWorkspace() {
  // إخفاء صفحة المشروع مع الإبقاء عليه نشطاً حتى تستمر الحاسبة بالإضافة إلى سجله
  showProjectsListView();
}

function deleteProject(id) {
  const p = getProjectById(id);
  if (!p) return;
  if (!confirm(`هل تريد حذف المشروع «${p.name}» مع كامل سجل الفحوصات والتقارير؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
  projectsState.projects = projectsState.projects.filter((x) => x.id !== id);
  if (projectsState.activeProjectId === id) projectsState.activeProjectId = null;
  saveProjectsState();
  renderProjectsList();
  refreshActiveProjectUI();
  showProjectsListView(false);
}

/* ==================== تعديل بيانات المشروع ==================== */
function openEditProjectModal(id) {
  const p = getProjectById(id);
  if (!p) {
    alert("تعذر العثور على المشروع المطلوب.");
    return;
  }
  document.getElementById("editProjectId").value = p.id;
  document.getElementById("editProjectName").value = p.name || "";
  document.getElementById("editProjectNo").value = p.projectNo || "";
  document.getElementById("editProjectContractor").value = p.contractor || "";
  document.getElementById("editProjectConsultant").value = p.consultant || "";
  document.getElementById("editProjectSampleType").value = p.sampleType || "";
  document.getElementById("editProjectLocation").value = p.location || "";
  document.getElementById("editProjectLength").value = p.lengthKm || "";
  document.getElementById("editProjectModalTitle").textContent = `✏️ تعديل بيانات المشروع — ${p.projectNo}`;
  document.getElementById("editProjectModal").classList.remove("hidden");
  const nameEl = document.getElementById("editProjectName");
  if (nameEl) {
    nameEl.focus();
    nameEl.select();
  }
}

function closeEditProjectModal() {
  document.getElementById("editProjectModal").classList.add("hidden");
}

function saveProjectEdits() {
  const id = document.getElementById("editProjectId").value;
  const p = getProjectById(id);
  if (!p) {
    alert("تعذر العثور على المشروع المطلوب.");
    closeEditProjectModal();
    return;
  }

  const name = document.getElementById("editProjectName").value.trim();
  if (!name) {
    alert("يرجى إدخال اسم المشروع قبل الحفظ.");
    document.getElementById("editProjectName").focus();
    return;
  }

  const projectNo = document.getElementById("editProjectNo").value.trim() || p.projectNo;

  const duplicateProject = projectsState.projects.find(
    (x) =>
      x.id !== p.id &&
      (x.name.trim() === name ||
        (projectNo && x.projectNo.trim().toLowerCase() === projectNo.toLowerCase()))
  );
  if (duplicateProject) {
    alert(
      `لا يمكن الحفظ: يوجد مشروع آخر بنفس الاسم أو الرقم «${duplicateProject.name}» (${duplicateProject.projectNo}). عدّل القيم لحفظها.`
    );
    return;
  }

  p.name = name;
  p.projectNo = projectNo;
  p.contractor = document.getElementById("editProjectContractor").value.trim();
  p.consultant = document.getElementById("editProjectConsultant").value.trim();
  p.sampleType = document.getElementById("editProjectSampleType").value.trim();
  p.location = document.getElementById("editProjectLocation").value.trim();
  p.lengthKm = document.getElementById("editProjectLength").value.trim();

  saveProjectsState();
  renderProjectsList();
  refreshActiveProjectUI();
  if (projectsState.activeProjectId === p.id) renderProjectWorkspace(p);
  closeEditProjectModal();
  alert(`تم حفظ تعديلات المشروع «${p.name}» بنجاح.`);
}

function renderProjectsList() {
  // إبقاء لوحة التقارير متزامنة مع أي تغيير في المشاريع أو التقارير أو السجلات
  if (typeof renderReportsDashboard === "function") renderReportsDashboard();
  renderProjectsDirectory();
  const container = document.getElementById("projectsListContainer");
  const badge = document.getElementById("projectsCountBadge");
  if (!container) return;
  badge.textContent = `${projectsState.projects.length} مشاريع`;

  if (projectsState.projects.length === 0) {
    container.innerHTML = `<div class="empty-state-card">لا توجد مشاريع مسجلة بعد. أنشئ مشروعاً جديداً من النموذج أعلاه ليصبح له صفحة خاصة وسجل وتقارير مرقّمة.</div>`;
    return;
  }

  container.innerHTML = projectsState.projects
    .slice()
    .sort((a, b) => b.serialNumber - a.serialNumber)
    .map((p) => {
      const totals = computeTotals(p.logItems);
      const isActive = projectsState.activeProjectId === p.id;
      return `
        <div class="project-card ${isActive ? "is-active" : ""}">
          <div class="project-card-top">
            <div>
              <div class="project-card-title">${escHTML(p.name)} ${isActive ? '<span class="unit-badge">نشط</span>' : ""}</div>
              <div class="project-card-no">${escHTML(p.projectNo)}</div>
            </div>
            <div class="project-card-actions no-print">
              <button type="button" class="btn btn-primary btn-sm" onclick="openProject('${p.id}')">📄 فتح الصفحة</button>
              <button type="button" class="btn btn-edit btn-sm" onclick="openEditProjectModal('${p.id}')" title="تعديل بيانات المشروع">✏️ تعديل</button>
              <button type="button" class="btn btn-danger-outline btn-sm" onclick="deleteProject('${p.id}')" title="حذف المشروع">🗑️</button>
            </div>
          </div>
          <div class="project-card-meta">
            <span>📍 ${escHTML(p.location || "--")}</span>
            <span>🏗️ المقاول: ${escHTML(p.contractor || "--")}</span>
            <span>📅 ${escHTML(ltrDate(p.createdDate))}</span>
            <span>🧾 فحوصات: ${p.logItems.length}</span>
            <span>📑 تقارير: ${p.reports.length}</span>
            <span style="color:var(--warning-700);font-weight:700;">حسميات: ${formatMoney(totals.deduction)} د.أ</span>
          </div>
        </div>
      `;
    })
    .join("");
}

// عرض قائمة المشاريع في التبويب المستقل مع البحث
function renderProjectsDirectory() {
  const container = document.getElementById("projectsDirectoryContainer");
  if (!container) return;

  const badge = document.getElementById("projectsDirectoryCountBadge");
  const searchEl = document.getElementById("projectsDirectorySearch");
  const query = searchEl ? searchEl.value.trim().toLowerCase() : "";

  if (projectsState.projects.length === 0) {
    if (badge) badge.textContent = "0 مشاريع";
    container.innerHTML = `<div class="empty-state-card">لا توجد مشاريع مسجلة بعد. أنشئ مشروعاً جديداً من تبويب «إدارة المشاريع والتقارير».</div>`;
    return;
  }

  const projects = projectsState.projects
    .slice()
    .sort((a, b) => b.serialNumber - a.serialNumber)
    .filter((p) => {
      if (!query) return true;
      return [p.name, p.projectNo, p.contractor, p.consultant, p.location]
        .some((value) => String(value || "").toLowerCase().includes(query));
    });

  if (badge) badge.textContent = `${projects.length} مشاريع`;

  if (projects.length === 0) {
    container.innerHTML = `<div class="empty-state-card">لا توجد مشاريع مطابقة لنتائج البحث.</div>`;
    return;
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>اسم المشروع</th>
          <th>المقاول / الاستشاري</th>
          <th>الموقع</th>
          <th>فحوصات</th>
          <th>تقارير</th>
          <th>إجمالي الحسميات</th>
          <th class="no-print">إجراءات</th>
        </tr>
      </thead>
      <tbody>
        ${projects
          .map((p, idx) => {
            const totals = computeTotals(p.logItems);
            const isActive = projectsState.activeProjectId === p.id;
            return `
              <tr>
                <td>${idx + 1}</td>
                <td>
                  <strong>${escHTML(p.name)}</strong>
                  ${isActive ? '<span class="unit-badge">نشط</span>' : ""}
                  <div class="directory-project-no" dir="ltr">${escHTML(p.projectNo)}</div>
                </td>
                <td>${escHTML(p.contractor || "--")}<div class="directory-sub">${escHTML(p.consultant || "--")}</div></td>
                <td>${escHTML(p.location || "--")}</td>
                <td>${p.logItems.length}</td>
                <td>${p.reports.length}</td>
                <td><strong style="color:var(--warning-700);">${formatMoney(totals.deduction)} د.أ</strong></td>
                <td class="no-print">
                  <div class="directory-actions">
                    <button type="button" class="btn btn-primary btn-sm" onclick="openProject('${p.id}')">📄 فتح</button>
                    <button type="button" class="btn btn-edit btn-sm" onclick="openEditProjectModal('${p.id}')" title="تعديل بيانات المشروع">✏️</button>
                    <button type="button" class="btn btn-danger-outline btn-sm" onclick="deleteProject('${p.id}')" title="حذف المشروع">🗑️</button>
                  </div>
                </td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

// مزامنة وصف الموقع/المحطة مع نتيجة الحاسبة فور الكتابة (بدون انتظار إعادة الحساب)
function syncSampleLocation() {
  const el = document.getElementById("sampleLocationInput");
  const value = el ? toWesternDigits(el.value).trim() || "منطقة ممثلة" : "منطقة ممثلة";
  if (currentCalculationResult) {
    currentCalculationResult.location = value;
    updateDuplicateWarningBanner();
  }
}

// تنبيه خفيف يتحدث مباشرة عند تغيير نتيجة أي حاسبة دون إعادة بناء بقية الواجهة
function updateDuplicateWarningBanner() {
  const banner = document.getElementById("calculatorActiveProjectBanner");
  if (!banner) return;
  const previous = banner.querySelector(".duplicate-warning");
  if (previous) previous.remove();
  const duplicates = currentResultDuplicates(getActiveProject());
  if (!duplicates.length) return;
  const warning = document.createElement("div");
  warning.className = "duplicate-warning";
  warning.textContent = `⛔ تنبيه تكرار: النتيجة الحالية مطابقة لفحص مسجل مسبقاً ولن تُضاف. (${duplicates.join("؛ ")})`;
  banner.appendChild(warning);
}

function refreshActiveProjectUI() {
  const p = getActiveProject();
  const nameEl = document.getElementById("activeProjectHeaderName");
  const noEl = document.getElementById("activeProjectHeaderNo");
  if (nameEl) nameEl.textContent = p ? p.name : "لم يتم اختيار مشروع";
  if (noEl) noEl.textContent = p ? p.projectNo : "";

  const banner = document.getElementById("calculatorActiveProjectBanner");
  if (banner) {
    banner.innerHTML = p
      ? `✅ الفحوصات التي تضيفها ستُسجَّل في صفحة المشروع النشط: <strong>${escHTML(p.name)}</strong> — رقم المشروع: <span dir="ltr">${escHTML(p.projectNo)}</span>. لتغيير المشروع انتقل إلى تبويب «إدارة المشاريع».`
      : `⚠️ لا يوجد مشروع نشط. أنشئ مشروعاً أو افتح مشروعاً موجوداً من تبويب «إدارة المشاريع» قبل إضافة الفحوصات.`;
  }
  updateDuplicateWarningBanner();

  const subtitle = document.getElementById("projectLogSubtitle");
  if (subtitle) {
    subtitle.textContent = p
      ? `الكشف الحالي للمشروع: ${p.name} (${p.projectNo}) — انقر على أي خلية لتعديلها مباشرة، وسيُحفظ التعديل تلقائياً وينعكس على التقارير.`
      : "لا يوجد مشروع نشط — أنشئ مشروعاً أولاً لإضافة الفحوصات وتوليد التقارير.";
  }

  const logDateInput = document.getElementById("projectLogDateInput");
  if (logDateInput) logDateInput.value = formatDate(p ? p.logDate || todayDateStr() : todayDateStr());

  renderProjectLogTable();
}

function renderProjectWorkspace(p) {
  const totals = computeTotals(p.logItems);

  document.getElementById("projectWorkspaceHeader").innerHTML = `
    <div class="ws-directorate">المملكة الأردنية الهاشمية — وزارة الأشغال العامة والإسكان — مديرية أشغال محافظة مأدبا</div>
    <h2>صفحة المشروع: ${escHTML(p.name)}</h2>
    <div class="ws-no">رقم المشروع / Project No: ${escHTML(p.projectNo)} | التسلسل: (${p.serialNumber})</div>
    <div class="workspace-meta-grid">
      <div><strong>الموقع</strong>${escHTML(p.location || "--")}</div>
      <div><strong>المقاول</strong>${escHTML(p.contractor || "--")}</div>
      <div><strong>الاستشاري / الإشراف</strong>${escHTML(p.consultant || "--")}</div>
      <div><strong>طول المشروع</strong>${escHTML(p.lengthKm || "--")}</div>
      <div><strong>تاريخ التسجيل</strong><input type="text" class="rp-date-input ws-date-input" dir="ltr" data-date-kind="project" data-project-id="${escHTML(p.id)}" value="${escHTML(formatDate(p.createdDate))}" onchange="updateProjectCreatedDate(this)" title="بصيغة يوم/شهر/سنة — مثال: 1/9/2026" /></div>
    </div>
  `;

  document.getElementById("projectWorkspaceStats").innerHTML = `
    <div class="ws-stat-box"><div class="ws-stat-label">عدد الفحوصات المسجلة</div><div class="ws-stat-value">${p.logItems.length}</div></div>
    <div class="ws-stat-box"><div class="ws-stat-label">عدد التقارير الصادرة</div><div class="ws-stat-value">${p.reports.length}</div></div>
    <div class="ws-stat-box gold"><div class="ws-stat-label">إجمالي قيمة الحسميات (د.أ)</div><div class="ws-stat-value">${formatMoney(totals.deduction)}</div></div>
    <div class="ws-stat-box"><div class="ws-stat-label">قيمة الأعمال الممثلة (د.أ)</div><div class="ws-stat-value">${formatMoney(totals.work)}</div></div>
  `;

  renderWorkspaceLog(p);
  renderProjectReports(p);
}

function renderWorkspaceLog(p) {
  const container = document.getElementById("workspaceLogContainer");
  if (!container) return;
  if (p.logItems.length === 0) {
    container.innerHTML = `<div class="empty-state-card">لا توجد فحوصات مسجلة لهذا المشروع بعد. افتح الحاسبة الشاملة وأضف الفحوصات إلى سجل المشروع النشط.</div>`;
    return;
  }

  const totals = computeTotals(p.logItems);
  container.innerHTML = `
    <table class="data-table log-columns-table">
      <thead>
        <tr>
          <th>#</th>
          <th>الموقع / العينة</th>
          <th>الطبقة (الجدول)</th>
          <th>الفحص المخبري</th>
          <th>قيمة الأعمال (ك×س)</th>
          <th>ق1</th>
          <th>ق2</th>
          <th>ق3</th>
          <th>الحسم الكلي</th>
          <th>القرار</th>
          <th class="no-print">حذف</th>
        </tr>
      </thead>
      <tbody>
        ${p.logItems
          .map(
            (row, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${escHTML(row.location)}</strong></td>
            <td>جدول ${escHTML(tableRefText(row))}</td>
            <td>${escHTML(row.itemName)}</td>
            <td>${formatMoney(row.totalWorkValue)}</td>
            <td>${formatMoney(row.q1)}</td>
            <td>${formatMoney(row.q2)}</td>
            <td>${formatMoney(row.q3)}</td>
            <td><strong>${formatMoney(row.totalDeduction)}</strong></td>
            <td>${escHTML(row.finalDecision)}</td>
            <td class="no-print"><button type="button" class="btn-remove-core" onclick="removeProjectLogItem('${row.id}')" title="حذف">✖</button></td>
          </tr>
        `
          )
          .join("")}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4"><strong>الإجمالي</strong></td>
          <td>${formatMoney(totals.work)}</td>
          <td>${formatMoney(totals.q1)}</td>
          <td>${formatMoney(totals.q2)}</td>
          <td>${formatMoney(totals.q3)}</td>
          <td class="grand-total-cell">${formatMoney(totals.deduction)}</td>
          <td colspan="2"></td>
        </tr>
      </tfoot>
    </table>
  `;
}

/* ==================== لوحة التقارير المستقلة: بحث، فلترة، ومؤشرات أداء ==================== */
const REPORT_STATUS_DEFS = {
  accepted: { key: "accepted", label: "مقبول بدون حسم", className: "accepted", icon: "✅" },
  deduct: { key: "deduct", label: "مقبول مع حسم", className: "deduct", icon: "💰" },
  recheck: { key: "recheck", label: "تحتاج إعادة فحص", className: "recheck", icon: "⚠️" }
};

function getReportStatus(p, report) {
  const totals = getReportView(p, report).totals;
  if (totals.rejectedCount > 0) return { ...REPORT_STATUS_DEFS.recheck, totals };
  if (totals.deduction > 0) return { ...REPORT_STATUS_DEFS.deduct, totals };
  return { ...REPORT_STATUS_DEFS.accepted, totals };
}

function collectDashboardReports() {
  const rows = [];
  (projectsState.projects || []).forEach((p) => {
    (p.reports || []).forEach((report) => {
      rows.push({ project: p, report, status: getReportStatus(p, report) });
    });
  });
  return rows;
}

function resetReportsFilters() {
  const search = document.getElementById("reportsSearchInput");
  const project = document.getElementById("reportsProjectFilter");
  const status = document.getElementById("reportsStatusFilter");
  if (search) search.value = "";
  if (project) project.value = "all";
  if (status) status.value = "all";
  renderReportsDashboard();
}

function renderReportsDashboard() {
  const kpiGrid = document.getElementById("reportsKpiGrid");
  const projectFilter = document.getElementById("reportsProjectFilter");
  const searchInput = document.getElementById("reportsSearchInput");
  const statusFilter = document.getElementById("reportsStatusFilter");
  const output = document.getElementById("reportsDashboardOutput");
  const badge = document.getElementById("reportsResultBadge");
  if (!kpiGrid || !projectFilter || !searchInput || !statusFilter || !output) return;

  const selectedProject = projectFilter.value || "all";
  projectFilter.innerHTML =
    `<option value="all">كل المشاريع (${projectsState.projects.length})</option>` +
    projectsState.projects
      .map((p) => `<option value="${escHTML(p.id)}">${escHTML(p.name)} — ${escHTML(p.projectNo)}</option>`)
      .join("");
  projectFilter.value = Array.from(projectFilter.options).some((o) => o.value === selectedProject)
    ? selectedProject
    : "all";

  const allRows = collectDashboardReports();
  const acceptedCount = allRows.filter((x) => x.status.className !== "recheck").length;
  const recheckCount = allRows.length - acceptedCount;
  const totalDeduction = allRows.reduce((sum, x) => sum + (x.status.totals.deduction || 0), 0);
  const acceptedPct = allRows.length ? Math.round((acceptedCount / allRows.length) * 100) : 0;

  kpiGrid.innerHTML = `
    <div class="reports-kpi-card"><div class="reports-kpi-label">🏗️ المشاريع المسجلة</div><div class="reports-kpi-value">${projectsState.projects.length}</div><div class="reports-kpi-note">مشاريع لها سجل وتقارير</div></div>
    <div class="reports-kpi-card"><div class="reports-kpi-label">📑 إجمالي التقارير</div><div class="reports-kpi-value">${allRows.length}</div><div class="reports-kpi-note">جميع التقارير الصادرة</div></div>
    <div class="reports-kpi-card kpi-ok"><div class="reports-kpi-label">✅ تقارير مقبولة</div><div class="reports-kpi-value">${acceptedCount}</div><div class="reports-kpi-note">${acceptedPct}% من إجمالي التقارير</div></div>
    <div class="reports-kpi-card kpi-warn"><div class="reports-kpi-label">⚠️ بحاجة إعادة فحص</div><div class="reports-kpi-value">${recheckCount}</div><div class="reports-kpi-note">تحتوي فحوصات مرفوضة</div></div>
    <div class="reports-kpi-card kpi-money"><div class="reports-kpi-label">💰 إجمالي الحسميات</div><div class="reports-kpi-value">${formatMoney(totalDeduction)}</div><div class="reports-kpi-note">دينار أردني</div></div>
  `;

  const queryTerms = searchInput.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const pf = projectFilter.value;
  const sf = statusFilter.value;
  const filtered = allRows.filter((x) => {
    if (pf !== "all" && x.project.id !== pf) return false;
    if (sf === "accepted" && x.status.className === "recheck") return false;
    if (sf === "deduct" && x.status.className !== "deduct") return false;
    if (sf === "recheck" && x.status.className !== "recheck") return false;
    if (!queryTerms.length) return true;
    const haystack = [
      x.project.name,
      x.project.projectNo,
      x.project.contractor,
      x.project.consultant,
      x.project.location,
      x.report.reportNo,
      x.report.title,
      x.report.serialNumber
    ]
      .map((v) => String(v == null ? "" : v).toLowerCase())
      .join(" | ");
    return queryTerms.every((term) => haystack.includes(term));
  });

  if (badge) badge.textContent = `${filtered.length} تقرير`;
  if (!filtered.length) {
    output.innerHTML = `<div class="empty-state-card">لا توجد تقارير مطابقة للبحث أو الفلترة المختارة. جرّب كلمة أخرى أو أعد ضبط الفلاتر.</div>`;
    return;
  }

  const groups = new Map();
  filtered.forEach((x) => {
    if (!groups.has(x.project.id)) groups.set(x.project.id, { project: x.project, rows: [] });
    groups.get(x.project.id).rows.push(x);
  });

  output.innerHTML = Array.from(groups.values())
    .map(({ project: p, rows }) => {
      const pAccepted = rows.filter((x) => x.status.className !== "recheck").length;
      const pRecheck = rows.length - pAccepted;
      const pDeduction = rows.reduce((sum, x) => sum + (x.status.totals.deduction || 0), 0);

      const reportCards = rows
        .map(({ report: r, status }) => {
          const view = getReportView(p, r);
          return `
          <div class="reports-report-card">
            <div class="reports-report-main">
              <div class="reports-report-title">${escHTML(r.title)} <span class="reports-seq">#${escHTML(r.serialNumber)}</span></div>
              <div class="reports-report-no">${escHTML(r.reportNo)}</div>
              <div class="reports-report-meta">
                <span>📅 <input type="text" class="rp-date-input rp-date-inline" dir="ltr" data-date-kind="report" data-project-id="${escHTML(p.id)}" data-report-id="${escHTML(r.id)}" value="${escHTML(formatDate(r.date))}" onchange="updateReportDate(this)" title="بصيغة يوم/شهر/سنة — مثال: 1/9/2026" /></span>
                <span>🧪 ${view.items.length} فحص ظاهر</span>
                <span>${visibleRowsBadge(r)}</span>
                <span class="reports-status-badge ${status.className}">${status.icon} ${status.label}</span>
                ${
                  status.totals.rejectedCount > 0
                    ? `<span class="reports-alert-note">يوجد ${status.totals.rejectedCount} فحص مرفوض — يُنصح بإعادة الفحص قبل الاعتماد النهائي.</span>`
                    : ""
                }
              </div>
            </div>
            <div class="reports-report-side">
              <div class="reports-amount">${formatMoney(status.totals.deduction)} د.أ</div>
              <div class="no-print report-dashboard-actions">
                <button type="button" class="btn btn-primary btn-sm" onclick="openReportModal('${p.id}','${r.id}')">👁️ عرض</button>
                <button type="button" class="btn btn-outline-dark btn-sm" onclick="printProjectReport('${p.id}','${r.id}')">🖨️ طباعة</button>
                <button type="button" class="btn btn-excel btn-sm" onclick="exportReportExcel('${p.id}','${r.id}')">📗 Excel</button>
                <button type="button" class="btn btn-word btn-sm" onclick="exportReportWord('${p.id}','${r.id}')">📘 Word</button>
                <button type="button" class="btn btn-edit btn-sm" onclick="openReportRowsModal('${p.id}','${r.id}')" title="تحديد الصفوف الظاهرة">✂️ الصفوف</button>
                <button type="button" class="btn btn-edit btn-sm" onclick="openCorrespondenceModal('contractor','${p.id}','${r.id}')" title="كتاب للمقاول بالفحوصات المرفوضة">✉️ كتاب مقاول</button>
                <button type="button" class="btn btn-outline-dark btn-sm" onclick="openCorrespondenceModal('memo','${p.id}','${r.id}')" title="مذكرة داخلية لمدير الأشغال">📝 مذكرة داخلية</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="openProject('${p.id}')">📁 المشروع</button>
                <button type="button" class="btn btn-danger-outline btn-sm" onclick="deleteProjectReport('${p.id}','${r.id}')" title="حذف التقرير">🗑️</button>
              </div>
            </div>
          </div>`;
        })
        .join("");

      return `
      <div class="reports-project-section">
        <div class="reports-project-head">
          <div>
            <div class="reports-project-title">${escHTML(p.name)}</div>
            <div class="reports-project-meta">
              <span>رقم المشروع: <span dir="ltr">${escHTML(p.projectNo)}</span></span>
              <span>🏗️ ${escHTML(p.contractor || "--")}</span>
              <span>📅 <span dir="ltr">${escHTML(formatDate(p.createdDate))}</span></span>
            </div>
          </div>
          <div class="reports-project-stats">
            <span class="mini-stat">📑 ${rows.length} تقرير</span>
            <span class="mini-stat ok">✅ ${pAccepted} مقبول</span>
            <span class="mini-stat warn">⚠️ ${pRecheck} إعادة فحص</span>
            <span class="mini-stat money">${formatMoney(pDeduction)} د.أ</span>
          </div>
        </div>
        ${reportCards}
      </div>`;
    })
    .join("");
}

/* ==================== مراسلات المختبر: كتاب للمقاول ومذكرة داخلية ==================== */
const CORRESPONDENCE_DEFS = {
  contractor: {
    label: "كتاب إلى المقاول",
    docLabel: "كتاب",
    title: "كتاب إلى المقاول بشأن الفحوصات المرفوضة",
    subtitle: "إشعار بتصويب الفحوصات المخبرية غير المطابقة للأسس المعتمدة — الإصدار 2023 م",
    subject: "إشعار بفحوصات مخبرية مرفوضة وطلب تصويبها"
  },
  memo: {
    label: "مذكرة داخلية",
    docLabel: "مذكرة",
    title: "مذكرة داخلية إلى مدير أشغال محافظة مأدبا",
    subtitle: "إحاطة علماً بنتائج الفحوصات المرفوضة والتوصية بإعادة الفحص — الإصدار 2023 م",
    subject: "نتائج فحوصات مخبرية مرفوضة والتوصية بإعادة الفحص"
  }
};

let correspondenceState = null;

function closeCorrespondenceModal() {
  const modal = document.getElementById("correspondenceModal");
  if (modal) modal.classList.add("hidden");
}

function closeCorrespondencePreview() {
  const modal = document.getElementById("correspondencePreviewModal");
  if (modal) modal.classList.add("hidden");
}

function openCorrespondenceModal(kind, projectId, reportId) {
  const def = CORRESPONDENCE_DEFS[kind];
  if (!def) return;
  const p = getProjectById(projectId);
  if (!p) return;
  const r = p.reports.find((x) => x.id === reportId);
  if (!r) return;
  const items = getReportView(p, r).items;
  if (!items.length) {
    alert("لا توجد فحوصات في هذا التقرير لإصدار المراسلة.");
    return;
  }
  const rejected = items.filter((it) => it.anyRejected);
  if (!rejected.length && kind === "contractor") {
    alert("لا توجد فحوصات مرفوضة في هذا التقرير. يمكنك تحديد الفحوصات المطلوبة يدوياً من القائمة.");
  }

  correspondenceState = {
    kind,
    projectId,
    reportId,
    items,
    selectedIds: rejected.map((it) => it.id),
    docNo: `${p.projectNo}/${def.docLabel}/${String(r.serialNumber).padStart(3, "0")}`,
    date: formatDate(r.date),
    note: "",
    html: ""
  };

  document.getElementById("correspondenceProjectId").value = p.id;
  document.getElementById("correspondenceReportId").value = r.id;
  document.getElementById("correspondenceKind").value = kind;
  document.getElementById("correspondenceDocNo").value = correspondenceState.docNo;
  document.getElementById("correspondenceDate").value = correspondenceState.date;
  document.getElementById("correspondenceNote").value = "";
  document.getElementById("correspondenceModalTitle").textContent = `${def.label} — ${r.reportNo}`;
  document.getElementById("correspondenceIntro").innerHTML =
    `<strong>التقرير المرجعي:</strong> <span dir="ltr">${escHTML(r.reportNo)}</span> — ${escHTML(p.name)} | ` +
    `الفحوصات المرفوضة في التقرير: <strong>${rejected.length}</strong> من ${items.length}`;

  renderCorrespondenceItems();
  closeCorrespondencePreview();
  document.getElementById("correspondenceModal").classList.remove("hidden");
}

function renderCorrespondenceItems() {
  const st = correspondenceState;
  const list = document.getElementById("correspondenceItemsList");
  if (!st || !list) return;
  list.innerHTML = `
    <table class="data-table report-rows-table correspondence-table">
      <thead><tr><th style="width:44px;">✔</th><th>#</th><th>الموقع / العينة</th><th>الجدول</th><th>الفحص المخبري</th><th>القرار</th><th>الحسم الكلي</th></tr></thead>
      <tbody>
        ${st.items.map((it, idx) => `
          <tr>
            <td><input type="checkbox" class="correspondence-row-check" data-item-id="${escHTML(it.id)}" ${st.selectedIds.includes(it.id) ? "checked" : ""} onchange="onCorrespondenceItemChange()" aria-label="تحديد الفحص ${idx + 1}" /></td>
            <td>${idx + 1}</td>
            <td><strong>${escHTML(it.location)}</strong></td>
            <td>${escHTML(tableRefText(it))}</td>
            <td>${escHTML(it.itemName)}</td>
            <td>${it.anyRejected ? '<span class="rr-rows-badge">مرفوض</span>' : escHTML(it.finalDecision || "---")}</td>
            <td><span class="rp-num">${formatMoney(it.totalDeduction)}</span></td>
          </tr>`).join("")}
      </tbody>
    </table>`;
  updateCorrespondenceCount();
}

function getSelectedCorrespondenceIds() {
  return Array.from(document.querySelectorAll(".correspondence-row-check"))
    .filter((box) => box.checked)
    .map((box) => box.dataset.itemId);
}

function onCorrespondenceItemChange() {
  if (!correspondenceState) return;
  correspondenceState.selectedIds = getSelectedCorrespondenceIds();
  updateCorrespondenceCount();
}

function toggleAllCorrespondenceItems(checked) {
  if (!correspondenceState) return;
  correspondenceState.selectedIds = checked ? correspondenceState.items.map((it) => it.id) : [];
  renderCorrespondenceItems();
}

function selectRejectedCorrespondenceItems() {
  if (!correspondenceState) return;
  correspondenceState.selectedIds = correspondenceState.items.filter((it) => it.anyRejected).map((it) => it.id);
  renderCorrespondenceItems();
}

function updateCorrespondenceCount() {
  const st = correspondenceState;
  const label = document.getElementById("correspondenceCount");
  if (!st || !label) return;
  const ids = getSelectedCorrespondenceIds();
  const totals = computeTotals(st.items.filter((it) => ids.includes(it.id)));
  label.textContent = `المحدد: ${ids.length} من ${st.items.length} فحص — الحسم: ${formatMoney(totals.deduction)} د.أ`;
}

function normalizeCorrespondenceDate(input) {
  if (!correspondenceState || !input) return;
  const date = validEditedDate(input, correspondenceState.date);
  if (date) correspondenceState.date = date;
}

function collectCorrespondenceContext() {
  const st = correspondenceState;
  if (!st) return null;
  const p = getProjectById(st.projectId);
  if (!p) return null;
  const r = p.reports.find((x) => x.id === st.reportId);
  if (!r) return null;

  const docNoEl = document.getElementById("correspondenceDocNo");
  const dateEl = document.getElementById("correspondenceDate");
  const noteEl = document.getElementById("correspondenceNote");
  st.docNo = docNoEl ? docNoEl.value.trim() : st.docNo;
  if (!st.docNo) {
    alert("يرجى إدخال رقم المراسلة قبل الإصدار.");
    if (docNoEl) docNoEl.focus();
    return null;
  }
  const date = validEditedDate(dateEl, st.date);
  if (!date) return null;
  st.date = date;
  st.note = noteEl ? noteEl.value.trim() : "";
  st.selectedIds = getSelectedCorrespondenceIds();
  if (!st.selectedIds.length) {
    alert("يرجى تحديد فحص واحد على الأقل لإدراجه في المراسلة.");
    return null;
  }
  st.selectedItems = st.items.filter((it) => st.selectedIds.includes(it.id));
  return { project: p, report: r, state: st };
}

function buildCorrespondenceHTML(p, r, st) {
  const def = CORRESPONDENCE_DEFS[st.kind];
  const items = st.selectedItems || [];
  const totals = computeTotals(items);
  const rejectedCount = items.filter((it) => it.anyRejected).length;
  const introText = st.kind === "contractor"
    ? `بناءً على التقرير رقم ${r.reportNo} المؤرخ ${formatDate(r.date)} الخاص بالمشروع ${p.name} (رقم المشروع ${p.projectNo})، تبين من الفحوصات المخبرية أن العينات الموضحة أدناه غير مطابقة للأسس المعتمدة (الإصدار 2023 م). نرجو التكرم بتصويبها وإعادة الفحص، واتخاذ الإجراءات اللازمة لتفادي تكرارها.`
    : `إشارة إلى التقرير رقم ${r.reportNo} المؤرخ ${formatDate(r.date)}، نحيطكم علماً بأن (${rejectedCount}) من الفحوصات المخبرية للمشروع ${p.name} (رقم المشروع ${p.projectNo}) رُفضت وفق أسس القبول المعتمدة (الإصدار 2023 م)، وتبلغ قيمة الحسميات المرتبطة بالفحوصات المحددة ${formatMoney(totals.deduction)} د.أ. ونوصي بإحالة الموضوع إلى المقاول لتصويبها وإعادة الفحص قبل اعتماد الاستلام النهائي.`;

  const toBlock = st.kind === "contractor"
    ? `<div><strong>إلى:</strong> ${escHTML(p.contractor || "المقاول المعني")}</div>
       <div><strong>المشروع:</strong> ${escHTML(p.name)} — <span dir="ltr">${escHTML(p.projectNo)}</span></div>
       <div><strong>الموضوع:</strong> ${escHTML(def.subject)}</div>`
    : `<div><strong>إلى:</strong> سعادة مدير أشغال محافظة مأدبا المحترم</div>
       <div><strong>من:</strong> رئيس قسم مختبر مديرية أشغال محافظة مأدبا</div>
       <div><strong>المشروع:</strong> ${escHTML(p.name)} — <span dir="ltr">${escHTML(p.projectNo)}</span></div>
       <div><strong>الموضوع:</strong> ${escHTML(def.subject)}</div>`;

  const sigBlocks = st.kind === "contractor"
    ? [
        ["أعدّ الكتاب", "مهندس المختبر / مختبر الطرق", "الاسم: ................................."],
        ["تدقيق ومراجعة", "رئيس قسم مختبر مديرية أشغال محافظة مأدبا", "الاسم: م.براءة الغليلات"]
      ]
    : [["تدقيق ومراجعة", "رئيس قسم مختبر مديرية أشغال محافظة مأدبا", "الاسم: م.براءة الغليلات"]];

  const signaturesHTML = `
    <div class="rp-signatures${st.kind === "memo" ? " rp-signatures-single" : ""}"${sigBlocks.length > 1 ? ` style="grid-template-columns:repeat(${sigBlocks.length}, 1fr);"` : ""}>
      ${sigBlocks.map((b) => `
        <div>
          <div>${b[0]}</div>
          <div class="rp-sig-line"><strong>${b[1]}</strong><div>${b[2]}</div></div>
        </div>`).join("")}
    </div>`;

  return `
  <div class="report-paper">
    <div class="rp-official-header">
      <div class="rp-emblem">${getReportEmblemHTML()}</div>
      <div class="rp-header-center">
        <div class="rp-kingdom">المملكة الأردنية الهاشمية</div>
        <div class="rp-ministry">وزارة الأشغال العامة والإسكان</div>
        <div class="rp-directorate">مديرية أشغال محافظة مأدبا</div>
        <div class="rp-kingdom">المختبر المركزي-الحسميات والشذوذات</div>
      </div>
      <div class="rp-ref-box">
        <div>${def.docLabel} رقم: <span dir="ltr">${escHTML(st.docNo)}</span></div>
        <div>التاريخ: <input type="text" class="rp-date-input" dir="ltr" value="${escHTML(formatDate(st.date))}" onchange="updateCorrespondencePreviewDate(this)" title="بصيغة يوم/شهر/سنة — مثال: 1/9/2026" /></div>
        <div>رقم التقرير: <span dir="ltr">${escHTML(r.reportNo)}</span></div>
        <div>رقم المشروع: <span dir="ltr">${escHTML(p.projectNo)}</span></div>
      </div>
    </div>

    <div class="rp-title">${escHTML(def.title)}</div>
    <div class="rp-subtitle">${escHTML(def.subtitle)}</div>

    <div class="rp-letter-to">${toBlock}</div>
    <div class="rp-letter-text">${escHTML(introText)}</div>

    <div class="rp-section-title">الفحوصات المحددة</div>
    <table class="rp-table">
      <thead><tr><th>#</th><th>الموقع / العينة</th><th>الجدول</th><th>الفحص المخبري</th><th>القرار</th><th>الحسم (د.أ)</th><th>الإجراء المطلوب</th></tr></thead>
      <tbody>
        ${items.map((it, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${escHTML(it.location)}</td>
            <td>${escHTML(tableRefText(it))}</td>
            <td>${escHTML(it.itemName)}</td>
            <td>${it.anyRejected ? "مرفوض" : escHTML(it.finalDecision || "---")}</td>
            <td><span class="rp-num">${formatMoney(it.totalDeduction)}</span></td>
            <td class="rp-letter-action">${it.anyRejected ? "تصويب الفحص وإعادة أخذ عينة" : "مراجعة النتيجة ومتابعتها"}</td>
          </tr>`).join("")}
        <tr style="background:#f1f5f9;font-weight:800;">
          <td colspan="5">الإجمالي (${items.length} فحص)</td>
          <td><span class="rp-num">${formatMoney(totals.deduction)}</span></td>
          <td>---</td>
        </tr>
      </tbody>
    </table>

    <div class="rp-letter-summary">
      <span>عدد الفحوصات المحددة: ${items.length}</span>
      <span>منها مرفوضة: ${rejectedCount}</span>
      <span>قيمة الحسم: <span class="rp-num">${formatMoney(totals.deduction)}</span> د.أ</span>
    </div>

    <div class="rp-note-official"><strong>ملاحظة:</strong> الكميات كما وردتنا من قسم المساحة والدراسات</div>
    ${st.note ? `<div class="rp-letter-extra">${escHTML(st.note)}</div>` : ""}

    ${signaturesHTML}

    <div class="rp-footer">
      مديرية أشغال محافظة مأدبا — المختبر المركزي-الحسميات والشذوذات — وزارة الأشغال العامة والإسكان | ${def.docLabel} رقم: ${escHTML(st.docNo)} | صفحة 1 من 1
    </div>
  </div>`;
}

function previewCorrespondence() {
  const ctx = collectCorrespondenceContext();
  if (!ctx) return;
  correspondenceState.html = buildCorrespondenceHTML(ctx.project, ctx.report, ctx.state);
  document.getElementById("correspondencePreviewTitle").textContent =
    `${CORRESPONDENCE_DEFS[ctx.state.kind].label} — ${ctx.state.docNo}`;
  document.getElementById("correspondencePreviewContent").innerHTML = correspondenceState.html;
  closeCorrespondenceModal();
  document.getElementById("correspondencePreviewModal").classList.remove("hidden");
}

function updateCorrespondencePreviewDate(input) {
  const st = correspondenceState;
  if (!st) return;
  const p = getProjectById(st.projectId);
  const r = p ? p.reports.find((x) => x.id === st.reportId) : null;
  if (!p || !r) return;
  const date = validEditedDate(input, st.date);
  if (!date) return;
  st.date = date;
  st.html = buildCorrespondenceHTML(p, r, st);
  document.getElementById("correspondencePreviewContent").innerHTML = st.html;
}

function printCorrespondencePreview() {
  if (!correspondenceState || !correspondenceState.html) return;
  document.getElementById("printReportContainer").innerHTML = correspondenceState.html;
  prepareReportPrint();
  window.print();
}

function exportCorrespondenceWord() {
  const ctx = collectCorrespondenceContext();
  if (!ctx) return;
  downloadBlobFile(
    buildCorrespondenceDocx(ctx.state.kind, ctx.project, ctx.report, ctx.state.selectedItems, ctx.state),
    safeFileName(ctx.state.docNo) + ".docx"
  );
}

function renderProjectReports(p) {
  const container = document.getElementById("workspaceReportsContainer");
  if (!container) return;
  if (p.reports.length === 0) {
    container.innerHTML = `<div class="empty-state-card">لم يُصدر أي تقرير لهذا المشروع بعد. انقر «إنشاء تقرير جديد بهذا المشروع» لتوليد تقرير برقم تسلسلي موثّق.</div>`;
    return;
  }

  container.innerHTML = p.reports
    .slice()
    .reverse()
    .map(
      (r) => {
        const view = getReportView(p, r);
        return `
      <div class="report-row-card">
        <div>
          <div class="rr-title">${escHTML(r.title)} — التسلسل رقم (${r.serialNumber})</div>
          <div class="rr-no">${escHTML(r.reportNo)}</div>
          <div class="text-muted">تاريخ الإصدار: <input type="text" class="rp-date-input rp-date-inline" dir="ltr" data-date-kind="report" data-project-id="${escHTML(p.id)}" data-report-id="${escHTML(r.id)}" value="${escHTML(formatDate(r.date))}" onchange="updateReportDate(this)" title="بصيغة يوم/شهر/سنة — مثال: 1/9/2026" /> | عدد الفحوصات الظاهرة: ${view.items.length}</div>
          <div class="rr-rows-line">${visibleRowsBadge(r)}</div>
          ${signatureOptionsHTML(p.id, r.id, getSignatureFlags(r))}
        </div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <div class="rr-amount">${formatMoney(view.totals.deduction)} د.أ</div>
          <div class="no-print export-buttons-row">
            <button type="button" class="btn btn-primary btn-sm" onclick="openReportModal('${p.id}','${r.id}')">👁️ عرض التقرير</button>
            <button type="button" class="btn btn-outline-dark btn-sm" onclick="printProjectReport('${p.id}','${r.id}')">🖨️ طباعة</button>
            <button type="button" class="btn btn-excel btn-sm" onclick="exportReportExcel('${p.id}','${r.id}')">📗 Excel</button>
            <button type="button" class="btn btn-word btn-sm" onclick="exportReportWord('${p.id}','${r.id}')">📘 Word</button>
            <button type="button" class="btn btn-edit btn-sm" onclick="openReportRowsModal('${p.id}','${r.id}')" title="تحديد الصفوف الظاهرة في التقرير">✂️ تحديد الصفوف</button>
            <button type="button" class="btn btn-edit btn-sm" onclick="openCorrespondenceModal('contractor','${p.id}','${r.id}')" title="كتاب للمقاول بالفحوصات المرفوضة">✉️ كتاب مقاول</button>
            <button type="button" class="btn btn-outline-dark btn-sm" onclick="openCorrespondenceModal('memo','${p.id}','${r.id}')" title="مذكرة داخلية لمدير الأشغال">📝 مذكرة داخلية</button>
            <button type="button" class="btn btn-danger-outline btn-sm" onclick="deleteProjectReport('${p.id}','${r.id}')" title="حذف التقرير">🗑️</button>
          </div>
        </div>
      </div>
    `;
      }
    )
    .join("");
}

/* ==================== تحرير التواريخ أينما وردت (يوم/شهر/سنة) ==================== */
function updateProjectCreatedDate(input) {
  const p = getProjectById(input.dataset.projectId);
  if (!p) return;
  const date = validEditedDate(input, p.createdDate);
  if (!date) return;
  p.createdDate = date;
  input.value = date;
  saveProjectsState();
  renderProjectsList();
}

function updateReportDate(input) {
  const p = getProjectById(input.dataset.projectId);
  if (!p) return;
  const r = p.reports.find((x) => x.id === input.dataset.reportId);
  if (!r) return;
  const date = validEditedDate(input, r.date);
  if (!date) return;
  r.date = date;
  input.value = date;
  saveProjectsState();
  renderProjectReports(p);
  if (typeof renderReportsDashboard === "function") renderReportsDashboard();
  if (currentPrintReportId === r.id) {
    currentPrintReportHTML = buildReportHTML(p, r);
    const content = document.getElementById("reportModalContent");
    const modal = document.getElementById("reportModal");
    if (content && modal && !modal.classList.contains("hidden")) content.innerHTML = currentPrintReportHTML;
  }
}

function updateProjectLogDate(input) {
  const p = getActiveProject();
  if (!p) return;
  const date = validEditedDate(input, p.logDate || todayDateStr());
  if (!date) return;
  p.logDate = date;
  input.value = date;
  saveProjectsState();
}

function generateProjectReport() {
  const p = getActiveProject();
  if (!p) {
    alert("يرجى فتح صفحة مشروع أولاً قبل إنشاء تقرير.");
    switchToTab("tab-projects");
    return;
  }
  if (p.logItems.length === 0) {
    alert("لا توجد فحوصات مسجلة في سجل هذا المشروع لتوليد تقرير.");
    return;
  }

  openReportRowsModal(p.id, null);
}

function deleteProjectReport(projectId, reportId) {
  const p = getProjectById(projectId);
  if (!p) return;
  if (!confirm("هل تريد حذف هذا التقرير؟ ستبقى الفحوصات محفوظة في سجل المشروع.")) return;
  p.reports = p.reports.filter((r) => r.id !== reportId);
  saveProjectsState();
  renderProjectsList();
  renderProjectWorkspace(p);
}

function getAppLogoSrc() {
  const img = document.getElementById("appLogo");
  return img && img.src ? img.src : "";
}

function getReportEmblemHTML() {
  const logoSrc = getAppLogoSrc();
  if (logoSrc) return `<img src="${logoSrc}" alt="شعار وزارة الأشغال العامة والإسكان" class="report-logo-img" />`;
  return `
    <svg viewBox="0 0 64 64" width="58" height="58">
      <rect x="4" y="4" width="56" height="56" rx="12" fill="#2d4722" stroke="#c59b27" stroke-width="2"/>
      <path d="M14 48 L26 22 L38 22 L50 48 Z" fill="#4f772d" opacity="0.85"/>
      <path d="M31 22 L33 22 L33 48 L31 48 Z" fill="#ffffff" stroke-dasharray="4 3"/>
      <circle cx="46" cy="20" r="6" fill="#c59b27"/>
    </svg>`;
}

// التوقيعات الظاهرة في التقرير — يمكن تعديلها من صفحة التقارير أو نافذة الطباعة
function getSignatureFlags(report) {
  const f = report && report.signatureFlags ? report.signatureFlags : {};
  return {
    engineer: f.engineer !== false,
    head: f.head !== false,
    director: f.director !== false
  };
}

function signatureOptionsHTML(projectId, reportId, flags) {
  const option = (key, label) => `
    <label class="sig-option">
      <input type="checkbox" data-sig-flag="${key}" data-project-id="${escHTML(projectId)}" data-report-id="${escHTML(reportId)}"
        ${flags[key] ? "checked" : ""} onchange="updateReportSignatureFlag(this)" />
      <span>${label}</span>
    </label>`;
  return `
    <div class="sig-options-row no-print">
      <span class="sig-options-label">التوقيعات الظاهرة في التقرير:</span>
      ${option("engineer", "مهندس المختبر")}
      ${option("head", "رئيس القسم")}
      ${option("director", "مدير أشغال المحافظة")}
    </div>`;
}

function updateReportSignatureFlag(input) {
  const p = getProjectById(input.dataset.projectId);
  if (!p) return;
  const r = p.reports.find((x) => x.id === input.dataset.reportId);
  if (!r) return;
  r.signatureFlags = getSignatureFlags(r);
  r.signatureFlags[input.dataset.sigFlag] = input.checked;
  saveProjectsState();

  if (currentPrintReportId === r.id) {
    currentPrintReportHTML = buildReportHTML(p, r);
    const content = document.getElementById("reportModalContent");
    const modal = document.getElementById("reportModal");
    if (content && modal && !modal.classList.contains("hidden")) content.innerHTML = currentPrintReportHTML;
    const bar = document.getElementById("reportSignatureOptions");
    if (bar) bar.innerHTML = signatureOptionsHTML(p.id, r.id, r.signatureFlags);
  }
}

/* ==================== تحديد صفوف التقرير (الكل / عدد / تحديد يدوي) ==================== */
let reportRowsModalMode = "create"; // create | edit
let reportRowsModalItems = [];

// الصفوف الفعلية الظاهرة في التقرير: كل الفحوصات أو مجموعة محددة حسب المعرّف
function getReportView(p, report) {
  const all = report.items || [];
  const ids = Array.isArray(report.visibleItemIds) ? report.visibleItemIds : null;
  const items = ids ? all.filter((it) => ids.includes(it.id)) : all;
  return { items, totals: computeTotals(items) };
}

function visibleRowsBadge(report) {
  const total = (report.items || []).length;
  const shown = getReportView(null, report).items.length;
  if (shown >= total) return `<span class="rr-rows-badge all">جميع الفحوصات (${total})</span>`;
  return `<span class="rr-rows-badge">يظهر ${shown} من ${total}</span>`;
}

function openReportRowsModal(projectId, reportId) {
  const p = getProjectById(projectId);
  if (!p) return;
  const report = reportId ? p.reports.find((x) => x.id === reportId) : null;
  if (reportId && !report) return;

  reportRowsModalMode = report ? "edit" : "create";
  reportRowsModalItems = report ? report.items : p.logItems;
  if (!reportRowsModalItems.length) {
    alert("لا توجد فحوصات متاحة لتحديد صفوف التقرير.");
    return;
  }

  document.getElementById("reportRowsProjectId").value = p.id;
  document.getElementById("reportRowsReportId").value = report ? report.id : "";
  document.getElementById("reportRowsModalTitle").textContent = report
    ? `تحديد صفوف التقرير — ${report.reportNo}`
    : `تحديد فحوصات التقرير الجديد — ${p.name}`;
  document.getElementById("reportRowsConfirmBtn").textContent = report ? "💾 حفظ الصفوف المحددة" : "📄 إنشاء التقرير";

  const total = reportRowsModalItems.length;
  const visibleIds = report
    ? (Array.isArray(report.visibleItemIds) ? report.visibleItemIds : reportRowsModalItems.map((x) => x.id))
    : reportRowsModalItems.map((x) => x.id);
  const mode = visibleIds.length >= total ? "all" : "manual";
  const radio = document.querySelector(`input[name="reportRowsMode"][value="${mode}"]`);
  if (radio) radio.checked = true;
  const firstInput = document.getElementById("reportRowsFirstCount");
  if (firstInput) { firstInput.max = String(total); firstInput.value = String(Math.min(visibleIds.length || 1, total)); }

  renderReportRowsList(visibleIds);
  updateReportRowsCount();
  document.getElementById("reportRowsModal").classList.remove("hidden");
}

function renderReportRowsList(selectedIds) {
  const list = document.getElementById("reportRowsList");
  if (!list) return;
  list.innerHTML = `
    <table class="data-table report-rows-table">
      <thead><tr><th style="width:44px;">✔</th><th>#</th><th>الموقع / العينة</th><th>الطبقة</th><th>الفحص المخبري</th><th>الحسم الكلي</th></tr></thead>
      <tbody>
        ${reportRowsModalItems.map((it, idx) => `
          <tr>
            <td><input type="checkbox" class="report-row-check" data-item-id="${escHTML(it.id)}" ${selectedIds.includes(it.id) ? "checked" : ""} onchange="onReportRowCheckboxChange()" aria-label="تحديد الفحص ${idx + 1}" /></td>
            <td>${idx + 1}</td>
            <td><strong>${escHTML(it.location)}</strong></td>
            <td>${escHTML(tableRefText(it))}</td>
            <td>${escHTML(it.itemName)}</td>
            <td><span class="rp-num">${formatMoney(it.totalDeduction)}</span></td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}

function applyReportRowsMode() {
  const checkedRadio = document.querySelector('input[name="reportRowsMode"]:checked');
  const mode = checkedRadio ? checkedRadio.value : "all";
  const boxes = Array.from(document.querySelectorAll(".report-row-check"));
  if (mode === "all") {
    boxes.forEach((b) => { b.checked = true; });
  } else if (mode === "first") {
    const count = Math.max(1, Math.min(reportRowsModalItems.length, Number(document.getElementById("reportRowsFirstCount").value) || 1));
    boxes.forEach((b, i) => { b.checked = i < count; });
  }
  updateReportRowsCount();
}

function onReportRowCheckboxChange() {
  const manual = document.querySelector('input[name="reportRowsMode"][value="manual"]');
  if (manual) manual.checked = true;
  updateReportRowsCount();
}

function updateReportRowsCount() {
  const boxes = Array.from(document.querySelectorAll(".report-row-check"));
  const count = boxes.filter((b) => b.checked).length;
  const label = document.getElementById("reportRowsCount");
  if (label) label.textContent = `المحدد: ${count} من ${reportRowsModalItems.length} فحص`;
  const confirm = document.getElementById("reportRowsConfirmBtn");
  if (confirm) confirm.disabled = count === 0;
}

function getSelectedReportRowIds() {
  return Array.from(document.querySelectorAll(".report-row-check"))
    .filter((b) => b.checked)
    .map((b) => b.dataset.itemId);
}

function closeReportRowsModal() {
  const modal = document.getElementById("reportRowsModal");
  if (modal) modal.classList.add("hidden");
}

function confirmReportRows() {
  const p = getProjectById(document.getElementById("reportRowsProjectId").value);
  if (!p) return;
  const selectedIds = getSelectedReportRowIds();
  if (!selectedIds.length) {
    alert("يرجى تحديد فحص واحد على الأقل لظهوره في التقرير.");
    return;
  }

  const reportId = document.getElementById("reportRowsReportId").value;
  const report = reportId ? p.reports.find((x) => x.id === reportId) : null;
  if (report) {
    report.visibleItemIds = selectedIds.length >= report.items.length ? null : selectedIds;
    saveProjectsState();
    renderProjectsList();
    renderProjectWorkspace(p);
    if (currentPrintReportId === report.id) {
      currentPrintReportHTML = buildReportHTML(p, report);
      const content = document.getElementById("reportModalContent");
      if (content) content.innerHTML = currentPrintReportHTML;
    }
    closeReportRowsModal();
    return;
  }

  const items = p.logItems.filter((it) => selectedIds.includes(it.id));
  if (createProjectReportFromItems(p, items)) closeReportRowsModal();
}

function createProjectReportFromItems(p, items) {
  if (!p || !items || !items.length) return false;
  const selectedIds = items.map((it) => it.id);
  const totals = computeTotals(items);
  const duplicateReport = findDuplicateReport(p, items, totals);
  if (duplicateReport) {
    alert(
      `تنبيه: يوجد تقرير مطابق مسجل مسبقاً بنفس الفحوصات والإجماليات:\n` +
      `رقم التقرير: ${duplicateReport.reportNo}\nالتاريخ: ${ltrDate(duplicateReport.date)}\n` +
      `لم يتم إنشاء تقرير مكرر. عدّل السجل أو احذف التقرير السابق إذا كنت تريد تقريراً جديداً.`
    );
    return false;
  }

  const serial = p.nextReportSerial++;
  const report = {
    id: `rpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    serialNumber: serial,
    reportNo: `${p.projectNo}/تقرير/${String(serial).padStart(3, "0")}`,
    title: "تقرير الحسميات والشذوذات المخبرية",
    date: todayDateStr(),
    items: JSON.parse(JSON.stringify(p.logItems)),
    totals,
    visibleItemIds: selectedIds.length >= p.logItems.length ? null : selectedIds
  };

  p.reports.push(report);
  saveProjectsState();
  renderProjectsList();
  renderProjectWorkspace(p);
  openReportModal(p.id, report.id);
  return true;
}

function buildReportHTML(p, report) {
  const view = getReportView(p, report);
  const t = view.totals;
  const emblemSVG = getReportEmblemHTML();
  const sig = getSignatureFlags(report);
  const signatureBlocks = [];
  if (sig.engineer) {
    signatureBlocks.push(`
      <div>
        <div>أعدّ التقرير</div>
        <div class="rp-sig-line"><strong>مهندس المختبر / مختبر الطرق</strong><div>الاسم: .................................</div></div>
      </div>`);
  }
  if (sig.head) {
    signatureBlocks.push(`
      <div>
        <div>تدقيق ومراجعة</div>
        <div class="rp-sig-line"><strong>رئيس قسم مختبر مديرية أشغال محافظة مأدبا</strong><div>الاسم: م.براءة الغليلات</div></div>
      </div>`);
  }
  if (sig.director) {
    signatureBlocks.push(`
      <div>
        <div>وافق</div>
        <div class="rp-sig-line"><strong>مدير أشغال محافظة مأدبا</strong><div>الاسم: .................................</div></div>
      </div>`);
  }
  const signaturesHTML = signatureBlocks.length
    ? `<div class="rp-signatures" style="grid-template-columns:repeat(${signatureBlocks.length}, 1fr);">${signatureBlocks.join("")}</div>`
    : "";

  return `
  <div class="report-paper">
    <div class="rp-official-header">
      <div class="rp-emblem">${emblemSVG}</div>
      <div class="rp-header-center">
        <div class="rp-kingdom">المملكة الأردنية الهاشمية</div>
        <div class="rp-ministry">وزارة الأشغال العامة والإسكان</div>
        <div class="rp-directorate">مديرية أشغال محافظة مأدبا</div>
        <div class="rp-kingdom">المختبر المركزي-الحسميات والشذوذات</div>
      </div>
      <div class="rp-ref-box">
        <div>رقم التقرير: <span dir="ltr">${escHTML(report.reportNo)}</span></div>
        <div>التسلسل: (${report.serialNumber})</div>
        <div>التاريخ: <input type="text" class="rp-date-input" dir="ltr" data-date-kind="report" data-project-id="${escHTML(p.id)}" data-report-id="${escHTML(report.id)}" value="${escHTML(formatDate(report.date))}" onchange="updateReportDate(this)" title="بصيغة يوم/شهر/سنة — مثال: 1/9/2026" /></div>
        <div>رقم المشروع: <span dir="ltr">${escHTML(p.projectNo)}</span></div>
      </div>
    </div>

    <div class="rp-title">تقرير الحسميات والشذوذات المخبرية</div>
    <div class="rp-subtitle">مُعدّ وفق أسس القبول والقبول مع الحسم والرفض لمشاريع الطرق — الإصدار 2023 م (البند 2.0، صفحة 16–17)</div>

    <div class="rp-section-title">أولاً: بيانات المشروع</div>
    <div class="rp-meta-grid">
      <div class="rp-meta-item"><strong>اسم المشروع:</strong><span>${escHTML(p.name)}</span></div>
      <div class="rp-meta-item"><strong>رقم المشروع:</strong><span dir="ltr">${escHTML(p.projectNo)}</span></div>
      <div class="rp-meta-item"><strong>المقاول:</strong><span>${escHTML(p.contractor || "---")}</span></div>
      <div class="rp-meta-item"><strong>نوع العينة:</strong><span>${escHTML(p.sampleType || "---")}</span></div>
      <div class="rp-meta-item"><strong>الموقع:</strong><span>${escHTML(p.location || "---")}</span></div>
      <div class="rp-meta-item"><strong>طول المشروع:</strong><span>${escHTML(p.lengthKm || "---")}</span></div>
    </div>

    <div class="rp-section-title">ثانياً: جدول الفحوصات والحسميات المالية</div>
    <table class="rp-table">
      <thead>
        <tr>
          <th>#</th>
          <th>الموقع / العينة</th>
          <th>الطبقة (الجدول)</th>
          <th>الفحص المخبري</th>
          <th>قيمة الأعمال (ك×س)<br/>د.أ</th>
          <th>ق1<br/>التنفيذ</th>
          <th>ق2<br/>ضبط الجودة</th>
          <th>ق3<br/>الاستلام</th>
          <th>الحسم الكلي<br/>د.أ</th>
          <th>القرار</th>
        </tr>
      </thead>
      <tbody>
        ${view.items
          .map(
            (it, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${escHTML(it.location)}</td>
            <td>${escHTML(tableRefText(it))}</td>
            <td>${escHTML(it.itemName)}</td>
            <td><span class="rp-num">${formatMoney(it.totalWorkValue)}</span></td>
            <td><span class="rp-num">${formatMoney(it.q1)}</span></td>
            <td><span class="rp-num">${formatMoney(it.q2)}</span></td>
            <td><span class="rp-num">${formatMoney(it.q3)}</span></td>
            <td><strong><span class="rp-num">${formatMoney(it.totalDeduction)}</span></strong></td>
            <td>${escHTML(it.finalDecision)}</td>
          </tr>
        `
          )
          .join("")}
        <tr style="background:#f1f5f9;font-weight:800;">
          <td colspan="4">الإجمالي العام</td>
          <td><span class="rp-num">${formatMoney(t.work)}</span></td>
          <td><span class="rp-num">${formatMoney(t.q1)}</span></td>
          <td><span class="rp-num">${formatMoney(t.q2)}</span></td>
          <td><span class="rp-num">${formatMoney(t.q3)}</span></td>
          <td><span class="rp-num">${formatMoney(t.deduction)}</span></td>
          <td>---</td>
        </tr>
      </tbody>
    </table>

    <div class="rp-summary-grid">
      <div class="rp-summary-box"><div class="rp-sum-label">حسم فحوصات التنفيذ (ق1)</div><div class="rp-sum-value">${formatMoney(t.q1)}</div></div>
      <div class="rp-summary-box"><div class="rp-sum-label">حسم ضبط الجودة (ق2)</div><div class="rp-sum-value">${formatMoney(t.q2)}</div></div>
      <div class="rp-summary-box"><div class="rp-sum-label">حسم لجنة الاستلام (ق3)</div><div class="rp-sum-value">${formatMoney(t.q3)}</div></div>
      <div class="rp-summary-box grand"><div class="rp-sum-label">إجمالي الحسم (ق.ك)</div><div class="rp-sum-value">${formatMoney(t.deduction)} د.أ</div></div>
    </div>

    <div class="rp-note-official"><strong>ملاحظة:</strong> الكميات كما وردتنا من قسم المساحة والدراسات</div>

    ${signaturesHTML}

    <div class="rp-footer">
      مديرية أشغال محافظة مأدبا — المختبر المركزي-الحسميات والشذوذات — وزارة الأشغال العامة والإسكان | رقم التقرير: ${escHTML(report.reportNo)} | صفحة 1 من 1
    </div>
  </div>`;
}

function openReportModal(projectId, reportId) {
  const p = getProjectById(projectId);
  if (!p) return;
  const r = p.reports.find((x) => x.id === reportId);
  if (!r) return;

  currentPrintProjectId = projectId;
  currentPrintReportId = reportId;
  currentPrintReportHTML = buildReportHTML(p, r);
  document.getElementById("reportModalContent").innerHTML = currentPrintReportHTML;
  document.getElementById("reportModalTitle").textContent = `${p.name} — ${r.reportNo}`;
  const sigBar = document.getElementById("reportSignatureOptions");
  if (sigBar) sigBar.innerHTML = signatureOptionsHTML(p.id, r.id, getSignatureFlags(r));
  document.getElementById("reportModal").classList.remove("hidden");
}

function closeReportModal() {
  document.getElementById("reportModal").classList.add("hidden");
}

// قياس ارتباط الطباعة الفعلي (بما فيه قواعد @media print) وتصغير التقرير إن لزم ليكمل في صفحة A4 واحدة
function fitReportToSinglePage() {
  const container = document.getElementById("printReportContainer");
  if (!container) return;
  const paper = container.querySelector(".report-paper");
  if (!paper) return;
  paper.style.zoom = "1";

  let compactCSS = "";
  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules; // قد تكون ورقة أنماط خارجية محمية
    } catch (e) {
      continue;
    }
    for (const rule of rules || []) {
      if (rule.type === CSSRule.MEDIA_RULE && /print/.test(rule.conditionText || "")) {
        compactCSS += Array.from(rule.cssRules).map((r) => r.cssText).join("\n");
      }
    }
  }
  const measureStyle = document.createElement("style");
  measureStyle.id = "printMeasureStyle";
  measureStyle.textContent = compactCSS;
  document.head.appendChild(measureStyle);

  const previous = {
    display: container.style.display,
    position: container.style.position,
    left: container.style.left,
    top: container.style.top,
    width: container.style.width,
    maxWidth: container.style.maxWidth
  };
  // عرض الطباعة الحقيقي داخل A4: 210 مم - 8 مم هوامش من كل جانب = 194 مم ≈ 733px
  container.style.display = "block";
  container.style.position = "absolute";
  container.style.left = "-99999px";
  container.style.top = "0";
  container.style.width = "733px";
  container.style.maxWidth = "none";
  const heightPx = paper.getBoundingClientRect().height;
  Object.assign(container.style, previous);
  measureStyle.remove();

  // ارتفاع المساحة المتاحة داخل A4 بعد هوامش 8 مم = 281 مم
  const availablePx = (281 * 96) / 25.4;
  if (heightPx > availablePx) {
    paper.style.zoom = String(Math.max(0.35, Math.floor((availablePx / heightPx) * 100) / 100));
  }
}

// مستمع afterprint العام في التهيئة يفرغ حاوية الطباعة بالكامل، فيُزال معها التكبير تلقائياً
function prepareReportPrint() {
  fitReportToSinglePage();
}

function printReportFromModal() {
  document.getElementById("printReportContainer").innerHTML = currentPrintReportHTML;
  prepareReportPrint();
  window.print();
}

function printProjectReport(projectId, reportId) {
  const p = getProjectById(projectId);
  if (!p) return;
  const r = p.reports.find((x) => x.id === reportId);
  if (!r) return;
  document.getElementById("printReportContainer").innerHTML = buildReportHTML(p, r);
  prepareReportPrint();
  window.print();
}

/* ==================== تصدير التقرير إلى Excel و Word ==================== */
function safeFileName(value) {
  return String(value || "report").replace(/[^\w\u0600-\u06FF-]+/g, "_").replace(/^_+|_+$/g, "");
}

function downloadTextFile(content, mimeType, fileName) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getReportOrNull(projectId, reportId) {
  const p = getProjectById(projectId);
  if (!p) return null;
  const r = p.reports.find((x) => x.id === reportId);
  return r ? { project: p, report: r } : null;
}

// تصدير Office 2010 حقيقي (xlsx/docx) بنفس ترتيب وتصميم زر «عرض التقرير»
function exportReportExcel(projectId, reportId) {
  const data = getReportOrNull(projectId, reportId);
  if (!data) return;
  downloadBlobFile(
    buildXlsx(data.project, data.report),
    safeFileName(data.report.reportNo) + ".xlsx"
  );
}

function exportReportWord(projectId, reportId) {
  const data = getReportOrNull(projectId, reportId);
  if (!data) return;
  downloadBlobFile(
    buildDocx(data.project, data.report),
    safeFileName(data.report.reportNo) + ".docx"
  );
}

function exportCurrentReportExcel() {
  if (currentPrintProjectId && currentPrintReportId) exportReportExcel(currentPrintProjectId, currentPrintReportId);
}

function exportCurrentReportWord() {
  if (currentPrintProjectId && currentPrintReportId) exportReportWord(currentPrintProjectId, currentPrintReportId);
}

/* ==================== تصدير الكشف التراكمي للمشروع النشط ==================== */
function getLogExportData() {
  const p = getActiveProject();
  if (!p) {
    alert("لا يوجد مشروع نشط. افتح مشروعاً من تبويب «إدارة المشاريع» أولاً.");
    return null;
  }
  if (!p.logItems.length) {
    alert("الكشف التراكمي فارغ. أضف فحوصات من الحاسبة أولاً.");
    return null;
  }
  return { project: p, totals: computeTotals(p.logItems), date: formatDate(p.logDate || todayDateStr()) };
}

function buildProjectLogTableHTML(items, totals, forExcel = false) {
  const num = (v) => (Number(v) || 0).toFixed(3);
  const nStyle = forExcel ? `mso-number-format:'0.000';text-align:right;` : `text-align:right;`;
  const rows = items
    .map(
      (it, idx) => `
    <tr>
      <td style="text-align:center;">${idx + 1}</td>
      <td>${escHTML(it.location)}</td>
      <td style="text-align:center;">${escHTML(it.tableNum)}${it.tableLabel ? ` ${escHTML(it.tableLabel)}` : ""}</td>
      <td>${escHTML(it.itemName)}</td>
      <td style="text-align:center;">${escHTML(it.unit)}</td>
      <td style="${nStyle}">${num(it.repQty)}</td>
      <td style="${nStyle}">${num(it.unitPrice)}</td>
      <td style="${nStyle}">${num(it.totalWorkValue)}</td>
      <td style="${nStyle}">${num(it.q1)}</td>
      <td style="${nStyle}">${num(it.q2)}</td>
      <td style="${nStyle}">${num(it.q3)}</td>
      <td style="${nStyle};font-weight:bold;">${num(it.totalDeduction)}</td>
      <td>${escHTML(it.finalDecision)}</td>
    </tr>`
    )
    .join("");

  const widths = [3, 13, 6, 18, 5, 6, 6, 8, 6, 6, 6, 9, 8];
  const colgroup = `<colgroup>${widths.map((w) => `<col style="width:${w}%" />`).join("")}</colgroup>`;

  return `
  <table class="log-table">
    ${colgroup}
    <thead>
      <tr>
        <th>#</th><th>الموقع / العينة</th><th>الجدول</th><th>الفحص المخبري</th><th>الوحدة</th>
        <th>الكمية (ك)</th><th>السعر (س)</th><th>قيمة الأعمال (ك×س)</th>
        <th>ق1 التنفيذ</th><th>ق2 ضبط الجودة</th><th>ق3 الاستلام</th><th>الحسم الكلي (ق.ك)</th><th>القرار</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr class="log-total">
        <td colspan="7"><strong>الإجمالي العام لحسميات المشروع</strong></td>
        <td style="${nStyle}">${num(totals.work)}</td>
        <td style="${nStyle}">${num(totals.q1)}</td>
        <td style="${nStyle}">${num(totals.q2)}</td>
        <td style="${nStyle}">${num(totals.q3)}</td>
        <td style="${nStyle};font-weight:bold;">${num(totals.deduction)}</td>
        <td>${totals.rejectedCount > 0 ? `${totals.rejectedCount} فحص خارج الحدود` : "لا يوجد فحص خارج حدود الحسم"}</td>
      </tr>
    </tfoot>
  </table>`;
}

function buildProjectLogDocumentHTML(p, totals, date) {
  const logoSrc = getAppLogoSrc();
  return `
  <div class="report-paper">
    <div class="rp-official-header">
      <div class="rp-emblem">${logoSrc ? `<img src="${logoSrc}" alt="شعار الوزارة" class="report-logo-img" />` : ""}</div>
      <div class="rp-header-center">
        <div class="rp-kingdom">المملكة الأردنية الهاشمية</div>
        <div class="rp-ministry">وزارة الأشغال العامة والإسكان</div>
        <div class="rp-directorate">مديرية أشغال محافظة مأدبا</div>
        <div class="rp-kingdom">المختبر المركزي-الحسميات والشذوذات</div>
      </div>
      <div class="rp-ref-box">
        <div>رقم المشروع: <span dir="ltr">${escHTML(p.projectNo)}</span></div>
        <div>التاريخ: ${escHTML(ltrDate(date))}</div>
        <div>عدد الفحوصات: ${p.logItems.length}</div>
      </div>
    </div>
    <div class="rp-title">الكشف التراكمي لحسميات المشروع</div>
    <div class="rp-subtitle">${escHTML(p.name)} — مُعدّ وفق كُتيب أسس القبول والقبول مع الحسم والرفض لمشاريع الطرق (إصدار 2023 م)</div>
    <div class="rp-meta-grid">
      <div class="rp-meta-item"><strong>المقاول:</strong><span>${escHTML(p.contractor || "---")}</span></div>
      <div class="rp-meta-item"><strong>نوع العينة:</strong><span>${escHTML(p.sampleType || "---")}</span></div>
      <div class="rp-meta-item"><strong>الموقع:</strong><span>${escHTML(p.location || "---")}</span></div>
      <div class="rp-meta-item"><strong>طول المشروع:</strong><span>${escHTML(p.lengthKm || "---")}</span></div>
    </div>
    ${buildProjectLogTableHTML(p.logItems, totals)}
    <div class="rp-note-official"><strong>ملاحظة:</strong> الكميات كما وردتنا من قسم المساحة والدراسات</div>
    <div class="rp-signatures rp-signatures-single">
      <div>
        <div>تدقيق ومراجعة</div>
        <div class="rp-sig-line"><strong>رئيس قسم مختبر مديرية أشغال محافظة مأدبا</strong><div>الاسم: م.براءة الغليلات</div></div>
      </div>
    </div>
    <div class="rp-footer">مديرية أشغال محافظة مأدبا — المختبر المركزي-الحسميات والشذوذات — الكشف التراكمي ${escHTML(p.projectNo)}</div>
  </div>`;
}

function exportProjectLogExcel() {
  const data = getLogExportData();
  if (!data) return;
  const { project: p, totals, date } = data;
  const logoSrc = getAppLogoSrc();
  const html = `\uFEFF<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>كشف تراكمي ${escHTML(p.projectNo)}</title>
  <style>
    body { font-family: Tahoma, Arial, sans-serif; direction: rtl; font-size: 10pt; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 10px; }
    td, th { border: 1px solid #777; padding: 5px; }
    th { background: #4338ca; color: #fff; font-weight: bold; font-size: 9pt; }
    .title { font-size: 14pt; font-weight: bold; text-align: center; background: #2b4922; color: #fff; }
    .sub { text-align: center; color: #475569; }
    .meta td { background: #f1f5f9; }
    .log-total td { background: #eef2ff; font-weight: bold; }
    .log-table { font-size: 9pt; table-layout: fixed; }
    .log-table th, .log-table td { white-space: normal; }
    .note { font-size: 9pt; color: #475569; }
  </style>
</head>
<body>
  <table>
    ${logoSrc ? `<tr><td colspan="13" style="text-align:center;background:#ffffff;padding:6px;"><img src="${logoSrc}" alt="شعار الوزارة" style="width:64px;height:64px;object-fit:contain;" /></td></tr>` : ""}
    <tr><td colspan="13" class="title">الكشف التراكمي لحسميات المشروع — مديرية أشغال محافظة مأدبا</td></tr>
    <tr><td colspan="13" class="sub">${escHTML(p.name)} | رقم المشروع: <span dir="ltr">${escHTML(p.projectNo)}</span> | التاريخ: ${escHTML(ltrDate(date))}</td></tr>
  </table>
  <table class="meta">
    <tr><td><strong>المقاول</strong></td><td>${escHTML(p.contractor || "---")}</td><td><strong>نوع العينة</strong></td><td>${escHTML(p.sampleType || "---")}</td><td><strong>الموقع</strong></td><td>${escHTML(p.location || "---")}</td></tr>
  </table>
  ${buildProjectLogTableHTML(p.logItems, totals, true)}
  <p class="note"><strong>ملاحظة:</strong> الكميات كما وردتنا من قسم المساحة والدراسات</p>
  <p class="note"><strong>تدقيق ومراجعة:</strong> رئيس قسم مختبر مديرية أشغال محافظة مأدبا — الاسم: م.براءة الغليلات</p>
</body>
</html>`;
  downloadTextFile(html, "application/vnd.ms-excel;charset=utf-8;", `${safeFileName(p.projectNo)}_كشف_تراكمي.xls`);
}

function exportProjectLogWord() {
  const data = getLogExportData();
  if (!data) return;
  const { project: p, totals, date } = data;
  const body = buildProjectLogDocumentHTML(p, totals, date);
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>كشف تراكمي ${escHTML(p.projectNo)}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: "Cairo", "Tajawal", Tahoma, Arial, sans-serif; font-size: 9pt; color: #111; }
    .report-paper { width: 100%; padding: 0; font-feature-settings: "locl" 0; }
    .rp-official-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #2b4922; padding-bottom: 10px; margin-bottom: 14px; }
    .rp-header-center { text-align: center; flex: 1; }
    .rp-ministry { font-size: 12pt; font-weight: 800; color: #2b4922; }
    .rp-directorate { font-size: 11pt; font-weight: 800; color: #9a7418; }
    .rp-ref-box { min-width: 150px; font-size: 8.5pt; border: 1px solid #94a3b8; padding: 6px 8px; }
    .rp-title { text-align: center; font-size: 14pt; font-weight: 800; text-decoration: underline; margin: 12px 0 6px; }
    .rp-subtitle { text-align: center; font-size: 9pt; color: #475569; margin-bottom: 12px; }
    .rp-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 8.5pt; margin-bottom: 12px; }
    .log-table { width: 100%; border-collapse: collapse; font-size: 7.5pt; table-layout: fixed; }
    .log-table th, .log-table td { border: 1px solid #94a3b8; padding: 4px 5px; text-align: center; white-space: normal; overflow-wrap: anywhere; }
    .log-table thead th { background: #4338ca; color: #fff; }
    .log-total td { background: #eef2ff; font-weight: bold; }
    .rp-note-official { font-size: 8.5pt; font-weight: 700; color: #1e3518; margin-top: 10px; padding: 6px 10px; border: 1px solid #94a3b8; background: #f8fafc; }
    .rp-signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 20px; font-size: 9pt; text-align: center; }
    .rp-signatures-single { grid-template-columns: 1fr; max-width: 45%; margin-inline-start: auto; }
    .rp-sig-line { border-top: 1px solid #334155; padding-top: 5px; margin-top: 18px; }
    .rp-footer { margin-top: 16px; border-top: 2px solid #2b4922; padding-top: 6px; text-align: center; font-size: 7.5pt; color: #475569; }
  </style>
</head>
<body>${body}</body>
</html>`;
  downloadTextFile("\uFEFF" + html, "application/msword;charset=utf-8;", `${safeFileName(p.projectNo)}_كشف_تراكمي.doc`);
}

function exportProjectLogCSV() {
  const data = getLogExportData();
  if (!data) return;
  const { project: p } = data;
  const cell = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
  const num = (v) => (Number(v) || 0).toFixed(3);
  const header = ["#", "الموقع/العينة", "الجدول", "الفحص", "الوحدة", "الكمية", "السعر", "قيمة الأعمال", "ق1 التنفيذ", "ق2 ضبط الجودة", "ق3 الاستلام", "الحسم الكلي", "القرار"];
  const rows = p.logItems.map((it, i) => [
    i + 1, it.location, tableRefText(it), it.itemName, it.unit,
    num(it.repQty), num(it.unitPrice), num(it.totalWorkValue),
    num(it.q1), num(it.q2), num(it.q3), num(it.totalDeduction), it.finalDecision
  ].map(cell).join(","));
  const t = computeTotals(p.logItems);
  const totalRow = ["", "الإجمالي العام", "", "", "", "", "", num(t.work), num(t.q1), num(t.q2), num(t.q3), num(t.deduction), ""].map(cell).join(",");
  const csv = "\uFEFF" + [header.map(cell).join(","), ...rows, totalRow].join("\r\n");
  downloadTextFile(csv, "text/csv;charset=utf-8;", `${safeFileName(p.projectNo)}_كشف_تراكمي.csv`);
}

function printProjectLog() {
  const data = getLogExportData();
  if (!data) return;
  const { project: p, totals, date } = data;
  document.getElementById("printReportContainer").innerHTML = buildProjectLogDocumentHTML(p, totals, date);
  prepareReportPrint();
  window.print();
}

function exportProjectData() {
  const p = getActiveProject();
  if (!p) {
    alert("لا يوجد مشروع نشط لتصديره.");
    return;
  }
  const payload = { project: p, exportedAt: new Date().toISOString(), source: "مديرية أشغال محافظة مأدبا" };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${p.projectNo.replace(/[^\w\u0600-\u06FF-]/g, "_")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importProjectData(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      const p = parsed.project || parsed;
      if (!p || !p.name || !Array.isArray(p.logItems)) throw new Error("صيغة ملف غير صحيحة");
      p.id = `prj_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      p.serialNumber = projectsState.nextProjectSerial++;
      p.projectNo = p.projectNo ? `${p.projectNo}/مستورد-${p.serialNumber}` : formatProjectNo(p.serialNumber, new Date().getFullYear());
      p.reports = Array.isArray(p.reports) ? p.reports : [];
      p.nextReportSerial = p.nextReportSerial || (p.reports.length + 1);
      projectsState.projects.push(p);
      projectsState.activeProjectId = p.id;
      saveProjectsState();
      renderProjectsList();
      refreshActiveProjectUI();
      showProjectWorkspaceView(p);
      alert("تم استيراد المشروع بنجاح.");
    } catch (err) {
      alert("تعذر استيراد الملف: " + err.message);
    }
    event.target.value = "";
  };
  reader.readAsText(file);
}

/* ==================== كشف الحسميات التراكمي — مرتبط بالمشروع النشط ==================== */
function getCurrentProjectLog() {
  const p = getActiveProject();
  return p ? p.logItems : [];
}

function pushResultToActiveProject(result) {
  if (!result) return;
  const p = getActiveProject();
  if (!p) {
    alert("يرجى إنشاء مشروع أو فتح مشروع موجود من تبويب «إدارة المشاريع» قبل إضافة الفحوصات.");
    switchToTab("tab-projects");
    return;
  }
  // تأكيد أخذ أحدث وصف للموقع حتى لو كُتب مباشرة قبل الضغط على الإضافة
  if (result === currentCalculationResult) syncSampleLocation();

  const duplicateItem = findDuplicateLogItem(p, result);
  if (duplicateItem) {
    alert(
      `تنبيه: هذا الحساب مكرر ومسجل مسبقاً في سجل المشروع «${p.name}»:\n` +
      `${duplicateResultLabel(result)}\n` +
      `لم تتم الإضافة. غيّر الموقع أو القيم إذا كان فحصاً مختلفاً، أو احذف السجل السابق أولاً.`
    );
    return;
  }
  p.logItems.push({ ...result, id: `itm_${Date.now()}_${Math.floor(Math.random() * 1000)}` });
  saveProjectsState();
  refreshActiveProjectUI();
  renderProjectWorkspace(p);
  renderProjectsList();
}

function addCurrentToProjectLog() {
  pushResultToActiveProject(currentCalculationResult);
}

function addCompactionResultToProjectLog() {
  pushResultToActiveProject(currentCompactionResult);
}

function removeProjectLogItem(id) {
  const p = getActiveProject();
  if (!p) return;
  p.logItems = p.logItems.filter((item) => item.id !== id);
  saveProjectsState();
  refreshActiveProjectUI();
  renderProjectWorkspace(p);
  renderProjectsList();
}

function clearProjectLog() {
  const p = getActiveProject();
  if (!p) {
    alert("لا يوجد مشروع نشط.");
    return;
  }
  clearActiveProjectLog();
}

function clearActiveProjectLog() {
  const p = getActiveProject();
  if (!p) return;
  if (!confirm(`هل تريد مسح جميع الفحوصات المسجلة في سجل المشروع «${p.name}»؟`)) return;
  p.logItems = [];
  saveProjectsState();
  refreshActiveProjectUI();
  renderProjectWorkspace(p);
  renderProjectsList();
}

function autoSizeLogTextarea(el) {
  if (!el || el.tagName !== "TEXTAREA") return;
  const fit = () => Math.max(72, Math.min(220, el.scrollHeight)) + "px";
  el.style.height = "auto";
  el.style.height = fit();
  // قياس ثانٍ بعد تثبيت الارتفاع؛ بعض المتصفحات تُعيد حساب التفاف النص في هذه الحالة
  if (el.scrollHeight > el.clientHeight + 1) el.style.height = fit();
}

function autoSizeLogTextareas() {
  const resize = () => document.querySelectorAll("#projectLogTbody textarea.cell-textarea").forEach(autoSizeLogTextarea);
  resize();
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(resize);
}

function renderProjectLogTable() {
  const tbody = document.getElementById("projectLogTbody");
  const tfoot = document.getElementById("projectLogTfoot");
  if (!tbody || !tfoot) return;
  const logItems = getCurrentProjectLog();
  const activeProject = getActiveProject();

  if (logItems.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="11">${
          activeProject
            ? `سجل المشروع «${escHTML(activeProject.name)}» فارغ. أضف الفحوصات من الحاسبة أعلاه.`
            : "لا يوجد مشروع نشط. أنشئ مشروعاً من تبويب «إدارة المشاريع» أولاً."
        }</td>
      </tr>
    `;
    tfoot.classList.add("hidden");
    return;
  }

  const nv = (v) => String(Number(v) || 0);
  const badgeStyle = (decision, deduction) =>
    /مرفوض/.test(decision || "")
      ? "padding:3px 8px;border-radius:6px;font-size:0.78rem;font-weight:700;background:#fee2e2;color:#b91c1c"
      : (Number(deduction) || 0) > 0
      ? "padding:3px 8px;border-radius:6px;font-size:0.78rem;font-weight:700;background:#fef3c7;color:#b45309"
      : "padding:3px 8px;border-radius:6px;font-size:0.78rem;font-weight:700;background:#dcfce7;color:#15803d";

  tbody.innerHTML = logItems
    .map((row, idx) => {
      const id = escHTML(row.id);
      const textInput = (field, value, title, multiline = false) => {
        const attrs = `data-log-id="${id}" data-field="${field}" title="${escHTML(title)}"`;
        return multiline
          ? `<textarea rows="3" class="cell-edit-input cell-textarea" ${attrs}>${escHTML(value)}</textarea>`
          : `<input type="text" class="cell-edit-input" ${attrs} value="${escHTML(value)}" />`;
      };
      const numInput = (field, value, title) =>
        `<input type="text" inputmode="decimal" lang="en" dir="ltr" class="cell-edit-input cell-num" data-log-id="${id}" data-field="${field}" value="${nv(value)}" title="${title}" />`;

      return `
        <tr data-log-row="${id}">
          <td>${idx + 1}</td>
          <td>${textInput("location", row.location, "تعديل الموقع / العينة", true)}</td>
          <td>${textInput("tableNum", row.tableNum, "تعديل رقم الجدول")}${row.tableLabel ? `<span class="cell-edit-hint">${escHTML(row.tableLabel)}</span>` : ""}</td>
          <td>${textInput("itemName", row.itemName, "تعديل اسم الفحص", true)}</td>
          <td>
            <div class="cell-pair">
              <div class="cell-pair-row">
                ${numInput("repQty", row.repQty, "الكمية الممثلة")}
                <span>×</span>
                ${numInput("unitPrice", row.unitPrice, "سعر الوحدة")}
              </div>
              <span class="cell-computed" data-computed="work">${formatMoney(row.totalWorkValue)} د.أ</span>
            </div>
          </td>
          <td>${numInput("q1", row.q1, "حسم التنفيذ (ق1)")}</td>
          <td>${numInput("q2", row.q2, "حسم ضبط الجودة (ق2)")}</td>
          <td>${numInput("q3", row.q3, "حسم الاستلام (ق3)")}</td>
          <td><span class="cell-computed" data-computed="deduction"><strong>${formatMoney(row.totalDeduction)} د.أ</strong></span></td>
          <td>
            ${textInput("finalDecision", row.finalDecision, "تعديل القرار النهائي", true)}
            <span class="cell-edit-hint" data-computed="decision" style="${badgeStyle(row.finalDecision, row.totalDeduction)}">${escHTML(row.finalDecision)}</span>
          </td>
          <td class="no-print">
            <button type="button" class="btn-remove-core" onclick="removeProjectLogItem('${row.id}')" title="حذف">🗑️</button>
          </td>
        </tr>
      `;
    })
    .join("");

  autoSizeLogTextareas();
  updateLogFooterFromInputs();
  tfoot.classList.remove("hidden");
}

/* ---------- التحرير المباشر داخل كشف الحسميات التراكمي ---------- */
function readLogRowValues(tr) {
  const get = (field) => {
    const el = tr.querySelector(`[data-field="${field}"]`);
    return el ? el.value : "";
  };
  const n = (field) => Number(get(field)) || 0;
  return {
    location: get("location"),
    tableNum: get("tableNum"),
    itemName: get("itemName"),
    repQty: n("repQty"),
    unitPrice: n("unitPrice"),
    q1: n("q1"),
    q2: n("q2"),
    q3: n("q3"),
    finalDecision: get("finalDecision")
  };
}

function logDecisionBadgeStyle(decision, deduction) {
  if (/مرفوض/.test(decision || "")) {
    return "padding:3px 8px;border-radius:6px;font-size:0.78rem;font-weight:700;background:#fee2e2;color:#b91c1c";
  }
  if ((Number(deduction) || 0) > 0) {
    return "padding:3px 8px;border-radius:6px;font-size:0.78rem;font-weight:700;background:#fef3c7;color:#b45309";
  }
  return "padding:3px 8px;border-radius:6px;font-size:0.78rem;font-weight:700;background:#dcfce7;color:#15803d";
}

// تحديث المجاميع مباشرة أثناء الكتابة دون إعادة بناء الجدول (حتى لا يُفقد التركيز)
function updateLogFooterFromInputs() {
  const tbody = document.getElementById("projectLogTbody");
  if (!tbody) return;
  let work = 0;
  let q1 = 0;
  let q2 = 0;
  let q3 = 0;
  tbody.querySelectorAll("tr[data-log-row]").forEach((tr) => {
    const v = readLogRowValues(tr);
    work += v.repQty * v.unitPrice;
    q1 += v.q1;
    q2 += v.q2;
    q3 += v.q3;
  });
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = `${formatMoney(val)} د.أ`;
  };
  set("logTotalWorkValue", work);
  set("logTotalQ1", q1);
  set("logTotalQ2", q2);
  set("logTotalQ3", q3);
  set("logGrandTotal", q1 + q2 + q3);
}

function onProjectLogCellInput(event) {
  const input = event.target.closest("[data-log-id][data-field]");
  if (!input) return;
  const tr = input.closest("tr");
  if (!tr) return;
  autoSizeLogTextarea(input);
  const vals = readLogRowValues(tr);
  const work = vals.repQty * vals.unitPrice;
  const deduction = vals.q1 + vals.q2 + vals.q3;

  const workCell = tr.querySelector('[data-computed="work"]');
  if (workCell) workCell.textContent = `${formatMoney(work)} د.أ`;
  const dedCell = tr.querySelector('[data-computed="deduction"]');
  if (dedCell) dedCell.innerHTML = `<strong>${formatMoney(deduction)} د.أ</strong>`;
  const decCell = tr.querySelector('[data-computed="decision"]');
  if (decCell) {
    decCell.textContent = vals.finalDecision;
    decCell.style.cssText = logDecisionBadgeStyle(vals.finalDecision, deduction);
  }
  updateLogFooterFromInputs();
}

// الحفظ النهائي عند مغادرة الخلية: تحديث البيانات + فحص التكرار + إعادة الرسم
function onProjectLogCellChange(event) {
  const input = event.target.closest("[data-log-id][data-field]");
  if (!input) return;
  const p = getActiveProject();
  if (!p) return;
  const item = p.logItems.find((x) => x.id === input.dataset.logId);
  if (!item) return;
  const tr = input.closest("tr");
  if (!tr) return;

  const snapshot = { ...item };
  const vals = readLogRowValues(tr);
  Object.assign(item, vals, {
    totalWorkValue: vals.repQty * vals.unitPrice,
    q1: vals.q1,
    q2: vals.q2,
    q3: vals.q3,
    totalDeduction: vals.q1 + vals.q2 + vals.q3,
    anyRejected: /مرفوض/.test(vals.finalDecision || "")
  });

  const duplicate = findDuplicateLogItem(p, item, item.id);
  if (duplicate) {
    Object.assign(item, snapshot);
    alert(
      `تنبيه: التعديل مطابق لفحص مسجل مسبقاً في سجل المشروع «${p.name}»:\n` +
      `${duplicateResultLabel(item)}\n` +
      `لم يتم حفظ التعديل. غيّر القيم أو احذف السجل المكرر أولاً.`
    );
    renderProjectLogTable();
    return;
  }

  saveProjectsState();
  renderProjectLogTable();
  renderProjectWorkspace(p);
  renderProjectsList();
  updateDuplicateWarningBanner();
}

// ==================== 2ب. كورات السماكة حسب المرحلة (تنفيذ / ضبط جودة) ====================
// القاعدة: أقصى نقص مسموح = 10% من السماكة (5 مم لطبقة 5 سم)، وما زاد مرفوض بدون حسم.
// number of exempt cores = ceil(10% of stage cores) — يُعفى أعلى شذوذ أولاً، والباقي يُحسم بكامل نقصه.
let execStageCoresState = [
  { id: 1, label: "كور رقم (1)", readingCm: 4.7 },
  { id: 2, label: "كور رقم (2)", readingCm: 4.5 }
];
let qcStageCoresState = [
  { id: 1, label: "كور رقم (1)", readingCm: 4.7 },
  { id: 2, label: "كور رقم (2)", readingCm: 4.5 }
];
let currentExecStageCoresResult = null;
let currentQcStageCoresResult = null;

function stageCoresPrefix(stage) {
  return stage === "exec" ? "execStage" : "qcStage";
}

function getStageCoresState(stage) {
  return stage === "exec" ? execStageCoresState : qcStageCoresState;
}

function renderStageCoresInputs(stage) {
  const container = document.getElementById(stageCoresPrefix(stage) + "CoresList");
  if (!container) return;
  container.innerHTML = getStageCoresState(stage)
    .map(
      (core, idx) => `
      <div class="core-item-box">
        <div class="core-item-top">
          <span>${core.label || `كور رقم (${idx + 1})`}</span>
          <button type="button" class="btn-remove-core" onclick="removeStageCore('${stage}', ${idx})" title="حذف الكور">✖</button>
        </div>
        <label style="font-size:0.78rem;color:#475569;">السماكة المقاسة (سم):</label>
        <input type="text" inputmode="decimal" lang="en" dir="ltr" class="form-control" value="${core.readingCm}" step="0.1" min="0" oninput="updateStageCoreVal('${stage}', ${idx}, this.value)" />
      </div>`
    )
    .join("");
}

function addStageCore(stage) {
  const list = getStageCoresState(stage);
  list.push({ id: Date.now(), label: `كور رقم (${list.length + 1})`, readingCm: 4.7 });
  renderStageCoresInputs(stage);
  calculateStageCores();
}

function updateStageCoreVal(stage, idx, val) {
  const core = getStageCoresState(stage)[idx];
  if (!core) return;
  core.readingCm = parseFloat(val) || 0;
  calculateStageCores();
}

function removeStageCore(stage, idx) {
  const list = getStageCoresState(stage);
  if (list.length <= 1) return;
  list.splice(idx, 1);
  renderStageCoresInputs(stage);
  calculateStageCores();
}

function evaluateStageCores(stage) {
  const prefix = stageCoresPrefix(stage);
  const reqThick = Math.max(0.5, parseFloat(document.getElementById(prefix + "ReqThick").value) || 5);
  const totalCores = Math.max(0, parseInt(document.getElementById(prefix + "TotalCores").value, 10) || 0);
  // المساحة الممثلة للكور = المساحة الكلية ÷ عدد كورات المرحلة
  const totalArea = Math.max(0, parseFloat(document.getElementById("stageTotalAreaInput").value) || 0);
  const area = totalCores > 0 ? totalArea / totalCores : 0;
  const price = Math.max(0, parseFloat(document.getElementById("stageCorePriceInput").value) || 0);

  // حد النقص الأقصى مع حسم = 10% من السماكة المطلوبة (5 مم لطبقة 5 سم)
  const maxDefCm = Math.round(reqThick * 0.10 * 1000) / 1000;
  // حصة الإعفاء = 10% من إجمالي كورات المرحلة، مع التقريب لأكبر عدد صحيح
  const rawQuota = totalCores * 0.10;
  const exemptQuota = Math.max(0, Math.ceil(rawQuota - 1e-9));

  const cores = getStageCoresState(stage).map((c, index) => ({
    ...c,
    index,
    defCm: Math.max(0, Math.round((reqThick - c.readingCm) * 1000) / 1000)
  }));

  // ترتيب الكورات الناقصة تنازلياً: أعلى شذوذ يُعفى أولاً
  const deficient = cores.filter((c) => c.defCm > 1e-9 && c.defCm <= maxDefCm + 1e-9);
  const sortedDesc = [...deficient].sort((a, b) => b.defCm - a.defCm || a.index - b.index);
  const exemptIds = new Set(sortedDesc.slice(0, Math.min(exemptQuota, sortedDesc.length)).map((c) => c.index));

  let totalMoney = 0;
  let rejectedCount = 0;
  let deductedCount = 0;
  let exemptCount = 0;

  const rows = cores.map((c) => {
    let tag = "مطابق";
    let status = "سماكة مطابقة — بدون حسم";
    let deductedCm = 0;
    let money = 0;
    let cls = "status-accepted";

    if (c.defCm > maxDefCm + 1e-9) {
      tag = "مرفوض";
      status = `النقص ${c.defCm} سم أكبر من ${maxDefCm} سم (5 مم) — مرفوض بدون حسم`;
      cls = "status-rejected";
      rejectedCount += 1;
    } else if (c.defCm > 1e-9) {
      if (exemptIds.has(c.index)) {
        tag = "معفى (10%)";
        status = `من أعلى الكورات شذوذاً ضمن حصة الإعفاء (${exemptQuota}) — بدون حسم`;
        exemptCount += 1;
      } else {
        tag = "يُحسم";
        deductedCm = c.defCm;
        money = (deductedCm / reqThick) * area * price;
        totalMoney += money;
        deductedCount += 1;
        status = `حسم كامل النقص (${deductedCm} سم)`;
        cls = "status-deduct";
      }
    }

    return { ...c, tag, status, deductedCm, money, cls };
  });

  return {
    stage, reqThick, totalCores, maxDefCm, rawQuota, exemptQuota,
    area, price, rows, totalMoney, rejectedCount, deductedCount, exemptCount
  };
}

function buildStageCoresResult(ev) {
  const isExec = ev.stage === "exec";
  return {
    location: isExec ? "كورات سماكة الخلطة الإسفلتية — التنفيذ" : "كورات سماكة الخلطة الإسفلتية — ضبط الجودة",
    tableNum: 4,
    itemName: `فروقات السماكة - كورات ${isExec ? "التنفيذ" : "ضبط الجودة"} (${ev.reqThick} سم)`,
    unit: "م²",
    repQty: ev.area,
    unitPrice: ev.price,
    totalWorkValue: ev.area * ev.price,
    q1: isExec ? ev.totalMoney : 0,
    q2: isExec ? 0 : ev.totalMoney,
    q3: 0,
    totalDeduction: ev.totalMoney,
    finalDecision: ev.rejectedCount > 0
      ? "مرفوض - إضافة طبقة خلطة إسفلتية"
      : ev.totalMoney > 0
        ? "مقبول مع حسم (الجدول رقم 4)"
        : "مقبول بدون حسم",
    anyRejected: ev.rejectedCount > 0
  };
}

function renderStageCoresResult(stage, ev) {
  const el = document.getElementById(stageCoresPrefix(stage) + "CoresResult");
  if (!el) return;
  const stageTitle = stage === "exec" ? "التنفيذ" : "ضبط الجودة";
  el.innerHTML = `
    <div class="stage-cores-summary">
      <div>إجمالي الكورات: <strong>${ev.totalCores}</strong></div>
      <div>10% (${ev.rawQuota.toFixed(2)}) ← للأعلى <strong>${ev.exemptQuota} كورات معفاة</strong></div>
      <div>أقصى نقص مسموح: <strong>${ev.maxDefCm} سم</strong></div>
      <div>معفى ${ev.exemptCount} | يُحسم ${ev.deductedCount} | مرفوض ${ev.rejectedCount}</div>
    </div>
    <div class="table-responsive">
      <table class="data-table stage-cores-table">
        <thead>
          <tr><th>الكور</th><th>السماكة</th><th>النقص</th><th>الحالة</th><th>الحسم</th></tr>
        </thead>
        <tbody>
          ${ev.rows
            .map(
              (r) => `
            <tr>
              <td><strong>${r.label}</strong></td>
              <td>${r.readingCm} سم</td>
              <td>${r.defCm} سم</td>
              <td><span class="unit-badge">${r.tag}</span><div class="stage-core-status">${r.status}</div></td>
              <td><strong>${r.money.toFixed(3)} د.أ</strong></td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
    <div class="stage-cores-total">إجمالي حسم كورات ${stageTitle}: <strong>${ev.totalMoney.toFixed(3)} د.أ</strong></div>
  `;
}

function calculateStageCores() {
  const execEv = evaluateStageCores("exec");
  const qcEv = evaluateStageCores("qc");
  [["execStageRepArea", execEv], ["qcStageRepArea", qcEv]].forEach(([id, ev]) => {
    const el = document.getElementById(id);
    if (el) el.value = String(Math.round(ev.area * 1000) / 1000);
  });
  renderStageCoresResult("exec", execEv);
  renderStageCoresResult("qc", qcEv);
  currentExecStageCoresResult = buildStageCoresResult(execEv);
  currentQcStageCoresResult = buildStageCoresResult(qcEv);
  updateDuplicateWarningBanner();
}

function addStageCoresResultToProjectLog(stage) {
  pushResultToActiveProject(stage === "exec" ? currentExecStageCoresResult : currentQcStageCoresResult);
}

// ==================== 3. حاسبة درجات الرك للخلطة الإسفلتية (بند 2.2.4 + مثال 6) ====================
const COMPACTION_STAGES = ["exec", "qc", "acceptance"];

function compactionStageTitle(stage) {
  return stage === "exec" ? "التنفيذ" : stage === "qc" ? "ضبط الجودة" : "لجنة الاستلام";
}

function compactionStagePrefix(stage) {
  return stage === "exec" ? "compactionExec" : stage === "qc" ? "compactionQc" : "compactionAcceptance";
}

function getCompactionStageCores(stage) {
  if (!compactionCoresByStage[stage]) compactionCoresByStage[stage] = [];
  return compactionCoresByStage[stage];
}

function renderCompactionCoresInputs(stage = "exec") {
  if (!COMPACTION_STAGES.includes(stage)) stage = "exec";
  const container = document.getElementById(compactionStagePrefix(stage) + "CoresContainer");
  if (!container) return;
  const list = getCompactionStageCores(stage);
  container.innerHTML = list
    .map(
      (core, idx) => `
      <div class="core-item-box">
        <div class="core-item-top">
          <span>${core.label || `كور رقم (${idx + 1})`}</span>
          <button type="button" class="btn-remove-core" onclick="removeCompactionCore('${stage}', ${idx})" title="حذف الكور">✖</button>
        </div>
        <label style="font-size:0.78rem;color:#475569;">درجة الرك المقاسة (%):</label>
        <input type="text" inputmode="decimal" lang="en" dir="ltr" class="form-control" value="${core.readingPct}" step="0.1" min="0" max="105" oninput="updateCompactionCoreVal('${stage}', ${idx}, this.value)" />
      </div>`
    )
    .join("");
}

function renderAllCompactionCores() {
  COMPACTION_STAGES.forEach(renderCompactionCoresInputs);
}

// دعم الاستدعاء القديم updateCompactionCoreVal(idx, val) كورات التنفيذ
function updateCompactionCoreVal(stageOrIdx, idxOrVal, maybeVal) {
  let stage = "exec";
  let idx = stageOrIdx;
  let val = idxOrVal;
  if (typeof stageOrIdx === "string") {
    stage = stageOrIdx;
    idx = idxOrVal;
    val = maybeVal;
  }
  const core = getCompactionStageCores(stage)[idx];
  if (!core) return;
  core.readingPct = parseFloat(val) || 0;
  if (stage === "exec") compactionCoresState = compactionCoresByStage.exec;
  calculateAsphaltCompaction();
}

// دعم الاستدعاء القديم addCompactionCoreRow() لكورات التنفيذ
function addCompactionCoreRow(stage = "exec") {
  if (!COMPACTION_STAGES.includes(stage)) stage = "exec";
  const list = getCompactionStageCores(stage);
  list.push({ id: Date.now() + Math.floor(Math.random() * 1000), label: `كور رقم (${list.length + 1})`, readingPct: 98.0 });
  renderCompactionCoresInputs(stage);
  if (stage === "exec") compactionCoresState = compactionCoresByStage.exec;
  calculateAsphaltCompaction();
}

// دعم الاستدعاء القديم removeCompactionCore(idx) لكورات التنفيذ
function removeCompactionCore(stageOrIdx, idxArg) {
  let stage = "exec";
  let idx = stageOrIdx;
  if (typeof stageOrIdx === "string") {
    stage = stageOrIdx;
    idx = idxArg;
  }
  const list = getCompactionStageCores(stage);
  if (list.length <= 1) return;
  list.splice(idx, 1);
  list.forEach((c, i) => { c.label = `كور رقم (${i + 1})`; });
  renderCompactionCoresInputs(stage);
  if (stage === "exec") compactionCoresState = compactionCoresByStage.exec;
  calculateAsphaltCompaction();
}

function syncCompactionSelectors() {
  const roadSel = document.getElementById("compRoadCategoryInput");
  const tableSel = document.getElementById("compTableKeyInput");
  if (roadSel) roadSel.value = compactionSetupState.roadCategory;
  if (tableSel) tableSel.value = compactionSetupState.tableKey;
}

function getCompactionRuleSelection() {
  let table = MPWH_DATA.tables.find((t) => t.variantKey === compactionSetupState.tableKey);
  if (!table) {
    compactionSetupState.tableKey = "t10_old";
    compactionSetupState.roadCategory = "main";
    table = MPWH_DATA.tables.find((t) => t.variantKey === "t10_old");
  }
  const item = (table.items || []).find((i) => i.num === 8) || table.items[0];
  const tableRef = tableRefText({ tableNum: table.tableNum, tableLabel: table.variantLabel });
  return {
    table,
    item,
    execRule: item.exec || {},
    acceptRule: item.accept || {},
    tableRef,
    roadLabel: table.roadCategory === "agricultural" ? "الطرق الزراعية" : "الطرق الرئيسية والثانوية والقروية"
  };
}

function onCompactionRoadCategoryChange() {
  const sel = document.getElementById("compRoadCategoryInput");
  if (!sel) return;
  compactionSetupState.roadCategory = sel.value;
  compactionSetupState.tableKey = sel.value === "agricultural" ? "t15_old" : "t10_old";
  syncCompactionSelectors();
  calculateAsphaltCompaction();
}

function onCompactionTableKeyChange() {
  const sel = document.getElementById("compTableKeyInput");
  if (!sel) return;
  compactionSetupState.tableKey = sel.value;
  const table = MPWH_DATA.tables.find((t) => t.variantKey === sel.value);
  if (table) compactionSetupState.roadCategory = table.roadCategory === "agricultural" ? "agricultural" : "main";
  syncCompactionSelectors();
  calculateAsphaltCompaction();
}

function setCompactionText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function updateCompactionRuleSummary() {
  const { table, execRule, acceptRule, tableRef, roadLabel } = getCompactionRuleSelection();
  const reqDeg = parseFloat(document.getElementById("compReqDegInput")?.value) || 98;
  setCompactionText("compactionRoadBadge", roadLabel);
  setCompactionText("compactionTableBadge", `الجدول رقم (${table.tableNum}) ${table.variantLabel || ""}`.trim());
  setCompactionText("compactionExecRuleLabel", `الجدول ${tableRef}`);
  setCompactionText("compactionAcceptRuleLabel", `الجدول ${tableRef}`);
  setCompactionText("compactionExecRuleText",
    `التجاوز المسموح: ${execRule.textMaxDev || `-${execRule.maxDev || 0}`} — قاعدة الحسم: ${execRule.textRate || `${execRule.deductRate || 0}%`}`);
  setCompactionText("compactionAcceptRuleText",
    `التفاوت المسموح بدون حسم: ${acceptRule.textFreeTol || "---"} — الحد الأقصى: ${acceptRule.textMaxDev || `-${acceptRule.maxDev || 0}`} — قاعدة الحسم: ${acceptRule.textRate || `${acceptRule.deductRate || 0}%`}`);
  setCompactionText("compactionIndividualLimit", `${Math.round((reqDeg - 3) * 1000) / 1000}%`);
}

const roundCompaction = (n) => Math.round((Number(n) || 0) * 1000) / 1000;

// حسم المرحلة وفق قواعد الجدول المختار (المعادلة 2 + التوزيع التراكمي للدرجات)
function computeCompactionDeduction(baseValue, rule, avgDef) {
  const base = Math.max(0, Number(baseValue) || 0);
  const rawDef = Math.max(0, roundCompaction(avgDef));
  const freeTol = Number(rule.freeTol) || 0;
  const maxAllowed = Number(rule.maxDev) || 0;
  const common = { freeTol, maxAllowedDev: maxAllowed, rawDef };

  if (rawDef <= 1e-9) {
    return {
      ...common, status: "accepted", deduction: 0, effectiveDev: 0, ratePct: 0,
      statusText: "مقبول بدون حسم — المعدل يحقق المواصفة",
      formula: "النقص = 0 ← ق = 0.000 د.أ"
    };
  }

  const effectiveDev = roundCompaction(Math.max(0, rawDef - freeTol));
  if (effectiveDev <= 1e-9) {
    return {
      ...common, status: "accepted", deduction: 0, effectiveDev, ratePct: 0,
      statusText: `مقبول بدون حسم — النقص (${rawDef}) ضمن التفاوت المسموح (${freeTol})`,
      formula: `النقص (${rawDef}) - التفاوت المسموح (${freeTol}) = 0 ← ق = 0.000 د.أ`
    };
  }

  if (effectiveDev > maxAllowed + 1e-9) {
    return {
      ...common, status: "rejected", deduction: 0, effectiveDev, ratePct: 0,
      statusText: `مرفوض — النقص الصافي (${effectiveDev}) تجاوز الحد المسموح (${maxAllowed})`,
      formula: `النقص الصافي (${effectiveDev}) > الحد المسموح (${maxAllowed}) ← خارج حدود القبول مع حسم`
    };
  }

  if (rule.mode === "tiered_degrees" && Array.isArray(rule.tiers) && rule.tiers.length) {
    let lower = 0;
    let totalRate = 0;
    const parts = [];
    for (const tier of rule.tiers) {
      const upper = Number(tier.upTo);
      if (!Number.isFinite(upper) || upper <= lower) continue;
      const portion = Math.max(0, Math.min(effectiveDev, upper) - lower);
      if (portion > 1e-9) {
        const rate = Number(tier.rate) || 0;
        totalRate += portion * rate;
        parts.push(`${roundCompaction(portion)}×${rate}%`);
      }
      lower = upper;
      if (effectiveDev <= upper + 1e-9) break;
    }
    const ratePct = roundCompaction(totalRate);
    const deduction = roundCompaction(base * (ratePct / 100));
    return {
      ...common, status: "deduct", deduction, effectiveDev, ratePct,
      statusText: `مقبول مع حسم (${deduction.toFixed(3)} د.أ)`,
      formula: `[ ${base.toFixed(3)} × (توزيع الدرجات: ${parts.join(" + ") || "0"} = ${ratePct}%) ] = ${deduction.toFixed(3)} د.أ`
    };
  }

  const ratePct = Number(rule.deductRate) || 0;
  const ratio = maxAllowed > 0 ? effectiveDev / maxAllowed : 0;
  const deduction = roundCompaction(base * (ratePct / 100) * ratio);
  return {
    ...common, status: "deduct", deduction, effectiveDev, ratePct,
    statusText: `مقبول مع حسم (${deduction.toFixed(3)} د.أ)`,
    formula: `[ ${base.toFixed(3)} × (${ratePct}/100) × (${effectiveDev}/${maxAllowed}) ] = ${deduction.toFixed(3)} د.أ`
  };
}

function evaluateCompactionStage(stage, reqDeg) {
  const cores = getCompactionStageCores(stage);
  const includedCores = [];
  const excludedCores = [];
  cores.forEach((c) => {
    const def = roundCompaction(reqDeg - c.readingPct);
    if (def > 3 + 1e-9) excludedCores.push({ ...c, def });
    else includedCores.push({ ...c, def });
  });
  const avgCompaction = includedCores.length
    ? roundCompaction(includedCores.reduce((s, c) => s + c.readingPct, 0) / includedCores.length)
    : 0;
  const avgDeficiency = includedCores.length
    ? roundCompaction(Math.max(0, reqDeg - avgCompaction))
    : 0;
  return {
    stage, title: compactionStageTitle(stage), cores, includedCores, excludedCores,
    minIndividualAllowed: roundCompaction(reqDeg - 3),
    avgCompaction, avgDeficiency
  };
}

function calculateStageCompactionDeduction(stageEv, rule, baseValue) {
  if (!stageEv.cores.length) {
    return {
      status: "empty", deduction: 0, effectiveDev: 0, ratePct: 0, rawDef: 0,
      statusText: "لم تُدخل كورات لهذه المرحلة",
      formula: "لا يوجد قراءات — لا يتم احتساب حسم لهذه المرحلة",
      freeTol: Number(rule.freeTol) || 0, maxAllowedDev: Number(rule.maxDev) || 0
    };
  }
  if (!stageEv.includedCores.length) {
    return {
      status: "rejected", deduction: Math.max(0, baseValue), effectiveDev: stageEv.avgDeficiency,
      ratePct: 100, rawDef: stageEv.avgDeficiency,
      statusText: "مرفوضة — جميع كورات المرحلة مستبعدة فردياً (حسم كامل قيمة البند)",
      formula: `جميع الكورات تقل بأكثر من 3 درجات عن ${stageEv.minIndividualAllowed}% ← ق = كامل قيمة البند = ${Math.max(0, baseValue).toFixed(3)} د.أ`,
      freeTol: Number(rule.freeTol) || 0, maxAllowedDev: Number(rule.maxDev) || 0
    };
  }
  return computeCompactionDeduction(baseValue, rule, stageEv.avgDeficiency);
}

function renderCompactionStageResult(stage, stageEv, calc, rule, tableRef) {
  const el = document.getElementById("asphaltCompactionResult_" + stage);
  if (!el) return;
  const badgeClass = calc.status === "rejected" ? "status-rejected" : calc.status === "deduct" ? "status-deduct" : "status-accepted";
  el.innerHTML = `
    <div class="compaction-stage-result">
      <div class="compaction-stage-result-head">
        <span>${stageEv.title} — الجدول ${tableRef}</span>
        <span class="${badgeClass}">${calc.statusText}</span>
      </div>
      <div class="compaction-stage-summary-grid">
        <div>الكورات: <strong>${stageEv.cores.length}</strong></div>
        <div>داخلة المعدل: <strong>${stageEv.includedCores.length}</strong></div>
        <div>مستبعدة فردياً: <strong>${stageEv.excludedCores.length}</strong></div>
        <div>الحد الفردي الأدنى: <strong>${stageEv.minIndividualAllowed}%</strong></div>
        <div>معدل الرك: <strong>${stageEv.avgCompaction}%</strong></div>
        <div>نقص المعدل: <strong>${stageEv.avgDeficiency}%</strong></div>
      </div>
      <div class="compaction-stage-core-line">
        ${stageEv.includedCores.length
          ? `الكورات الداخلة: ${stageEv.includedCores.map((c) => `${c.label} (${c.readingPct}% / نقص ${c.def})`).join("، ")}`
          : "لا توجد كورات داخلة في المعدل"}
      </div>
      ${stageEv.excludedCores.length
        ? `<div class="compaction-stage-core-line" style="color:#b91c1c;">الكورات المستبعدة (تقل عن ${stageEv.minIndividualAllowed}%): ${stageEv.excludedCores.map((c) => `${c.label} (${c.readingPct}% / نقص ${c.def})`).join("، ")}</div>`
        : ""}
      ${stageEv.cores.length && stageEv.includedCores.length < 3
        ? `<div class="status-banner status-deduct" style="margin-top:6px;">⚠️ الحد الأدنى لاحتساب المعدل لهذه المرحلة هو 3 عينات ممثلة (المتوفر: ${stageEv.includedCores.length}).</div>`
        : ""}
      <div class="compaction-stage-formula"><strong>قاعدة الجدول:</strong> ${rule.textMaxDev || `الحد ${rule.maxDev || 0}`} — ${rule.textRate || `${rule.deductRate || 0}%`}<br/><strong>الحسم:</strong> ${calc.formula}</div>
      <div class="compaction-stage-total">إجمالي حسم ${stageEv.title}: ${calc.deduction.toFixed(3)} د.أ
        <button type="button" class="btn btn-edit btn-sm no-print" style="margin-right:8px;" onclick="addCompactionStageToProjectLog('${stage}')">＋ إضافة هذه المرحلة للسجل</button>
      </div>
    </div>`;
}

function buildCompactionStageResult(stage, stageEv, calc, reqDeg, dayArea, unitPrice, selection) {
  const { table, tableRef } = selection;
  const q1 = stage === "exec" ? calc.deduction : 0;
  const q2 = stage === "qc" ? calc.deduction : 0;
  const q3 = stage === "acceptance" ? calc.deduction : 0;
  return {
    location: `كورات درجة الرك — ${stageEv.title}`,
    tableNum: table.tableNum,
    tableKey: table.variantKey,
    tableLabel: table.variantLabel,
    stage,
    roadCategory: table.roadCategory,
    itemName: `درجة الرك (${stageEv.title} / الجدول ${tableRef} / المطلوب ${reqDeg}% / المعدل ${stageEv.avgCompaction}%)`,
    unit: "م²",
    repQty: dayArea,
    unitPrice,
    totalWorkValue: dayArea * unitPrice,
    q1, q2, q3,
    totalDeduction: calc.deduction,
    finalDecision: calc.status === "rejected"
      ? `مرفوض — ${stageEv.excludedCores.length} كور مستبعد فردياً أو تجاوز في المعدل (الجدول ${tableRef})`
      : calc.status === "deduct"
        ? `مقبول مع حسم (الجدول ${tableRef})`
        : "مقبول بدون حسم",
    anyRejected: calc.status === "rejected" || stageEv.excludedCores.length > 0
  };
}

function addCompactionStageToProjectLog(stage) {
  const result = currentCompactionStageResults[stage];
  if (!result) {
    alert("لا توجد نتيجة محسوبة لهذه المرحلة بعد.");
    return;
  }
  pushResultToActiveProject(result);
}

function loadCompactionExample6() {
  document.getElementById("compReqDegInput").value = 98;
  document.getElementById("compDayAreaInput").value = 3000;
  document.getElementById("compUnitPriceInput").value = 6.5;
  compactionSetupState = { roadCategory: "main", tableKey: "t10_old" };
  compactionCoresByStage = {
    exec: [
      { id: 1, label: "كور رقم (1)", readingPct: 97.0 },
      { id: 2, label: "كور رقم (2)", readingPct: 94.0 },
      { id: 3, label: "كور رقم (3)", readingPct: 96.5 },
      { id: 4, label: "كور رقم (4)", readingPct: 94.0 },
      { id: 5, label: "كور رقم (5)", readingPct: 96.0 }
    ],
    qc: [
      { id: 1, label: "كور رقم (1)", readingPct: 97.0 },
      { id: 2, label: "كور رقم (2)", readingPct: 98.0 },
      { id: 3, label: "كور رقم (3)", readingPct: 97.5 }
    ],
    acceptance: [
      { id: 1, label: "كور رقم (1)", readingPct: 97.5 },
      { id: 2, label: "كور رقم (2)", readingPct: 97.0 },
      { id: 3, label: "كور رقم (3)", readingPct: 97.0 }
    ]
  };
  compactionCoresState = compactionCoresByStage.exec;
  syncCompactionSelectors();
  renderAllCompactionCores();
  calculateAsphaltCompaction();
  switchToTab("tab-asphalt-compaction");
}

function calculateAsphaltCompaction() {
  const reqDeg = parseFloat(document.getElementById("compReqDegInput").value) || 98;
  const dayArea = Math.max(0, parseFloat(document.getElementById("compDayAreaInput").value) || 0);
  const unitPrice = Math.max(0, parseFloat(document.getElementById("compUnitPriceInput").value) || 0);
  const baseValue = dayArea * unitPrice;
  const selection = getCompactionRuleSelection();
  const { table, execRule, acceptRule, tableRef, roadLabel } = selection;

  syncCompactionSelectors();
  updateCompactionRuleSummary();

  const out = document.getElementById("asphaltCompactionResultContainer");
  if (!out) return;

  const stageData = {};
  currentCompactionStageResults = {};
  COMPACTION_STAGES.forEach((stage) => {
    const rule = stage === "acceptance" ? acceptRule : execRule;
    const stageEv = evaluateCompactionStage(stage, reqDeg);
    const calc = calculateStageCompactionDeduction(stageEv, rule, baseValue);
    stageData[stage] = { stageEv, calc, rule };
    currentCompactionStageResults[stage] = buildCompactionStageResult(
      stage, stageEv, calc, reqDeg, dayArea, unitPrice, selection
    );
  });

  const { exec, qc, acceptance } = stageData;
  const totalDeduction = roundCompaction(
    exec.calc.deduction + qc.calc.deduction + acceptance.calc.deduction
  );
  const rejectedStages = COMPACTION_STAGES.filter((s) => stageData[s].calc.status === "rejected");
  const excludedTotal = COMPACTION_STAGES.reduce((s, k) => s + stageData[k].stageEv.excludedCores.length, 0);
  const anyRejected = rejectedStages.length > 0 || excludedTotal > 0;
  const noSamples = COMPACTION_STAGES.every((s) => !stageData[s].stageEv.cores.length);

  out.innerHTML = `
    <div class="step-box" style="background:#f9f6ee;border-color:#d5c7a3;">
      <div class="step-box-header">
        <span>1️⃣ الفرز الفردي لكل مرحلة على حدة (البند 2.2.4 صفحة 21 والمثال 6 صفحة 49)</span>
        <span>${roadLabel} — الجدول ${tableRef}</span>
      </div>
      <div style="font-size:0.84rem;line-height:1.8;">
        <div>درجة الرك المطلوبة: <strong>${reqDeg}%</strong> — الحد الفردي الأدنى لكل كور: <strong>${roundCompaction(reqDeg - 3)}%</strong></div>
        <div>المساحة: <strong>${dayArea} م²</strong> — السعر: <strong>${unitPrice} د.أ/م²</strong> — قيمة البند: <strong>${baseValue.toFixed(3)} د.أ</strong></div>
        <div>قاعدة التنفيذ وضبط الجودة: <strong>${execRule.textMaxDev || `-${execRule.maxDev || 0}`} — ${execRule.textRate || `${execRule.deductRate || 0}%`}</strong></div>
        <div>قاعدة لجنة الاستلام: <strong>${acceptRule.textMaxDev || `-${acceptRule.maxDev || 0}`} — ${acceptRule.textRate || `${acceptRule.deductRate || 0}%`}</strong></div>
      </div>
    </div>

    <div class="stage-cores-grid">
      <div class="step-box" style="margin:0;"><div id="asphaltCompactionResult_exec"></div></div>
      <div class="step-box" style="margin:0;"><div id="asphaltCompactionResult_qc"></div></div>
      <div class="step-box" style="margin:0;"><div id="asphaltCompactionResult_acceptance"></div></div>
    </div>

    <div class="compaction-total-bar">
      <div>
        <div style="font-size:0.82rem;color:#475569;">الحسم الكلي لدرجات الرك (تنفيذ + ضبط جودة + لجنة الاستلام)</div>
        <div style="font-size:1.05rem;font-weight:800;color:#5b21b6;">${totalDeduction.toFixed(3)} د.أ</div>
        <div style="font-size:0.76rem;color:#475569;">التوزيع: تنفيذ ${exec.calc.deduction.toFixed(3)} + ضبط جودة ${qc.calc.deduction.toFixed(3)} + استلام ${acceptance.calc.deduction.toFixed(3)} د.أ</div>
      </div>
      <div style="font-size:0.8rem;line-height:1.7;">
        ${noSamples ? "⚠️ لم تُدخل قراءات لأي مرحلة." : ""}
        ${rejectedStages.length ? `⛔ مراحل مرفوضة: ${rejectedStages.map((s) => compactionStageTitle(s)).join("، ")}` : ""}
        ${excludedTotal ? `⛔ كورات مستبعدة فردياً: ${excludedTotal}` : ""}
      </div>
    </div>
  `;

  COMPACTION_STAGES.forEach((stage) => {
    const d = stageData[stage];
    renderCompactionStageResult(stage, d.stageEv, d.calc, d.rule, tableRef);
  });

  currentCompactionResult = {
    location: "كورات درجة الرك للخلطة الإسفلتية",
    tableNum: table.tableNum,
    tableKey: table.variantKey,
    tableLabel: table.variantLabel,
    stage: "all",
    roadCategory: table.roadCategory,
    itemName: `درجة الرك (${roadLabel} / الجدول ${tableRef} / المطلوب ${reqDeg}%)`,
    unit: "م²",
    repQty: dayArea,
    unitPrice,
    totalWorkValue: baseValue,
    q1: exec.calc.deduction,
    q2: qc.calc.deduction,
    q3: acceptance.calc.deduction,
    totalDeduction,
    finalDecision: anyRejected
      ? `مرفوض جزئياً — ${excludedTotal} كور مستبعد فردياً أو تجاوز في المعدل (الجدول ${tableRef})`
      : totalDeduction > 0
        ? `مقبول مع حسم (الجدول ${tableRef})`
        : "مقبول بدون حسم",
    anyRejected,
    stageBreakdown: {
      exec: { avgDeficiency: exec.stageEv.avgDeficiency, deduction: exec.calc.deduction, excludedCount: exec.stageEv.excludedCores.length },
      qc: { avgDeficiency: qc.stageEv.avgDeficiency, deduction: qc.calc.deduction, excludedCount: qc.stageEv.excludedCores.length },
      acceptance: { avgDeficiency: acceptance.stageEv.avgDeficiency, deduction: acceptance.calc.deduction, excludedCount: acceptance.stageEv.excludedCores.length }
    }
  };
  updateDuplicateWarningBanner();
}

// ==================== 4. حاسبة سماكة الفرشيات (بند 2.1 ص 18) وحفر الاختبار (جدول 1 ص 12) ====================
function calculateSubbaseThickness() {
  const reqThick = Math.max(1, parseFloat(document.getElementById("subbaseReqThickInput").value) || 20);
  const freeTol = Math.max(0, parseFloat(document.getElementById("subbaseFreeTolInput").value) || 1);
  const repQty = Math.max(0, parseFloat(document.getElementById("subbaseRepQtyInput").value) || 0);
  const unitPrice = Math.max(0, parseFloat(document.getElementById("subbaseUnitPriceInput").value) || 0);

  const r1 = parseFloat(document.getElementById("subbaseRead1").value) || 0;
  const r2 = parseFloat(document.getElementById("subbaseRead2").value) || 0;
  const r3 = parseFloat(document.getElementById("subbaseRead3").value) || 0;

  const readings = [
    { name: "العينة الأصلية", val: r1, def: Math.max(0, reqThick - r1), defPct: ((reqThick - r1) / reqThick) * 100 },
    { name: "عينة (10م قبل)", val: r2, def: Math.max(0, reqThick - r2), defPct: ((reqThick - r2) / reqThick) * 100 },
    { name: "عينة (10م بعد)", val: r3, def: Math.max(0, reqThick - r3), defPct: ((reqThick - r3) / reqThick) * 100 }
  ];

  const anyExceeds25Pct = readings.some((r) => r.defPct > 25 + 1e-9);
  const avgReading = (r1 + r2 + r3) / 3;
  const avgDefCm = Math.max(0, reqThick - avgReading);
  const avgDefPct = (avgDefCm / reqThick) * 100;

  // طرح سماح المواصفة (-1 سم) كما في مثال صفحة 18: "إذا كان النقص في معدل السماكة 2 سم يتم حساب مقدار الحسم على 1 سم فقط كون المواصفة تسمح (-1)"
  const netDeductCm = Math.max(0, avgDefCm - freeTol);

  let statusClass = "status-accepted";
  let decisionTitle = "";
  let deductionMoney = 0;
  let explanationHtml = "";

  if (anyExceeds25Pct) {
    statusClass = "status-rejected";
    decisionTitle = "مرفوض — تجاوز النقص الفردي في إحدى النقاط نسبة (25%) من السماكة المطلوبة (البند 2.1 - أولاً)";
    explanationHtml = `ينص البند (2.1 - أولاً) على ألا يتجاوز النقص لأي نقطة من القراءات الثلاث عن (25%) من السماكة المطلوبة (${(reqThick * 0.25).toFixed(2)} سم).`;
  } else if (avgDefPct > 15 + 1e-9) {
    statusClass = "status-rejected";
    decisionTitle = "تعويض بطبقة خلطة إسفلتية — النقص في معدل الثلاث قراءات تجاوز (15%) (البند 2.1 - ثالثاً)";
    explanationHtml = `بما أن النقص في معدل القراءات الثلاث (${avgDefPct.toFixed(2)}%) زاد عن 15% (${(reqThick * 0.15).toFixed(2)} سم)، يتم تعويض النقص بإضافة طبقة من الخلطة الإسفلتية تحدد سماكتها من قبل لجنة الاستلام شريطة تحقيق المواصفات.`;
  } else if (netDeductCm === 0) {
    statusClass = "status-accepted";
    decisionTitle = `مقبول بدون حسم — النقص في المعدل (${avgDefCm.toFixed(2)} سم) ضمن سماح المواصفة (-${freeTol} سم)`;
    explanationHtml = `معدل السماكة = ${avgReading.toFixed(2)} سم، ومقدار النقص (${avgDefCm.toFixed(2)} سم) لا يتجاوز سماح المواصفة (${freeTol} سم).`;
  } else {
    statusClass = "status-deduct";
    deductionMoney = (netDeductCm / reqThick) * repQty * unitPrice;
    decisionTitle = `مقبول مع حسم بطريقة النسبة والتناسب (البند 2.1 - ثانياً): ${deductionMoney.toFixed(3)} د.أ`;
    explanationHtml = `النقص في معدل الثلاث قراءات = ${avgDefCm.toFixed(2)} سم (${avgDefPct.toFixed(2)}% ≤ 15%). بعد طرح سماح المواصفة (-${freeTol} سم) يصبح النقص الخاضع للحسم = <strong>${netDeductCm.toFixed(2)} سم</strong>.`;
  }

  document.getElementById("subbaseThicknessResult").innerHTML = `
    <div class="status-banner ${statusClass}">
      <span>${decisionTitle}</span>
    </div>
    <div class="step-box">
      <div class="step-box-header">
        <span>تحليل القراءات الثلاث (البند 2.1 صفحة 18)</span>
        <span>معدل السماكة = ${avgReading.toFixed(2)} سم</span>
      </div>
      <div style="font-size:0.85rem;margin-bottom:8px;">${explanationHtml}</div>
      <div class="math-trace">
        Avg = (${r1} + ${r2} + ${r3}) / 3 = ${avgReading.toFixed(2)} cm | Avg Deficiency = ${avgDefCm.toFixed(2)} cm (${avgDefPct.toFixed(1)}%) | Net Deductible = ${netDeductCm.toFixed(2)} cm
      </div>
      ${
        deductionMoney > 0
          ? `<div class="math-trace" style="margin-top:6px;background:#fef3c7;">
              Deduction = (${netDeductCm.toFixed(2)} / ${reqThick}) × ${repQty} × ${unitPrice} = ${deductionMoney.toFixed(3)} JOD
            </div>`
          : ""
      }
    </div>
  `;
}

function calculateTestPitsCount() {
  const lengthKm = Math.max(0, parseFloat(document.getElementById("projectLengthKmInput").value) || 0);
  let rowNum = 1;
  let categoryText = "";
  let largeCount = 0;
  let smallCount = 0;

  if (lengthKm < 1) {
    rowNum = 1;
    categoryText = "أقل من 1 كم";
    largeCount = 1;
    smallCount = 1;
  } else if (lengthKm <= 10) {
    rowNum = 2;
    categoryText = "1 – 10 كم";
    largeCount = 3;
    smallCount = 5;
  } else if (lengthKm <= 20) {
    rowNum = 3;
    categoryText = "10 – 20 كم";
    largeCount = 4;
    smallCount = 10;
  } else {
    rowNum = 4;
    categoryText = "أكبر من 20 كم (حفرة كبيرة كل 5 كم، وحفرة صغيرة كل 1 كم)";
    largeCount = Math.ceil(lengthKm / 5);
    smallCount = Math.ceil(lengthKm / 1);
  }

  document.getElementById("testPitsCalcOutput").innerHTML = `
    <div class="step-box" style="background:var(--primary-50);border-color:#b6d7a8;">
      <div class="step-box-header">
        <span>نتيجة الجدول رقم (1) لطول مشروع (${lengthKm} كم)</span>
        <span>الفئة رقم (${rowNum}): ${categoryText}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">
        <div class="spec-mini-card">
          <strong>عدد الحفر الكبيرة (100سم × 100سم) - حد أدنى:</strong>
          <span style="font-size:1.35rem;font-weight:800;color:var(--primary-900);">${largeCount} حفرة كبيرة</span>
        </div>
        <div class="spec-mini-card">
          <strong>عدد الحفر الصغيرة / العينات اللبية - حد أدنى:</strong>
          <span style="font-size:1.35rem;font-weight:800;color:var(--primary-900);">${smallCount} حفرة صغيرة</span>
        </div>
      </div>
    </div>
  `;
}

// ==================== 5. مكتبة الأمثلة التوضيحية التفاعلية (ملحق رقم 3) ====================
function renderInteractiveExamples() {
  const container = document.getElementById("examplesInteractiveContainer");
  container.innerHTML = MPWH_DATA.examples
    .map(
      (ex, idx) => `
      <div class="example-card" id="card_${ex.id}">
        <div class="example-card-header">
          <div>
            <span class="badge-official">${ex.category} — صفحة (${ex.page})</span>
            <h3 style="margin-top:6px;color:var(--primary-900);">${ex.title}</h3>
          </div>
          ${
            ex.presetMainCalc
              ? `<button type="button" class="btn btn-primary btn-sm" onclick="loadBookPresetToMain('${ex.id}')">🚀 فتح وتطبيق في الحاسبة الرئيسية</button>`
              : ""
          }
        </div>

        <ul class="example-problem-list">
          ${ex.problemText.map((line) => `<li>${line}</li>`).join("")}
        </ul>

        <div class="step-box" style="background:#f9f6ee;border-color:#d5c7a3;">
          <div class="step-box-header">
            <span>المعادلات المعتمدة في الكتاب لهذا المثال:</span>
          </div>
          ${ex.equations.map((eq) => `<div class="math-trace" style="direction:rtl;text-align:right;margin-bottom:5px;">${eq}</div>`).join("")}
        </div>

        <div class="example-interactive-bar">
          <div class="form-grid-2" style="margin-bottom:10px;">
            <div class="form-group">
              <label>الكمية الممثلة A (${ex.unitA}):</label>
              <input type="text" inputmode="decimal" lang="en" dir="ltr" id="exA_${idx}" class="form-control" value="${ex.defaultA}" step="any" oninput="updateExampleCalculation(${idx})" />
            </div>
            <div class="form-group">
              <label>السعر للبند B (${ex.unitB}):</label>
              <input type="text" inputmode="decimal" lang="en" dir="ltr" id="exB_${idx}" class="form-control" value="${ex.defaultB}" step="any" oninput="updateExampleCalculation(${idx})" />
            </div>
          </div>
          <div id="exResult_${idx}"></div>
        </div>
      </div>
    `
    )
    .join("");

  MPWH_DATA.examples.forEach((_, idx) => updateExampleCalculation(idx));
}

function updateExampleCalculation(idx) {
  const ex = MPWH_DATA.examples[idx];
  const A = parseFloat(document.getElementById(`exA_${idx}`).value) || 0;
  const B = parseFloat(document.getElementById(`exB_${idx}`).value) || 0;
  const res = ex.compute(A, B);

  const container = document.getElementById(`exResult_${idx}`);
  container.innerHTML = res.steps
    .map(
      (s) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;margin-top:6px;border-radius:6px;background:${
        s.isRejected ? "#fee2e2" : s.isTotal ? "#fef3c7" : "#ffffff"
      };border:1px solid #cbd5e1;flex-wrap:wrap;gap:8px;">
        <div>
          <strong>${s.label}:</strong>
          <span style="font-size:0.84rem;color:#475569;margin-right:8px;direction:ltr;display:inline-block;">${s.formula}</span>
        </div>
        <div style="font-weight:800;font-size:1rem;color:var(--primary-900);">
          ${
            s.isRejected
              ? '<span style="color:#b91c1c;">مرفوض / معالجة هندسية</span>'
              : s.isCount
              ? `${s.value} كورات`
              : s.isPercent
              ? `${s.value}%`
              : `${s.value.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} د.أ`
          }
        </div>
      </div>
    `
    )
    .join("");
}

// ==================== 6. موسوعة الجداول المرجعية الكاملة (1 إلى 16) ====================
function renderReferenceTables() {
  const filterCat = document.getElementById("refTableFilterCategory").value;
  const query = (document.getElementById("refTableSearchInput").value || "").trim().toLowerCase();
  const container = document.getElementById("referenceTablesOutput");

  let htmlParts = [];

  // الجداول العامة (1، 2، 3، 4)
  if (filterCat === "all" || filterCat === "general") {
    if (!query || "تصنيف حفر الاختبار جدول 1".includes(query)) {
      htmlParts.push(`
        <div class="ref-table-block">
          <div class="ref-table-banner">
            <h4>الجدول رقم (1): تصنيف حفر الاختبار وعددها</h4>
            <span class="badge-official">القسم الأول — صفحة (12)</span>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>الرقم</th>
                  <th>طول المشروع (كيلو متر)</th>
                  <th>عدد الحفر الكبيرة (حد أدنى) [100سم × 100سم]</th>
                  <th>عدد الحفر الصغيرة (حد أدنى)</th>
                </tr>
              </thead>
              <tbody>
                ${MPWH_DATA.table1_testPits
                  .map(
                    (r) => `
                  <tr>
                    <td>${r.id}</td>
                    <td><strong>${r.rangeText}</strong></td>
                    <td>${r.largePits}</td>
                    <td>${r.smallPits}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          <div class="ref-footnotes">
            يتم تحديد عدد الحفر مع الالتزام بما ورد في البند رقم (1.0) ويمكن زيادتها أو إنقاصها حسب واقع الحال وحسب ظروف العمل وهذا الجدول للاسترشاد فقط وغير ملزم.
          </div>
        </div>
      `);
    }

    if (!query || "فحوصات الاستلام جدول 2".includes(query)) {
      htmlParts.push(`
        <div class="ref-table-block">
          <div class="ref-table-banner">
            <h4>الجدول رقم (2): فحوصات الاستلام حسب الطبقة</h4>
            <span class="badge-official">القسم الأول — صفحة (13)</span>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>اسم الفحص</th>
                  <th>القاعدة الترابية (Sub Grade)</th>
                  <th>طبقة الطمم</th>
                  <th>طبقة الطمم الإنشائي</th>
                  <th>طبقة المواد المختارة (Topping)</th>
                  <th>طبقات الفرشيات</th>
                  <th>طبقات الخلطة الإسفلتية</th>
                </tr>
              </thead>
              <tbody>
                ${MPWH_DATA.table2_acceptanceTests
                  .map(
                    (r) => `
                  <tr>
                    <td style="text-align:right;"><strong>${r.testName}</strong></td>
                    <td>${r.subgrade}</td>
                    <td>${r.embankment}</td>
                    <td>${r.structuralBackfill}</td>
                    <td>${r.topping}</td>
                    <td>${r.subbase}</td>
                    <td>${r.asphalt}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          <div class="ref-footnotes">
            <ul>
              <li>(*): تعتمد لهذه الفحوصات نتائج فحوصات البركتور التي تم إجراؤها خلال التنفيذ لنفس المنطقة الممثلة للعينة المراد فحصها وفي حال عدم توفر هذه القيم فيمكن استخراجها من المواد الموجودة في الموقع.</li>
              <li>(**): في حال تم طلب ذلك بشكل واضح في وثائق العطاء ويجرى هذا الفحص في حال وجود عيب في الطريق يبرر إجراؤه.</li>
              <li>(***): تستخدم لحساب الفراغات الهوائية والمعدنية فقط.</li>
              <li>(****): في حال تم طلب ذلك بشكل واضح في وثائق العطاء.</li>
            </ul>
          </div>
        </div>
      `);
    }

    if (!query || "توزيع الأوزان النسبية جدول 3".includes(query)) {
      htmlParts.push(`
        <div class="ref-table-block">
          <div class="ref-table-banner">
            <h4>الجدول رقم (3): توزيع الأوزان النسبية لمراحل الفحوصات لغايات احتساب الحسميات في مشاريع الطرق</h4>
            <span class="badge-official">القسم الأول — صفحة (14)</span>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>الحالة</th>
                  <th>فحوصات التنفيذ (1)</th>
                  <th>فحوصات ضبط الجودة (2)</th>
                  <th>فحوصات لجنة الاستلام (3)(*)</th>
                  <th>المجموع</th>
                </tr>
              </thead>
              <tbody>
                ${MPWH_DATA.table3_stageWeights
                  .map(
                    (c) => `
                  <tr>
                    <td><strong>${c.caseId}</strong></td>
                    <td>${c.w1Text}</td>
                    <td>${c.w2Text}</td>
                    <td>${c.w3Text}</td>
                    <td><strong>${c.totalText}</strong></td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      `);
    }

    if (!query || "تحديد فروقات السماكة لطبقات الخلطة الاسفلتية جدول 4".includes(query)) {
      htmlParts.push(`
        <div class="ref-table-block">
          <div class="ref-table-banner">
            <h4>الجدول رقم (4): تحديد فروقات السماكة لطبقات الخلطة الإسفلتية (DETERMINATION OF THICKNESS OF COURSES)</h4>
            <span class="badge-official">القسم الثاني — صفحة (20)</span>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>رقم البند</th>
                  <th>مقدار النقص في السماكة (T)</th>
                  <th>الشروط</th>
                  <th>مقدار الحسم</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>البند رقم (1)</strong></td>
                  <td style="text-align:right;">
                    1. خلطة إسفلتية مكونة من طبقة واحدة: السماح بدون حسم 3 مم.<br/>
                    2. خلطة إسفلتية مكونة من طبقتين: السماح بدون حسم 5 مم.<br/>
                    3. خلطة إسفلتية مكونة من 3 طبقات: السماح بدون حسم 7 مم.
                  </td>
                  <td>لا تزيد عن 10% من إجمالي عدد الكورات للمشروع.</td>
                  <td>مقبول بدون حسم لكل الطبقات وحسب المثال المرفق في الملحق (3).</td>
                </tr>
                <tr>
                  <td><strong>البند رقم (2)</strong></td>
                  <td style="text-align:right;">
                    1. خلطة إسفلتية مكونة من طبقة واحدة: السماح بدون حسم 3 مم.<br/>
                    2. خلطة إسفلتية مكونة من طبقتين: السماح بدون حسم 5 مم.<br/>
                    3. خلطة إسفلتية مكونة من 3 طبقات: السماح بدون حسم 7 مم.
                  </td>
                  <td>يزيد النقص عن 10% من إجمالي عدد الكورات للمشروع.</td>
                  <td>مقبول مع حسم ويطبق الحسم على ما يزيد عن (10%) من عدد الكورات الكلي وحسب المثال المرفق في الملحق (3) وحسب المثال (2).</td>
                </tr>
                <tr>
                  <td><strong>البند رقم (3)</strong></td>
                  <td style="text-align:right;">
                    إذا كان النقص في السماكة أقل أو يساوي 10% من السماكة المطلوبة في العطاء (مع الأخذ بعين الاعتبار التفاوت المسموح في البند 1 والبند 2).
                  </td>
                  <td>لجميع الكورات التي يوجد فيها نقص دون تحديد نسبة معينة.</td>
                  <td>مقبول مع الحسم لكامل منطقة النقص وينسب النقص لكامل السماكة المطلوبة وحسب المثال المرفق في الملحق (3) حسب المثال (3).</td>
                </tr>
                <tr>
                  <td><strong>البند رقم (4)</strong></td>
                  <td style="text-align:right;">
                    إذا تجاوز النقص في السماكة عن 10% من السماكة المطلوبة.
                  </td>
                  <td>لأي كورات يوجد فيها نقص.</td>
                  <td>إضافة طبقة خلطة إسفلتية تحدد سماكتها من قبل لجنة الاستلام ويتم إجراء كافة الفحوصات المطلوبة عليها (مواد، درجة رك وسماكة) حسب الأصول وحسب المثال المرفق في الملحق (3).</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="ref-footnotes">
            <ul>
              <li>في حال وجود طبقتين إسفلت أو أكثر تطبق الحدود المسموحة في السماكات المبينة أعلاه مجتمعة ولا تؤخذ منفصلة.</li>
              <li>نسبة الكورات (10)% لأقرب عدد صحيح عند حساب الحسميات لعدد الكورات التي تجاوزت (10)%.</li>
            </ul>
          </div>
        </div>
      `);
    }
  }

  // الجداول من 5 إلى 16
  MPWH_DATA.tables.forEach((tbl) => {
    if (filterCat === "main" && tbl.roadCategory !== "main") return;
    if (filterCat === "agricultural" && tbl.roadCategory !== "agricultural") return;
    if (filterCat === "general") return;

    const matchingItems = tbl.items.filter(
      (it) =>
        !query ||
        tbl.title.toLowerCase().includes(query) ||
        it.name.toLowerCase().includes(query) ||
        (it.notes && it.notes.toLowerCase().includes(query))
    );

    if (matchingItems.length === 0) return;

    const hasAcceptCols = tbl.tableNum !== 11 && tbl.tableNum !== 12 && tbl.tableNum !== 16;

    htmlParts.push(`
      <div class="ref-table-block">
        <div class="ref-table-banner">
          <div>
            <h4>${tbl.title}</h4>
            <small style="color:#475569;">${tbl.subtitle}</small>
          </div>
          <span class="badge-official">${tbl.roadCategoryTitle} — صفحة (${tbl.page})</span>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th rowspan="2">الرقم</th>
                <th rowspan="2">البند</th>
                <th rowspan="2">الوحدة</th>
                <th colspan="2">الفحوصات التي تجرى خلال التنفيذ بما فيها فحوصات ضبط الجودة</th>
                ${
                  hasAcceptCols
                    ? `<th colspan="3">الفحوصات التي تجرى خلال الاستلام</th>`
                    : ""
                }
                <th rowspan="2">ملاحظات</th>
              </tr>
              <tr>
                <th>التجاوز المسموح مع حسم</th>
                <th>نسبة الحسم %</th>
                ${
                  hasAcceptCols
                    ? `<th>التجاوز المسموح مع حسم</th>
                       <th>نسبة الحسم %</th>
                       <th>التفاوت المسموح بدون حسم</th>`
                    : ""
                }
              </tr>
            </thead>
            <tbody>
              ${matchingItems
                .map(
                  (item) => `
                <tr>
                  <td>${item.num}</td>
                  <td style="text-align:right;"><strong>${item.name}</strong></td>
                  <td>${item.unit}</td>
                  <td>${item.exec.textMaxDev}</td>
                  <td><strong>${item.exec.textRate}</strong></td>
                  ${
                    hasAcceptCols
                      ? `<td>${item.accept.textMaxDev}</td>
                         <td><strong>${item.accept.textRate}</strong></td>
                         <td>${item.accept.textFreeTol || "---"}</td>`
                      : ""
                  }
                  <td style="font-size:0.8rem;color:#475569;">${item.notes || "---"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        ${
          tbl.footnotes && tbl.footnotes.length > 0
            ? `<div class="ref-footnotes">
                <strong>ملاحظات الجدول رقم (${tbl.tableNum})${tbl.variantLabel ? ` ${escHTML(tbl.variantLabel)}` : ""}:</strong>
                <ul>
                  ${tbl.footnotes.map((fn) => `<li>${fn}</li>`).join("")}
                </ul>
              </div>`
            : ""
        }
      </div>
    `);
  });

  container.innerHTML =
    htmlParts.length > 0
      ? htmlParts.join("")
      : `<div class="step-box">لا توجد نتائج مطابقة لبحثك. جرب كلمات أخرى.</div>`;
}
