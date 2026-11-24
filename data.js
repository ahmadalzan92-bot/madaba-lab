// بيانات وجداول ومعادلات كتاب "أسس القبول والقبول مع الحسم والرفض لمشاريع الطرق - إصدار 2023"
// وزارة الأشغال العامة والإسكان - المملكة الأردنية الهاشمية

const MPWH_DATA = {
  // الجدول رقم (1): تصنيف حفر الاختبار وعددها (صفحة 12)
  table1_testPits: [
    { id: 1, rangeText: "أقل من 1 كم", minKm: 0, maxKm: 1, largePits: "1", smallPits: "1" },
    { id: 2, rangeText: "1 – 10 كم", minKm: 1, maxKm: 10, largePits: "3", smallPits: "5" },
    { id: 3, rangeText: "10 – 20 كم", minKm: 10, maxKm: 20, largePits: "4", smallPits: "10" },
    { id: 4, rangeText: "أكبر من 20 كم", minKm: 20, maxKm: Infinity, largePits: "حفرة واحدة كل 5 كيلومتر", smallPits: "حفرة واحدة كل 1 كيلومتر" }
  ],

  // الجدول رقم (2): فحوصات الاستلام (صفحة 13)
  table2_acceptanceTests: [
    { testName: "درجة الرك (*)", subgrade: "√", embankment: "√", structuralBackfill: "√", topping: "√", subbase: "√", asphalt: "√ (ضمن حزمة الإسفلت)" },
    { testName: "نسبة تحمل كاليفورنيا CBR (*)", subgrade: "√", embankment: "√", structuralBackfill: "√ (****)", topping: "√", subbase: "√", asphalt: "--" },
    { testName: "التصنيف (**)", subgrade: "√", embankment: "√", structuralBackfill: "--", topping: "--", subbase: "--", asphalt: "--" },
    { testName: "معامل اللدونة (PI)", subgrade: "--", embankment: "--", structuralBackfill: "--", topping: "√", subbase: "√", asphalt: "--" },
    { testName: "السماكة", subgrade: "--", embankment: "--", structuralBackfill: "--", topping: "√", subbase: "√", asphalt: "√ (ضمن حزمة الإسفلت)" },
    { testName: "التدرج", subgrade: "--", embankment: "--", structuralBackfill: "--", topping: "√", subbase: "√", asphalt: "√ (ضمن حزمة الإسفلت)" },
    { testName: "التآكل", subgrade: "--", embankment: "--", structuralBackfill: "--", topping: "--", subbase: "√", asphalt: "--" },
    { testName: "حزمة الخلطة الإسفلتية (1.السماكة، 2.درجة رك، 3.التدرج، 4.نسبة الإسفلت، 5.كثافة مارشال(***)، 6.الفراغات الهوائية، 7.الفراغات المعدنية، 8.الثبات والزحف، 9.فقدان الثبات)", subgrade: "--", embankment: "--", structuralBackfill: "--", topping: "--", subbase: "--", asphalt: "√" }
  ],

  // الجدول رقم (3): توزيع الأوزان النسبية لمراحل الفحوصات (صفحة 14)
  table3_stageWeights: [
    {
      caseId: 1,
      name: "الحالة (1): توفر فحوصات التنفيذ + ضبط الجودة + لجنة الاستلام",
      w1: 0.30, w2: 0.30, w3: 0.40,
      w1Text: "30 %", w2Text: "30 %", w3Text: "40 %",
      totalText: "100 %"
    },
    {
      caseId: 2,
      name: "الحالة (2): توفر فحوصات التنفيذ + لجنة الاستلام (بدون ضبط جودة)",
      w1: 0.60, w2: 0.00, w3: 0.40,
      w1Text: "60 %", w2Text: "لم يتم إجراء فحوصات", w3Text: "40 %",
      totalText: "100 %"
    },
    {
      caseId: 3,
      name: "الحالة (3): توفر فحوصات التنفيذ + ضبط الجودة (بدون لجنة استلام)",
      w1: 0.60, w2: 0.40, w3: 0.00,
      w1Text: "60 %", w2Text: "40 %", w3Text: "لم يتم إجراء فحوصات",
      totalText: "100 %"
    },
    {
      caseId: 4,
      name: "الحالة (4): توفر فحوصات التنفيذ فقط",
      w1: 1.00, w2: 0.00, w3: 0.00,
      w1Text: "100 %", w2Text: "لم يتم إجراء فحوصات", w3Text: "لم يتم إجراء فحوصات",
      totalText: "100 %"
    },
    {
      caseId: 5,
      name: "الحالة (5): توفر فحوصات ضبط الجودة + لجنة الاستلام (بدون تنفيذ)",
      w1: 0.00, w2: 0.60, w3: 0.40,
      w1Text: "لم يتم إجراء فحوصات", w2Text: "60 %", w3Text: "40 %",
      totalText: "100 %"
    },
    {
      caseId: 6,
      name: "الحالة (6): توفر فحوصات لجنة الاستلام فقط (أو فحص مشترك ملزم)",
      w1: 0.00, w2: 0.00, w3: 1.00,
      w1Text: "لم يتم إجراء فحوصات", w2Text: "لم يتم إجراء فحوصات", w3Text: "100 %",
      totalText: "100 %"
    }
  ],

  // الجداول من (5) إلى (16) - شاملة لكل تفاصيل التنفيذ/ضبط الجودة والاستلام
  // ملاحظة: في كل بند، نحدد:
  // exec: { allowed: boolean, maxDev: number | {minus, plus}, deductRate: number (%), textMaxDev: string, textRate: string, statusText: string }
  // accept: { allowed: boolean, freeTol: number | {minus, plus}, maxDevAfterFree: number | {minus, plus}, deductRate: number (%), textFreeTol: string, textMaxDev: string, textRate: string }
  tables: [
    // ==================== الملحق رقم (1): الطرق الرئيسية والثانوية والقروية ====================
    {
      tableNum: 5,
      roadCategory: "main",
      roadCategoryTitle: "الطرق الرئيسية والثانوية والقروية - الملحق (1)",
      title: "الجدول رقم (5): حسميات تجاوزات القاعدة الترابية (Subgrade)",
      subtitle: "الفحوصات التي تجرى خلال التنفيذ (بما فيها فحوصات ضبط الجودة) وفحوصات الاستلام",
      defaultUnit: "م³",
      page: 26,
      footnotes: [
        "1. إذا تم أخذ عينات ضبط الجودة (مواد ورك) بعد دحل المواد وحققت درجة الرك المطلوبة في العطاء يطبق عليها الفحوصات والتفاوتات الواردة في بند الفحوصات التي تجرى خلال الاستلام وخلاف ذلك يتم تطبيق التفاوتات أثناء التنفيذ.",
        "2. في حال تم أخذ العينات من قبل مختبر التنفيذ بعد الدحل يطبق عليها التفاوتات التي تجرى خلال التنفيذ.",
        "3. في حال تم طلب تصنيف المواد حسب المواصفات المطلوبة يُلغى الحسم على الشذوذات (التدرج، معامل اللدونة PI).",
        "(*) في حال كانت النتيجة أقل من هذه القيمة فيجب أن يتم إعادة الفحص في مختبرين بواقع عينتين في كل مختبر وتقيم النتائج استناداً لمعدل النتائج الواقعة ضمن حدود الدقة المسموحة في مواصفة الفحص.",
        "(**) على أن لا يتجاوز البعد الأقصى عن ثلثي سماكة الطبقة."
      ],
      items: [
        {
          id: "t5_1", num: 1, name: "البركتور (Proctor)", unit: "--",
          exec: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة", textRate: "---" },
          accept: { mode: "not_applicable", textMaxDev: "---", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t5_2", num: 2, name: "نسبة تحمل كاليفورنيا (CBR)", unit: "درجة",
          direction: "minus",
          exec: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة", textRate: "---" },
          accept: { mode: "standard", freeTol: 0, maxDev: 1, deductRate: 40, textMaxDev: "-1 (*)", textRate: "40%", textFreeTol: "---" },
          notes: "(*) في حال كانت النتيجة أقل من هذه القيمة يعاد الفحص في مختبرين بواقع عينتين في كل مختبر."
        },
        {
          id: "t5_3", num: 3, name: "درجة الرك", unit: "درجة",
          direction: "minus",
          exec: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة", textRate: "---" },
          accept: { mode: "standard", freeTol: 1, maxDev: 2, deductRate: 10, textMaxDev: "-2 بعد التفاوت المسموح بدون حسم", textRate: "10%", textFreeTol: "-1" }
        },
        {
          id: "t5_4", num: 4, name: "المار من المنخل (#200)", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 2, textMaxDev: "+2", textRate: "2%" },
          accept: { mode: "not_required", textMaxDev: "غير مطلوب", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t5_5", num: 5, name: "معامل اللدونة (PI)", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 1, deductRate: 6, textMaxDev: "+1", textRate: "6%" },
          accept: { mode: "not_required", textMaxDev: "غير مطلوب", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t5_6", num: 6, name: "الحجم الأقصى", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 5, deductRate: 2, textMaxDev: "+5 (**)", textRate: "2%" },
          accept: { mode: "standard", freeTol: 0, maxDev: 5, deductRate: 2, textMaxDev: "+5 (**)", textRate: "2%", textFreeTol: "---" },
          notes: "(**) على أن لا يتجاوز البعد الأقصى عن ثلثي سماكة الطبقة."
        },
        {
          id: "t5_7", num: 7, name: "التصنيف", unit: "---",
          exec: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة", textRate: "---" },
          accept: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة", textRate: "---", textFreeTol: "---" }
        }
      ]
    },

    // الجدول رقم (6): الطمم Embankment (صفحة 27)
    {
      tableNum: 6,
      roadCategory: "main",
      roadCategoryTitle: "الطرق الرئيسية والثانوية والقروية - الملحق (1)",
      title: "الجدول رقم (6): حسميات تجاوزات فحوصات الطمم (Embankment)",
      subtitle: "الفحوصات التي تجرى خلال التنفيذ (بما فيها فحوصات ضبط الجودة) وفحوصات الاستلام",
      defaultUnit: "م³",
      page: 27,
      footnotes: [
        "1. إذا تم أخذ عينات ضبط الجودة (مواد ورك) بعد دحل المواد وحققت درجة الرك المطلوبة في العطاء يطبق عليها الفحوصات والتفاوتات الواردة في بند الفحوصات التي تجرى خلال الاستلام وخلاف ذلك يتم تطبيق التفاوتات أثناء التنفيذ.",
        "2. في حال تم أخذ العينات من قبل مختبر التنفيذ بعد الدحل يطبق عليها التفاوتات التي تجرى خلال التنفيذ.",
        "(*) في حال كانت النتيجة أقل من هذه القيمة فيجب أن يتم إعادة الفحص في مختبرين بواقع عينتين في كل مختبر وتقيم النتائج استناداً لمعدل النتائج الواقعة ضمن حدود الدقة المسموحة في مواصفة الفحص.",
        "(**) في حال تم طلب التصنيف بشكل واضح في وثائق العطاء."
      ],
      items: [
        {
          id: "t6_1", num: 1, name: "البركتور (Proctor)", unit: "--",
          exec: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة", textRate: "---" },
          accept: { mode: "not_applicable", textMaxDev: "---", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t6_2", num: 2, name: "نسبة تحمل كاليفورنيا (CBR)", unit: "درجة",
          direction: "minus",
          exec: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة", textRate: "---" },
          accept: { mode: "standard", freeTol: 0, maxDev: 1, deductRate: 40, textMaxDev: "-1 (*)", textRate: "40%", textFreeTol: "---" }
        },
        {
          id: "t6_3", num: 3, name: "درجة الرك", unit: "درجة",
          direction: "minus",
          exec: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة", textRate: "---" },
          accept: { mode: "standard", freeTol: 1, maxDev: 1, deductRate: 10, textMaxDev: "-1 بعد التفاوت المسموح بدون حسم", textRate: "10%", textFreeTol: "-1" }
        },
        {
          id: "t6_4", num: 4, name: "التصنيف", unit: "--",
          exec: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة", textRate: "---" },
          accept: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة (**)", textRate: "---", textFreeTol: "---" }
        }
      ]
    },

    // الجدول رقم (7): الطمم الإنشائي Structural Backfilling (صفحة 28)
    {
      tableNum: 7,
      roadCategory: "main",
      roadCategoryTitle: "الطرق الرئيسية والثانوية والقروية - الملحق (1)",
      title: "الجدول رقم (7): حسميات تجاوزات فحوصات الطمم الإنشائي (Structural Backfilling) تحت المنشآت",
      subtitle: "الفحوصات التي تجرى خلال التنفيذ (بما فيها فحوصات ضبط الجودة) وفحوصات الاستلام",
      defaultUnit: "م³",
      page: 28,
      footnotes: [
        "1. إذا تم أخذ عينات ضبط الجودة (مواد ورك) بعد دحل المواد وحققت درجة الرك المطلوبة في العطاء يطبق عليها الفحوصات والتفاوتات الواردة في بند الفحوصات التي تجرى خلال الاستلام وخلاف ذلك يتم تطبيق التفاوتات أثناء التنفيذ.",
        "2. في حال تم أخذ العينات من قبل مختبر التنفيذ بعد الدحل يطبق عليها التفاوتات التي تجرى خلال التنفيذ.",
        "3. في حال تم طلب تصنيف المواد حسب المواصفات المطلوبة يُلغى الحسم على الشذوذات (التدرج، معامل اللدونة PI).",
        "(*) الأخذ بعين الاعتبار ما ورد في الجدول رقم (2) وفي حال كانت النتيجة أقل من هذه القيمة فيجب أن يتم إعادة الفحص في مختبرين بواقع عينتين في كل مختبر وتقيم النتائج استناداً لمعدل النتائج الواقعة ضمن حدود الدقة المسموحة في مواصفة الفحص."
      ],
      items: [
        {
          id: "t7_1", num: 1, name: "البركتور (Proctor)", unit: "--",
          exec: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة", textRate: "---" },
          accept: { mode: "not_applicable", textMaxDev: "---", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t7_2", num: 2, name: "نسبة تحمل كاليفورنيا (CBR)", unit: "درجة",
          direction: "minus",
          exec: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة", textRate: "---" },
          accept: { mode: "free_only", freeTol: 1, maxDev: 0, deductRate: 0, textMaxDev: "(*)", textRate: "---", textFreeTol: "-1" },
          notes: "(*) التفاوت المسموح بدون حسم (-1) وفي حال كانت النتيجة أقل يعاد الفحص في مختبرين."
        },
        {
          id: "t7_3", num: 3, name: "درجة الرك", unit: "درجة",
          direction: "minus",
          exec: { mode: "standard", freeTol: 0, maxDev: 1, deductRate: 10, textMaxDev: "-1", textRate: "10%" },
          accept: { mode: "standard", freeTol: 1, maxDev: 2, deductRate: 10, textMaxDev: "-2 بعد التفاوت المسموح بدون حسم", textRate: "10%", textFreeTol: "-1" }
        },
        {
          id: "t7_4", num: 4, name: "المار من المنخل (#200)", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 2, textMaxDev: "+2", textRate: "2%" },
          accept: { mode: "not_required", textMaxDev: "لا يتم إجراؤه خلال الاستلام", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t7_5", num: 5, name: "معامل اللدونة (PI)", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 1, deductRate: 6, textMaxDev: "+1", textRate: "6%" },
          accept: { mode: "not_required", textMaxDev: "لا يتم إجراؤه خلال الاستلام", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t7_6", num: 6, name: "التصنيف", unit: "---",
          exec: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة", textRate: "---" },
          accept: { mode: "not_required", textMaxDev: "لا يتم إجراؤه خلال الاستلام", textRate: "---", textFreeTol: "---" }
        }
      ]
    },

    // الجدول رقم (8): مواد المختارة Topping للطرق الرئيسية والثانوية والقروية (صفحة 29)
    {
      tableNum: 8,
      roadCategory: "main",
      roadCategoryTitle: "الطرق الرئيسية والثانوية والقروية - الملحق (1)",
      title: "الجدول رقم (8): حسميات تجاوزات فحوصات مواد (Topping)",
      subtitle: "الفحوصات التي تجرى خلال التنفيذ (بما فيها فحوصات ضبط الجودة) وفحوصات الاستلام",
      defaultUnit: "م³",
      page: 29,
      footnotes: [
        "1. إذا تم أخذ عينات ضبط الجودة (مواد ورك) بعد دحل المواد وحققت درجة الرك المطلوبة في العطاء يطبق عليها الفحوصات والتفاوتات الواردة في بند الفحوصات التي تجرى خلال الاستلام وخلاف ذلك يتم تطبيق التفاوتات أثناء التنفيذ.",
        "2. في حال تم أخذ العينات من قبل مختبر التنفيذ بعد الدحل يطبق عليها التفاوتات التي تجرى خلال التنفيذ.",
        "(*) على أن لا يزيد البعد الأقصى عن ثلثي سماكة الطبقة.",
        "(**) في حال كانت النتيجة أقل من هذه القيمة فيجب أن يتم إعادة الفحص في مختبرين بواقع عينتين في كل مختبر وتقيم النتائج استناداً لمعدل النتائج الواقعة ضمن حدود الدقة المسموحة في مواصفة الفحص."
      ],
      items: [
        {
          id: "t8_1", num: 1, name: "الحجم الأقصى", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 5, deductRate: 1, textMaxDev: "5*", textRate: "1%" },
          accept: { mode: "standard", freeTol: 0, maxDev: 5, deductRate: 1, textMaxDev: "5(*)", textRate: "1%", textFreeTol: "---" },
          notes: "(*) على أن لا يزيد البعد الأقصى عن ثلثي سماكة الطبقة."
        },
        {
          id: "t8_2", num: 2, name: "نسبة تحمل كاليفورنيا (CBR)", unit: "درجة",
          direction: "minus",
          exec: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة", textRate: "--" },
          accept: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 44, textMaxDev: "-2 (**)", textRate: "44%", textFreeTol: "---" }
        },
        {
          id: "t8_3", num: 3, name: "بروكتور (Proctor)", unit: "--",
          exec: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة", textRate: "--" },
          accept: { mode: "not_applicable", textMaxDev: "---", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t8_4", num: 4, name: "معامل اللدونة (PI)", unit: "درجة",
          direction: "plus",
          exec: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة", textRate: "--" },
          accept: { mode: "standard", freeTol: 1, maxDev: 1, deductRate: 6, textMaxDev: "+1 بعد التفاوت المسموح بدون حسم", textRate: "6%", textFreeTol: "+1" }
        },
        {
          id: "t8_5", num: 5, name: "المار من (المنخل #200)", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 1, deductRate: 2, textMaxDev: "+1", textRate: "2%" },
          accept: { mode: "standard", freeTol: 3, maxDev: 1, deductRate: 2, textMaxDev: "+1 بعد التفاوت المسموح بدون حسم", textRate: "2%", textFreeTol: "+3" }
        },
        {
          id: "t8_6", num: 6, name: "درجة الرك", unit: "درجة",
          direction: "minus",
          exec: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة", textRate: "--" },
          accept: { mode: "standard", freeTol: 0, maxDev: 3, deductRate: 30, textMaxDev: "-3", textRate: "30%", textFreeTol: "---" }
        },
        {
          id: "t8_7", num: 7, name: "السماكة", unit: "سم",
          exec: { mode: "spec_compliance", textMaxDev: "الالتزام بما جاء في المواصفات", textRate: "--" },
          accept: { mode: "spec_compliance", textMaxDev: "الالتزام بما جاء في المواصفات", textRate: "---", textFreeTol: "---" }
        }
      ]
    },

    // الجدول رقم (9): الفرشيات Sub-base & Base Course للطرق الرئيسية والثانوية والقروية (صفحات 30-31)
    {
      tableNum: 9,
      roadCategory: "main",
      roadCategoryTitle: "الطرق الرئيسية والثانوية والقروية - الملحق (1)",
      title: "الجدول رقم (9): حسميات تجاوزات فحوصات الفرشيات (Sub-base & Base Course)",
      subtitle: "الفحوصات التي تجرى خلال التنفيذ (بما فيها فحوصات ضبط الجودة) وفحوصات الاستلام",
      defaultUnit: "م³",
      page: "30 - 31",
      footnotes: [
        "1. إذا تم أخذ عينات ضبط الجودة (مواد ورك) بعد دحل المواد وحققت درجة الرك المطلوبة في العطاء يطبق عليها الفحوصات والتفاوتات الواردة في بند الفحوصات التي تجرى خلال الاستلام وخلاف ذلك يتم تطبيق التفاوتات أثناء التنفيذ.",
        "2. في حال تم أخذ العينات من قبل مختبر التنفيذ بعد الدحل يطبق عليها التفاوتات التي تجرى خلال التنفيذ.",
        "(*) في حال كانت النتيجة أقل من هذه القيمة فيجب أن يتم إعادة الفحص في مختبرين بواقع عينتين في كل مختبر وتُقيّم النتائج استناداً لمعدل النتائج الواقعة ضمن حدود الدقة المسموحة بالمواصفة."
      ],
      items: [
        {
          id: "t9_1", num: 1, name: "نسبة تحمل كاليفورنيا (CBR)", unit: "درجة",
          direction: "minus",
          exec: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 25, textMaxDev: "-2 من حد المواصفة", textRate: "25%" },
          accept: { mode: "standard", freeTol: 0, maxDev: 3, deductRate: 30, textMaxDev: "-3 من حدود المواصفة (*)", textRate: "30%", textFreeTol: "---" }
        },
        {
          id: "t9_2", num: 2, name: "معامل اللدونة (PI)", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 1, deductRate: 6, textMaxDev: "+1", textRate: "6%" },
          accept: { mode: "standard", freeTol: 1, maxDev: 1, deductRate: 8, textMaxDev: "+1 بعد التفاوت المسموح بدون حسم", textRate: "8%", textFreeTol: "+1" }
        },
        {
          id: "t9_3", num: 3, name: "التآكل على 500 دورة", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 3, deductRate: 10, textMaxDev: "+3", textRate: "10%" },
          accept: { mode: "standard", freeTol: 1, maxDev: 2, deductRate: 10, textMaxDev: "+2 بعد التفاوت المسموح بدون حسم", textRate: "10%", textFreeTol: "+1" }
        },
        {
          id: "t9_4", num: 4, name: "المكافئ الرملي", unit: "درجة",
          direction: "minus",
          exec: { mode: "standard", freeTol: 0, maxDev: 3, deductRate: 15, textMaxDev: "-3", textRate: "15%" },
          accept: { mode: "not_applicable", textMaxDev: "---", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t9_5", num: 5, name: "الأصالة (Soundness)", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 1, textMaxDev: "+2", textRate: "1%" },
          accept: { mode: "not_applicable", textMaxDev: "---", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t9_6", num: 6, name: "الأوجه المكسرة", unit: "درجة",
          direction: "minus",
          exec: { mode: "standard", freeTol: 0, maxDev: 5, deductRate: 1, textMaxDev: "-5", textRate: "1%" },
          accept: { mode: "not_applicable", textMaxDev: "---", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t9_7", num: 7, name: "الاستطالة", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 5, deductRate: 1, textMaxDev: "+5", textRate: "1%" },
          accept: { mode: "not_applicable", textMaxDev: "---", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t9_8", num: 8, name: "الشحف (Flakiness)", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 5, deductRate: 1, textMaxDev: "+5", textRate: "1%" },
          accept: { mode: "not_applicable", textMaxDev: "---", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t9_9", num: 9, name: "نسبة الجبس", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 0.50, deductRate: 1, textMaxDev: "+0.50", textRate: "1%" },
          accept: { mode: "not_applicable", textMaxDev: "---", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t9_10", num: 10, name: "نسبة الكتل الطينية", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 1, textMaxDev: "+2", textRate: "1%" },
          accept: { mode: "not_applicable", textMaxDev: "---", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t9_11", num: 11, name: "معامل الغبارية (#200/#40)", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 0.10, deductRate: 1, textMaxDev: "+0.10", textRate: "1%" },
          accept: { mode: "not_applicable", textMaxDev: "---", textRate: "---", textFreeTol: "---" },
          notes: "في حال تم طلبه في مواصفات العطاء."
        },
        {
          id: "t9_12", num: 12, name: "التدرج: الحجوم الزائدة", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 3, deductRate: 3, textMaxDev: "+3", textRate: "3%" },
          accept: { mode: "standard", freeTol: 1, maxDev: 2, deductRate: 3, textMaxDev: "+2 بعد التفاوت المسموح به دون حسم", textRate: "3%", textFreeTol: "+1" },
          notes: "على أن لا يزيد الحجم عن 3 إنش."
        },
        {
          id: "t9_13", num: 13, name: "التدرج (الجزء الخشن) (>= 3/8\")", unit: "درجة",
          direction: "asymmetric_exec",
          exec: { mode: "asymmetric", freeTol: 0, maxDevPlus: 2, maxDevMinus: 3, deductRate: 1, textMaxDev: "+2 / -3", textRate: "1%" },
          accept: { mode: "standard", freeTol: 1, maxDev: 2, deductRate: 4, textMaxDev: "±2 بعد التفاوت المسموح بدون حسم", textRate: "4%", textFreeTol: "±1" },
          notes: "يحسب لأعلى شذوذ."
        },
        {
          id: "t9_14", num: 14, name: "التدرج (الجزء الناعم) (#4 - #10)", unit: "درجة",
          direction: "both",
          exec: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 1, textMaxDev: "±2", textRate: "1%" },
          accept: { mode: "standard", freeTol: 2, maxDev: 2, deductRate: 4, textMaxDev: "±2 بعد التفاوت المسموح بدون حسم", textRate: "4%", textFreeTol: "±2" },
          notes: "يحسب لأعلى شذوذ."
        },
        {
          id: "t9_15", num: 15, name: "التدرج (المنخل #40)", unit: "درجة",
          direction: "both",
          exec: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 2, textMaxDev: "±2", textRate: "2%" },
          accept: { mode: "standard", freeTol: 2, maxDev: 2, deductRate: 4, textMaxDev: "±2 بعد التفاوت المسموح بدون حسم", textRate: "4%", textFreeTol: "±2" }
        },
        {
          id: "t9_16", num: 16, name: "التدرج (المنخل #200)", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 1, deductRate: 3, textMaxDev: "+1", textRate: "3%" },
          accept: { mode: "standard", freeTol: 1, maxDev: 1, deductRate: 6, textMaxDev: "+1 بعد حدود المواصفة بعد الدحل وبعد التفاوت المسموح به بدون حسم", textRate: "6%", textFreeTol: "+1 بعد حدود المواصفة بعد الدحل" }
        },
        {
          id: "t9_17", num: 17, name: "درجة الرك", unit: "درجة",
          direction: "minus",
          exec: { mode: "reject_if_fail", textMaxDev: "ترفض ما لم تحقق المواصفة المطلوبة", textRate: "---" },
          accept: { mode: "standard", freeTol: 0, maxDev: 3, deductRate: 30, textMaxDev: "-3", textRate: "30%", textFreeTol: "---" }
        },
        {
          id: "t9_18", num: 18, name: "السماكة", unit: "سم",
          exec: { mode: "reject_if_fail", textMaxDev: "يجب أن تحقق متطلبات المواصفة", textRate: "---" },
          accept: { mode: "special_subbase_thickness", textMaxDev: "حسب الشرح البند رقم (2.1) صفحة رقم (18)", textRate: "نسبة وتناسب", textFreeTol: "-1 سم" }
        }
      ]
    },

    // الجدول رقم (10): الخلطة الإسفلتية للطرق الرئيسية والثانوية والقروية (صفحات 32-33)
    {
      tableNum: 10,
      roadCategory: "main",
      roadCategoryTitle: "الطرق الرئيسية والثانوية والقروية - الملحق (1)",
      title: "الجدول رقم (10): حسميات تجاوزات فحوصات الخلطة الإسفلتية (Hot Mix Asphalt / Binder & Wearing Course)",
      subtitle: "الفحوصات التي تجرى خلال التنفيذ (بما فيها فحوصات ضبط الجودة) وفحوصات الاستلام",
      defaultUnit: "م²",
      page: "32 - 33",
      footnotes: [
        "بند (8) درجة الرك: يؤخذ معدل درجة الرك لكل يوم عمل لكل طريق على حدة على أن لا تقل كل درجة رك منفردة عن 3 درجات عن الحد المطلوب.",
        "بند (9) السماكة: يتم التعامل مع نقص السماكة حسب البند (2.2.2) والجدول رقم (4) صفحة (20).",
        "بند (12، 13، 14) التدرج: يحسب الحسم لأعلى قيمة شذوذ لمنخل ضمن المجموعة."
      ],
      items: [
        {
          id: "t10_1", num: 1, name: "نسبة الإسفلت من الخليط", unit: "درجة (%)",
          direction: "asymmetric_both",
          exec: { mode: "asymmetric", freeTol: 0, maxDevMinus: 0.1, maxDevPlus: 0.2, deductRate: 2, textMaxDev: "-0.1 / +0.2 خارج حدود مجال التصميم", textRate: "2%" },
          accept: { mode: "asymmetric", freeTol: 0, maxDevMinus: 0.1, maxDevPlus: 0.2, deductRate: 2, textMaxDev: "-0.1 / +0.2 خارج حدود مجال التصميم", textRate: "2%", textFreeTol: "---" },
          notes: "في حال النقص عن الحد الأدنى يقسم الشذوذ على (0.1)، وفي حال الزيادة عن الحد الأعلى يقسم الشذوذ على (0.2)."
        },
        {
          id: "t10_2", num: 2, name: "الفراغات الهوائية (Air Voids)", unit: "درجة (%)",
          direction: "asymmetric_both",
          exec: { mode: "asymmetric", freeTol: 0, maxDevMinus: 0.5, maxDevPlus: 1.5, deductRate: 3, textMaxDev: "-0.5 / +1.5", textRate: "3%" },
          accept: { mode: "asymmetric", freeTol: 0, maxDevMinus: 0.5, maxDevPlus: 1.5, deductRate: 3, textMaxDev: "-0.5 / +1.5", textRate: "3%", textFreeTol: "---" },
          notes: "في حال النقص عن الحد الأدنى يقسم الشذوذ على (0.5)، وفي حال الزيادة عن الحد الأعلى يقسم الشذوذ على (1.5) (انظر مثال 2 صفحة 45)."
        },
        {
          id: "t10_3", num: 3, name: "الفراغات المعدنية (VMA)", unit: "درجة (%)",
          direction: "minus",
          exec: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 2, textMaxDev: "-2", textRate: "2%" },
          accept: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 2, textMaxDev: "-2", textRate: "2%", textFreeTol: "---" }
        },
        {
          id: "t10_4", num: 4, name: "الثبات (Stability)", unit: "كغم",
          exec: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة (ترفض ما لم تحقق)", textRate: "---" },
          accept: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة (ترفض ما لم تحقق)", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t10_5", num: 5, name: "الزحف (Flow)", unit: "مم",
          direction: "both",
          exec: { mode: "standard", freeTol: 0, maxDev: 1, deductRate: 1, textMaxDev: "±1", textRate: "1%" },
          accept: { mode: "standard", freeTol: 0, maxDev: 1, deductRate: 1, textMaxDev: "±1", textRate: "1%", textFreeTol: "---" }
        },
        {
          id: "t10_6", num: 6, name: "فقدان الثبات (Loss of Stability)", unit: "درجة (%)",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 5, deductRate: 4, textMaxDev: "+5", textRate: "4%" },
          accept: { mode: "standard", freeTol: 0, maxDev: 5, deductRate: 4, textMaxDev: "+5", textRate: "4%", textFreeTol: "---" }
        },
        {
          id: "t10_7", num: 7, name: "الصلادة (Stiffness)", unit: "كغم/ملم",
          direction: "minus",
          exec: { mode: "standard", freeTol: 0, maxDev: 50, deductRate: 1, textMaxDev: "-50", textRate: "1%" },
          accept: { mode: "standard", freeTol: 0, maxDev: 50, deductRate: 1, textMaxDev: "-50", textRate: "1%", textFreeTol: "---" }
        },
        {
          id: "t10_8", num: 8, name: "درجة الرك (معدل يوم العمل)", unit: "درجة (%)",
          direction: "minus",
          exec: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 30, textMaxDev: "-2 خارج حدود المواصفة المطلوبة", textRate: "30% توزع تراكمياً (15% للأولى و15% للثانية)" },
          accept: { mode: "standard", freeTol: 1, maxDev: 1, deductRate: 20, textMaxDev: "-1 خارج حدود المواصفة المطلوبة وبعد التفاوت المسموح بدون حسم", textRate: "20% للدرجة", textFreeTol: "-1" },
          notes: "يؤخذ معدل درجة الرك لكل يوم عمل لكل طريق على حدة على أن لا تقل كل درجة رك منفردة عن 3 درجات عن الحد المطلوب."
        },
        {
          id: "t10_9", num: 9, name: "السماكة", unit: "سم",
          exec: { mode: "special_asphalt_thickness", textMaxDev: "حسب الشرح البند (2.2.2) والجدول رقم (4)", textRate: "--" },
          accept: { mode: "special_asphalt_thickness", textMaxDev: "حسب الشرح البند (2.2.2) والجدول رقم (4)", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t10_10", num: 10, name: "استوائية السطح", unit: "---",
          exec: { mode: "committee_decision", textMaxDev: "----", textRate: "---" },
          accept: { mode: "committee_decision", textMaxDev: "يترك القرار للجنة الاستلام", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t10_11", num: 11, name: "مستوى الخدمة واللحامات", unit: "---",
          exec: { mode: "committee_decision", textMaxDev: "---", textRate: "---" },
          accept: { mode: "committee_decision", textMaxDev: "حسب الشرح البند (2.2.3)", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t10_12", num: 12, name: "التدرج (الجزء الخشن أكبر أو يساوي 3/8\")", unit: "درجة",
          direction: "both",
          exec: { mode: "standard", freeTol: 0, maxDev: 5, deductRate: 2, textMaxDev: "±5 خارج حدود مجال التصميم", textRate: "2%" },
          accept: { mode: "standard", freeTol: 0, maxDev: 5, deductRate: 2, textMaxDev: "±5 خارج حدود مجال التصميم", textRate: "2%", textFreeTol: "---" },
          notes: "لأعلى قيمة شذوذ لمنخل."
        },
        {
          id: "t10_13", num: 13, name: "التدرج (الجزء الناعم #4 - #20)", unit: "درجة",
          direction: "both",
          exec: { mode: "standard", freeTol: 0, maxDev: 4, deductRate: 2, textMaxDev: "±4 خارج حدود مجال التصميم", textRate: "2%" },
          accept: { mode: "standard", freeTol: 0, maxDev: 4, deductRate: 2, textMaxDev: "±4 خارج حدود مجال التصميم", textRate: "2%", textFreeTol: "---" },
          notes: "لأعلى قيمة شذوذ لمنخل."
        },
        {
          id: "t10_14", num: 14, name: "التدرج (الجزء الناعم #30 - #100)", unit: "درجة",
          direction: "both",
          exec: { mode: "standard", freeTol: 0, maxDev: 4, deductRate: 3, textMaxDev: "±4 خارج حدود مجال التصميم", textRate: "3%" },
          accept: { mode: "standard", freeTol: 0, maxDev: 4, deductRate: 3, textMaxDev: "±4 خارج حدود مجال التصميم", textRate: "3%", textFreeTol: "---" },
          notes: "لأعلى قيمة شذوذ لمنخل."
        },
        {
          id: "t10_15", num: 15, name: "التدرج (المنخل #200)", unit: "درجة",
          direction: "both",
          exec: { mode: "standard", freeTol: 0, maxDev: 1.5, deductRate: 6, textMaxDev: "±1.5 خارج حدود مجال التصميم", textRate: "6%" },
          accept: { mode: "standard", freeTol: 0.5, maxDev: 1.0, deductRate: 6, textMaxDev: "±1.0 خارج حدود مجال التصميم بعد التفاوت المسموح به بدون حسم", textRate: "6%", textFreeTol: "±0.5 خارج حدود مجال التصميم" }
        }
      ]
    },

    // الجدول رقم (11): الحصمة ذات الحجم الواحد ورمل سيلكا (صفحة 34)
    {
      tableNum: 11,
      roadCategory: "main",
      roadCategoryTitle: "الطرق الرئيسية والثانوية والقروية - الملحق (1)",
      title: "الجدول رقم (11): حسميات تجاوزات فحوصات الحصمة ذات الحجم الواحد (فولية، حمصية، عدسية، سمسمية) ورمل سيلكا",
      subtitle: "الفحوصات التي تجرى خلال التنفيذ بما فيها فحوصات ضبط الجودة",
      defaultUnit: "م³",
      page: 34,
      footnotes: [
        "1. في حال لم تطلب الفحوصات أعلاه لبعض المواد يُلغى البند الخاص بالفحص من الجدول أعلاه.",
        "2. إذا تم طلب فحوصات أخرى على المواد المشار إليها أعلاه يطبق عليها ما ورد في الجداول السابقة كُلاً حسب متطلباته."
      ],
      items: [
        {
          id: "t11_1", num: 1, name: "الحجوم الزائدة", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 3, deductRate: 3, textMaxDev: "3", textRate: "3%" },
          accept: { mode: "not_applicable", textMaxDev: "فحوصات تنفيذ وضبط جودة فقط", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t11_2", num: 2, name: "التدرج (المنخل #200)", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 1, deductRate: 6, textMaxDev: "+1", textRate: "6%" },
          accept: { mode: "not_applicable", textMaxDev: "فحوصات تنفيذ وضبط جودة فقط", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t11_3", num: 3, name: "التدرج / المناخل الأخرى", unit: "درجة",
          direction: "both",
          exec: { mode: "standard", freeTol: 0, maxDev: 7, deductRate: 5, textMaxDev: "±7", textRate: "5%" },
          accept: { mode: "not_applicable", textMaxDev: "فحوصات تنفيذ وضبط جودة فقط", textRate: "---", textFreeTol: "---" },
          notes: "يحسب لأعلى شذوذ."
        },
        {
          id: "t11_4", num: 4, name: "التآكل", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 10, textMaxDev: "+2", textRate: "10%" },
          accept: { mode: "not_applicable", textMaxDev: "فحوصات تنفيذ وضبط جودة فقط", textRate: "---", textFreeTol: "---" }
        }
      ]
    },

    // الجدول رقم (12): المواد المخلوطة لأعمال الترقيعات والتوريد لمحطات الصيانة (صفحة 35)
    {
      tableNum: 12,
      roadCategory: "main",
      roadCategoryTitle: "الطرق الرئيسية والثانوية والقروية - الملحق (1)",
      title: "الجدول رقم (12): حسميات المواد المخلوطة لأعمال الترقيعات وأعمال التوريد لمحطات الصيانة",
      subtitle: "الفحوصات التي تجرى خلال التنفيذ بما فيها فحوصات ضبط الجودة",
      defaultUnit: "م³",
      page: 35,
      footnotes: [
        "1. في حال لم تطلب الفحوصات أعلاه لبعض المواد يُلغى البند الخاص بالفحص من الجدول أعلاه.",
        "2. إذا تم طلب فحوصات أخرى على المواد المشار إليها أعلاه يطبق عليها ما ورد في الجداول السابقة كُلاً حسب متطلباته."
      ],
      items: [
        {
          id: "t12_1", num: 1, name: "الحجوم الزائدة", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 3, deductRate: 3, textMaxDev: "3", textRate: "3%" },
          accept: { mode: "not_applicable", textMaxDev: "فحوصات تنفيذ وضبط جودة فقط", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t12_2", num: 2, name: "التدرج (المنخل #200)", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 1, deductRate: 6, textMaxDev: "+1", textRate: "6%" },
          accept: { mode: "not_applicable", textMaxDev: "فحوصات تنفيذ وضبط جودة فقط", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t12_3", num: 3, name: "التدرج / المناخل الأخرى", unit: "درجة",
          direction: "both",
          exec: { mode: "standard", freeTol: 0, maxDev: 7, deductRate: 5, textMaxDev: "±7", textRate: "5%" },
          accept: { mode: "not_applicable", textMaxDev: "فحوصات تنفيذ وضبط جودة فقط", textRate: "---", textFreeTol: "---" },
          notes: "يحسب لأعلى شذوذ."
        },
        {
          id: "t12_4", num: 4, name: "التآكل", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 10, textMaxDev: "+2", textRate: "10%" },
          accept: { mode: "not_applicable", textMaxDev: "فحوصات تنفيذ وضبط جودة فقط", textRate: "---", textFreeTol: "---" }
        }
      ]
    },

    // ==================== الملحق رقم (2): الطرق الزراعية ====================
    // الجدول رقم (13): مواد Topping للطرق الزراعية (صفحة 37)
    {
      tableNum: 13,
      roadCategory: "agricultural",
      roadCategoryTitle: "الطرق الزراعية - الملحق (2)",
      title: "الجدول رقم (13): حسميات تجاوزات فحوصات مواد (Topping) - الطرق الزراعية",
      subtitle: "الفحوصات التي تجرى خلال التنفيذ (بما فيها فحوصات ضبط الجودة) وفحوصات الاستلام",
      defaultUnit: "م³",
      page: 37,
      footnotes: [
        "1. إذا تم أخذ عينات ضبط الجودة (مواد ورك) بعد دحل المواد وحققت درجة الرك المطلوبة في العطاء يطبق عليها التفاوتات الواردة في بند الفحوصات التي تجرى خلال الاستلام وخلاف ذلك يتم تطبيق التفاوتات أثناء التنفيذ.",
        "2. في حال تم أخذ العينات من قبل مختبر التنفيذ بعد الدحل يطبق عليها التفاوتات التي تجرى خلال التنفيذ.",
        "(*) على أن لا يتجاوز البعد الأقصى عند ثلثي السماكة.",
        "(**) في حال كانت النتيجة أقل من هذه القيمة فيجب أن يتم إعادة الفحص في مختبرين بواقع عينتين في كل مختبر وتقيم النتائج استناداً لمعدل النتائج الواقعة ضمن حدود الدقة المسموحة في مواصفة الفحص."
      ],
      items: [
        {
          id: "t13_1", num: 1, name: "الحجم الأقصى", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 5, deductRate: 1, textMaxDev: "5(*)", textRate: "1%" },
          accept: { mode: "standard", freeTol: 0, maxDev: 5, deductRate: 1, textMaxDev: "5(*)", textRate: "1%", textFreeTol: "---" }
        },
        {
          id: "t13_2", num: 2, name: "نسبة تحمل كاليفورنيا (CBR)", unit: "درجة",
          direction: "minus",
          exec: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة", textRate: "---" },
          accept: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 44, textMaxDev: "-2 (**)", textRate: "44%", textFreeTol: "---" }
        },
        {
          id: "t13_3", num: 3, name: "معامل اللدونة (PI)", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 1, deductRate: 6, textMaxDev: "+1", textRate: "6%" },
          accept: { mode: "standard", freeTol: 1, maxDev: 1, deductRate: 6, textMaxDev: "+1 بعد التفاوت المسموح بدون حسم", textRate: "6%", textFreeTol: "+1" }
        },
        {
          id: "t13_4", num: 4, name: "درجة الرك", unit: "درجة",
          direction: "minus",
          exec: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة", textRate: "---" },
          accept: { mode: "standard", freeTol: 0, maxDev: 3, deductRate: 30, textMaxDev: "-3", textRate: "30%", textFreeTol: "---" }
        },
        {
          id: "t13_5", num: 5, name: "المار من منخل (#200)", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 1, deductRate: 2, textMaxDev: "+1", textRate: "2%" },
          accept: { mode: "standard", freeTol: 3, maxDev: 1, deductRate: 2, textMaxDev: "+1 بعد التفاوت المسموح بدون حسم", textRate: "2%", textFreeTol: "+3" }
        },
        {
          id: "t13_6", num: 6, name: "السماكة", unit: "سم",
          exec: { mode: "spec_compliance", textMaxDev: "الالتزام بما جاء في المواصفات", textRate: "---" },
          accept: { mode: "spec_compliance", textMaxDev: "الالتزام بما جاء في المواصفات", textRate: "---", textFreeTol: "---" }
        }
      ]
    },

    // الجدول رقم (14): الفرشيات للطرق الزراعية (صفحات 38-39)
    {
      tableNum: 14,
      roadCategory: "agricultural",
      roadCategoryTitle: "الطرق الزراعية - الملحق (2)",
      title: "الجدول رقم (14): حسميات تجاوزات فحوصات الفرشيات (Sub-base & Base Course) - الطرق الزراعية",
      subtitle: "الفحوصات التي تجرى خلال التنفيذ (بما فيها فحوصات ضبط الجودة) وفحوصات الاستلام",
      defaultUnit: "م³",
      page: "38 - 39",
      footnotes: [
        "1. إذا تم أخذ عينات ضبط الجودة (مواد ورك) بعد دحل المواد وحققت درجة الرك المطلوبة في العطاء يطبق عليها التفاوتات الواردة في بند الفحوصات التي تجرى خلال الاستلام وخلاف ذلك يتم تطبيق التفاوتات أثناء التنفيذ.",
        "2. في حال تم أخذ العينات من قبل مختبر التنفيذ بعد الدحل يطبق عليها التفاوتات التي تجرى خلال التنفيذ.",
        "(*) في حال كانت النتيجة أقل من هذه القيمة فيجب أن يتم إعادة الفحص في مختبرين بواقع عينتين في كل مختبر وتُقيّم النتائج استناداً لمعدل النتائج الواقعة ضمن حدود الدقة المسموحة بالمواصفة."
      ],
      items: [
        {
          id: "t14_1", num: 1, name: "نسبة تحمل كاليفورنيا (CBR)", unit: "درجة",
          direction: "minus",
          exec: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 25, textMaxDev: "-2 من حد المواصفة", textRate: "25%" },
          accept: { mode: "standard", freeTol: 0, maxDev: 5, deductRate: 25, textMaxDev: "-5 من حد المواصفة (*)", textRate: "25%", textFreeTol: "---" }
        },
        {
          id: "t14_2", num: 2, name: "معامل اللدونة (PI)", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 6, textMaxDev: "+2", textRate: "6%" },
          accept: { mode: "standard", freeTol: 1, maxDev: 1, deductRate: 8, textMaxDev: "+1 بعد التفاوت المسموح بدون حسم", textRate: "8%", textFreeTol: "+1" }
        },
        {
          id: "t14_3", num: 3, name: "التآكل على 500 دورة", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 3, deductRate: 10, textMaxDev: "+3", textRate: "10%" },
          accept: { mode: "standard", freeTol: 1, maxDev: 2, deductRate: 10, textMaxDev: "+2 بعد التفاوت المسموح بدون حسم", textRate: "10%", textFreeTol: "+1" }
        },
        {
          id: "t14_4", num: 4, name: "الأوجه المكسرة", unit: "درجة",
          direction: "minus",
          exec: { mode: "standard", freeTol: 0, maxDev: 5, deductRate: 1, textMaxDev: "-5", textRate: "1%" },
          accept: { mode: "not_applicable", textMaxDev: "---", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t14_5", num: 5, name: "التدرج: الحجوم الزائدة", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 3, deductRate: 3, textMaxDev: "+3", textRate: "3%" },
          accept: { mode: "standard", freeTol: 1, maxDev: 2, deductRate: 3, textMaxDev: "+2 بعد التفاوت المسموح بدون حسم", textRate: "3%", textFreeTol: "+1" },
          notes: "على أن لا يزيد الحجم عن 3 إنش."
        },
        {
          id: "t14_6", num: 6, name: "التدرج (الجزء الخشن) (>= 3/8\")", unit: "درجة",
          direction: "asymmetric_exec",
          exec: { mode: "asymmetric", freeTol: 0, maxDevPlus: 2, maxDevMinus: 3, deductRate: 1, textMaxDev: "+2 / -3", textRate: "1%" },
          accept: { mode: "standard", freeTol: 1, maxDev: 2, deductRate: 4, textMaxDev: "±2 بعد التفاوت المسموح بدون حسم", textRate: "4%", textFreeTol: "±1" },
          notes: "لأعلى قيمة شذوذ للمنخل."
        },
        {
          id: "t14_7", num: 7, name: "التدرج (الجزء الناعم) (#4 - #10)", unit: "درجة",
          direction: "both",
          exec: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 1, textMaxDev: "±2", textRate: "1%" },
          accept: { mode: "standard", freeTol: 2, maxDev: 2, deductRate: 4, textMaxDev: "±2 بعد التفاوت المسموح بدون حسم", textRate: "4%", textFreeTol: "±2" },
          notes: "لأعلى قيمة شذوذ للمنخل."
        },
        {
          id: "t14_8", num: 8, name: "التدرج (المنخل #40)", unit: "درجة",
          direction: "both",
          exec: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 2, textMaxDev: "±2", textRate: "2%" },
          accept: { mode: "standard", freeTol: 2, maxDev: 2, deductRate: 4, textMaxDev: "±2 بعد التفاوت المسموح بدون حسم", textRate: "4%", textFreeTol: "±2" }
        },
        {
          id: "t14_9", num: 9, name: "التدرج (المنخل #200)", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 1, deductRate: 3, textMaxDev: "+1", textRate: "3%" },
          accept: { mode: "standard", freeTol: 1, maxDev: 1, deductRate: 6, textMaxDev: "+1 بعد حدود المواصفة بعد الدحل وبعد التفاوت المسموح به بدون حسم", textRate: "6%", textFreeTol: "+1 بعد حدود المواصفة بعد الدحل" }
        },
        {
          id: "t14_10", num: 10, name: "درجة الرك", unit: "درجة",
          direction: "minus",
          exec: { mode: "reject_if_fail", textMaxDev: "ترفض ما لم تحقق المواصفة", textRate: "---" },
          accept: { mode: "standard", freeTol: 0, maxDev: 3, deductRate: 30, textMaxDev: "-3", textRate: "30%", textFreeTol: "---" }
        },
        {
          id: "t14_11", num: 11, name: "السماكة", unit: "سم",
          exec: { mode: "reject_if_fail", textMaxDev: "يجب أن تحقق متطلبات المواصفة", textRate: "---" },
          accept: { mode: "special_subbase_thickness", textMaxDev: "حسب الشرح البند رقم (2.1) صفحة رقم (18)", textRate: "نسبة وتناسب", textFreeTol: "-1 سم" }
        }
      ]
    },

    // الجدول رقم (15): الخلطة الإسفلتية للطرق الزراعية (صفحات 40-41)
    {
      tableNum: 15,
      roadCategory: "agricultural",
      roadCategoryTitle: "الطرق الزراعية - الملحق (2)",
      title: "الجدول رقم (15): حسميات تجاوزات فحوصات الخلطة الإسفلتية (Hot Mix Asphalt / Wearing Course) - الطرق الزراعية",
      subtitle: "الفحوصات التي تجرى خلال التنفيذ (بما فيها فحوصات ضبط الجودة) وفحوصات الاستلام",
      defaultUnit: "م²",
      page: "40 - 41",
      footnotes: [
        "بند (8) درجة الرك: يؤخذ معدل درجة الرك لكل يوم عمل لكل طريق على حدة وكل درجة رك منفردة لا تقل عن 3 درجات عن الحد المطلوب.",
        "بند (9) السماكة: حسب الشرح البند (2.2.2) والجدول رقم (4)."
      ],
      items: [
        {
          id: "t15_1", num: 1, name: "نسبة الإسفلت من الخليط", unit: "درجة (%)",
          direction: "asymmetric_both",
          exec: { mode: "asymmetric", freeTol: 0, maxDevMinus: 0.1, maxDevPlus: 0.2, deductRate: 2, textMaxDev: "-0.1 / +0.2 خارج حدود مجال التصميم", textRate: "2%" },
          accept: { mode: "asymmetric", freeTol: 0, maxDevMinus: 0.1, maxDevPlus: 0.2, deductRate: 2, textMaxDev: "-0.1 / +0.2 خارج حدود مجال التصميم", textRate: "2%", textFreeTol: "---" }
        },
        {
          id: "t15_2", num: 2, name: "الفراغات الهوائية", unit: "درجة (%)",
          direction: "asymmetric_both",
          exec: { mode: "asymmetric", freeTol: 0, maxDevMinus: 0.5, maxDevPlus: 1.5, deductRate: 3, textMaxDev: "-0.5 / +1.5", textRate: "3%" },
          accept: { mode: "asymmetric", freeTol: 0, maxDevMinus: 0.5, maxDevPlus: 1.5, deductRate: 3, textMaxDev: "-0.5 / +1.5", textRate: "3%", textFreeTol: "---" }
        },
        {
          id: "t15_3", num: 3, name: "الفراغات المعدنية", unit: "درجة (%)",
          direction: "minus",
          exec: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 2, textMaxDev: "-2", textRate: "2%" },
          accept: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 2, textMaxDev: "-2", textRate: "2%", textFreeTol: "---" }
        },
        {
          id: "t15_4", num: 4, name: "الثبات", unit: "كغم",
          exec: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة المطلوبة", textRate: "---" },
          accept: { mode: "reject_if_fail", textMaxDev: "غير مسموح / يجب أن يحقق المواصفة المطلوبة", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t15_5", num: 5, name: "الزحف", unit: "ملم",
          direction: "both",
          exec: { mode: "standard", freeTol: 0, maxDev: 1, deductRate: 1, textMaxDev: "±1", textRate: "1%" },
          accept: { mode: "standard", freeTol: 0, maxDev: 1, deductRate: 1, textMaxDev: "±1", textRate: "1%", textFreeTol: "---" }
        },
        {
          id: "t15_6", num: 6, name: "فقدان الثبات", unit: "درجة (%)",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 5, deductRate: 4, textMaxDev: "+5", textRate: "4%" },
          accept: { mode: "standard", freeTol: 0, maxDev: 5, deductRate: 4, textMaxDev: "+5", textRate: "4%", textFreeTol: "---" }
        },
        {
          id: "t15_7", num: 7, name: "الصلادة (Stiffness)", unit: "كغم/مم",
          direction: "minus",
          exec: { mode: "standard", freeTol: 0, maxDev: 50, deductRate: 1, textMaxDev: "-50", textRate: "1%" },
          accept: { mode: "standard", freeTol: 0, maxDev: 50, deductRate: 1, textMaxDev: "-50", textRate: "1%", textFreeTol: "---" }
        },
        {
          id: "t15_8", num: 8, name: "درجة الرك", unit: "درجة (%)",
          direction: "minus",
          // التعديل المعتمد: التجاوز المسموح مع حسم (التنفيذ) = -3،
          // نسبة الحسم: 5% للدرجة الأولى + 15% للثانية + 30% للثالثة (المجموع 50% تراكمياً).
          exec: {
            mode: "tiered_degrees", freeTol: 0, maxDev: 3, deductRate: 50,
            tiers: [{ upTo: 1, rate: 5 }, { upTo: 2, rate: 15 }, { upTo: 3, rate: 30 }],
            textMaxDev: "-3 خارج حدود المواصفة المطلوبة",
            textRate: "50% توزع (تراكمياً) 5% للأولى و15% للثانية و30% للثالثة"
          },
          accept: { mode: "standard", freeTol: 1, maxDev: 1, deductRate: 20, textMaxDev: "-1 خارج حدود المواصفة المطلوبة وبعد التفاوت المسموح بدون حسم", textRate: "20% للدرجة", textFreeTol: "-1" }
        },
        {
          id: "t15_9", num: 9, name: "السماكة", unit: "سم",
          exec: { mode: "special_asphalt_thickness", textMaxDev: "حسب الشرح البند (2.2.2)", textRate: "---" },
          accept: { mode: "special_asphalt_thickness", textMaxDev: "حسب الشرح البند (2.2.2)", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t15_10", num: 10, name: "استوائية السطح", unit: "---",
          exec: { mode: "committee_decision", textMaxDev: "---", textRate: "---" },
          accept: { mode: "committee_decision", textMaxDev: "يترك القرار للجنة الاستلام", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t15_11", num: 11, name: "مستوى الخدمة واللحامات", unit: "---",
          exec: { mode: "committee_decision", textMaxDev: "---", textRate: "---" },
          accept: { mode: "committee_decision", textMaxDev: "حسب الشرح البند (2.2.3)", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t15_12", num: 12, name: "التدرج (الجزء الخشن أكبر أو يساوي 3/8\")", unit: "درجة",
          direction: "both",
          exec: { mode: "standard", freeTol: 0, maxDev: 5, deductRate: 2, textMaxDev: "±5 خارج حدود مجال التصميم", textRate: "2%" },
          accept: { mode: "standard", freeTol: 0, maxDev: 5, deductRate: 2, textMaxDev: "±5 خارج حدود مجال التصميم", textRate: "2%", textFreeTol: "---" }
        },
        {
          id: "t15_13", num: 13, name: "التدرج (الجزء الناعم #4 - #20)", unit: "درجة",
          direction: "both",
          exec: { mode: "standard", freeTol: 0, maxDev: 4, deductRate: 2, textMaxDev: "±4 خارج حدود مجال التصميم", textRate: "2%" },
          accept: { mode: "standard", freeTol: 0, maxDev: 4, deductRate: 2, textMaxDev: "±4 خارج حدود مجال التصميم", textRate: "2%", textFreeTol: "---" }
        },
        {
          id: "t15_14", num: 14, name: "التدرج (الجزء الناعم #30 - #100)", unit: "درجة",
          direction: "both",
          exec: { mode: "standard", freeTol: 0, maxDev: 4, deductRate: 3, textMaxDev: "±4 خارج حدود مجال التصميم", textRate: "3%" },
          accept: { mode: "standard", freeTol: 0, maxDev: 4, deductRate: 3, textMaxDev: "±4 خارج حدود مجال التصميم", textRate: "3%", textFreeTol: "---" }
        },
        {
          id: "t15_15", num: 15, name: "المار من (المنخل #200)", unit: "درجة",
          direction: "both",
          exec: { mode: "standard", freeTol: 0, maxDev: 1.5, deductRate: 6, textMaxDev: "±1.5 خارج حدود مجال التصميم", textRate: "6%" },
          accept: { mode: "standard", freeTol: 0.5, maxDev: 1.0, deductRate: 6, textMaxDev: "±1.0 خارج حدود مجال التصميم وبعد التفاوت المسموح به بدون حسم", textRate: "6%", textFreeTol: "±0.5 خارج حدود مجال التصميم" }
        }
      ]
    },

    // الجدول رقم (16): الحصمة للوجه الختامي الأول والثاني للطرق الزراعية (صفحة 42)
    {
      tableNum: 16,
      roadCategory: "agricultural",
      roadCategoryTitle: "الطرق الزراعية - الملحق (2)",
      title: "الجدول رقم (16): حسميات تجاوزات فحوصات الحصمة للوجه الختامي الأول والوجه الختامي الثاني",
      subtitle: "الفحوصات التي تجرى خلال التنفيذ بما فيها فحوصات ضبط الجودة",
      defaultUnit: "م²",
      page: 42,
      footnotes: [
        "1. في حال لم تطلب الفحوصات أعلاه لبعض المواد يُلغى البند الخاص بالفحص من الجدول أعلاه.",
        "2. إذا تم طلب فحوصات أخرى على المواد المشار إليها أعلاه يطبق عليها ما ورد في الجداول السابقة كُلاً حسب متطلباته."
      ],
      items: [
        {
          id: "t16_1", num: 1, name: "الحجوم الزائدة", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 3, deductRate: 3, textMaxDev: "3", textRate: "3%" },
          accept: { mode: "not_applicable", textMaxDev: "فحوصات تنفيذ وضبط جودة فقط", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t16_2", num: 2, name: "التدرج (المنخل #200)", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 1, deductRate: 6, textMaxDev: "+1", textRate: "6%" },
          accept: { mode: "not_applicable", textMaxDev: "فحوصات تنفيذ وضبط جودة فقط", textRate: "---", textFreeTol: "---" }
        },
        {
          id: "t16_3", num: 3, name: "التدرج / المناخل الأخرى", unit: "درجة",
          direction: "both",
          exec: { mode: "standard", freeTol: 0, maxDev: 7, deductRate: 5, textMaxDev: "±7", textRate: "5%" },
          accept: { mode: "not_applicable", textMaxDev: "فحوصات تنفيذ وضبط جودة فقط", textRate: "---", textFreeTol: "---" },
          notes: "يحسب لأعلى شذوذ."
        },
        {
          id: "t16_4", num: 4, name: "التآكل", unit: "درجة",
          direction: "plus",
          exec: { mode: "standard", freeTol: 0, maxDev: 2, deductRate: 10, textMaxDev: "+2", textRate: "10%" },
          accept: { mode: "not_applicable", textMaxDev: "فحوصات تنفيذ وضبط جودة فقط", textRate: "---", textFreeTol: "---" }
        }
      ]
    }
  ],

  // ==================== الملحق رقم (3): الأمثلة التوضيحية (صفحات 44 - 49) ====================
  examples: [
    {
      id: "ex_subbase_1",
      category: "أولاً: أمثلة على حسميات تجاوزات فحوصات الفرشيات (Sub base & Base Course)",
      title: "مثال رقم (1) - صفحة 44: فحص CBR للفرشيات (عينة تنفيذ + عينة ضبط جودة)",
      page: 44,
      problemText: [
        "عينة تنفيذ: وجود نقص في نسبة تحمل كاليفورنيا (CBR) بمقدار (1) عن الحد الأدنى المطلوب.",
        "عينة ضبط الجودة: نقص في نسبة تحمل كاليفورنيا (CBR) بمقدار (2) عن الحد الأدنى المطلوب.",
        "(لا يوجد عينة استلام -> الحالة رقم 3 من الجدول رقم 3: وزن التنفيذ = 60%، وزن ضبط الجودة = 40%).",
        "من الجدول رقم (9) بند (1): نسبة الحسم (ن) = 25%، التجاوز المسموح مع حسم أثناء التنفيذ وضبط الجودة (ح) = 2."
      ],
      unitA: "m³",
      unitB: "JD/m³",
      defaultA: 1000,
      defaultB: 12,
      equations: [
        "قيمة الحسم على عينة التنفيذ (C) = A × B × (25/100) × (1/2) × (60/100)",
        "قيمة الحسم على عينة ضبط الجودة (D) = A × B × (25/100) × (2/2) × (40/100)",
        "مقدار الحسم الكلي على شذوذ C.B.R = C + D"
      ],
      compute: (A, B) => {
        const C = A * B * (25 / 100) * (1 / 2) * (60 / 100);
        const D = A * B * (25 / 100) * (2 / 2) * (40 / 100);
        const total = C + D;
        return {
          steps: [
            { label: "قيمة الحسم على عينة التنفيذ (C)", formula: `${A} × ${B} × (25/100) × (1/2) × (60/100)`, value: C },
            { label: "قيمة الحسم على عينة ضبط الجودة (D)", formula: `${A} × ${B} × (25/100) × (2/2) × (40/100)`, value: D },
            { label: "مقدار الحسم الكلي على شذوذ C.B.R (C + D)", formula: `${C.toFixed(3)} + ${D.toFixed(3)}`, value: total, isTotal: true }
          ],
          effectiveFactor: (25 / 100) * (1 / 2) * (60 / 100) + (25 / 100) * (2 / 2) * (40 / 100) // 0.075 + 0.10 = 0.175 (17.5%)
        };
      },
      presetMainCalc: {
        roadCategory: "main",
        tableNum: 9,
        itemId: "t9_1",
        weightCase: 3,
        devExec: 1,
        devQC: 2,
        devAccept: 0
      }
    },
    {
      id: "ex_subbase_2",
      category: "أولاً: أمثلة على حسميات تجاوزات فحوصات الفرشيات (Sub base & Base Course)",
      title: "مثال رقم (2) - صفحة 44: فحص درجة الرك للفرشيات (عينة استلام)",
      page: 44,
      problemText: [
        "وجود نقص في درجة الرك لعينة استلام بمقدار (2)% عن الحد المطلوب / عينة تنفيذ مطابقة للمواصفات ولا يوجد عينة ضبط جودة.",
        "(تطبق الحالة رقم 2 من الجدول رقم 3: وزن التنفيذ = 60% حسمه صفر لأنها مطابقة، وزن الاستلام = 40%).",
        "من الجدول رقم (9) بند (17): نسبة الحسم لدرجة الرك في الاستلام (ن) = 30%، التجاوز المسموح مع حسم (ح) = 3."
      ],
      unitA: "m³",
      unitB: "JD/m³",
      defaultA: 1000,
      defaultB: 12,
      equations: [
        "قيمة الحسم على عينة الاستلام = A × B × (40/100) × (30/100) × (2/3)"
      ],
      compute: (A, B) => {
        const val = A * B * (40 / 100) * (30 / 100) * (2 / 3);
        return {
          steps: [
            { label: "قيمة الحسم على عينة التنفيذ", formula: "مطابقة للمواصفات = 0", value: 0 },
            { label: "قيمة الحسم على عينة الاستلام", formula: `${A} × ${B} × (40/100) × (30/100) × (2/3)`, value: val, isTotal: true }
          ],
          effectiveFactor: (40 / 100) * (30 / 100) * (2 / 3) // 0.08 (8%)
        };
      },
      presetMainCalc: {
        roadCategory: "main",
        tableNum: 9,
        itemId: "t9_17",
        weightCase: 2,
        devExec: 0,
        devQC: 0,
        devAccept: 2
      }
    },
    {
      id: "ex_asphalt_1",
      category: "ثانياً: أمثلة على حسميات تجاوزات فحوصات بند الخلطة الإسفلتية للطرق الرئيسية والقروية والثانوية",
      title: "مثال رقم (1) - صفحة 45: نقص في نسبة الإسفلت من الخليط (عينة تنفيذ فقط)",
      page: 45,
      problemText: [
        "وجود نقص في نسبة الإسفلت من الخليط بمقدار (0.1)% عن الحد الأدنى المطلوب في المواصفة لعينة التنفيذ ولا يوجد عينة ضبط جودة أو استلام.",
        "(تطبق الحالة رقم 4 من الجدول رقم 3: وزن التنفيذ = 100%).",
        "من الجدول رقم (10) بند (1): نسبة الحسم (ن) = 2%، التجاوز المسموح للنقص (ح) = 0.1."
      ],
      unitA: "m²",
      unitB: "JD/m²",
      defaultA: 2000,
      defaultB: 6.5,
      equations: [
        "قيمة الحسم على عينة التنفيذ (C) = A × B × (2/100) × (0.1/0.1) × (100/100)"
      ],
      compute: (A, B) => {
        const C = A * B * (2 / 100) * (0.1 / 0.1) * (100 / 100);
        return {
          steps: [
            { label: "قيمة الحسم على عينة التنفيذ (C)", formula: `${A} × ${B} × (2/100) × (0.1/0.1) × (100/100)`, value: C, isTotal: true }
          ],
          effectiveFactor: 0.02 // 2%
        };
      },
      presetMainCalc: {
        roadCategory: "main",
        tableNum: 10,
        itemId: "t10_1",
        deviationType: "minus",
        weightCase: 4,
        devExec: 0.1,
        devQC: 0,
        devAccept: 0
      }
    },
    {
      id: "ex_asphalt_2",
      category: "ثانياً: أمثلة على حسميات تجاوزات فحوصات بند الخلطة الإسفلتية للطرق الرئيسية والقروية والثانوية",
      title: "مثال رقم (2) - صفحة 45: شذوذ في نسبة الفراغات الهوائية (زيادة في التنفيذ + نقص في ضبط الجودة)",
      page: 45,
      problemText: [
        "وجود زيادة في نسبة الفراغات الهوائية بمقدار (0.8)% عن الحد الأعلى المطلوب لعينة التنفيذ، ووجود نقص في نسبة الفراغات الهوائية بمقدار (0.3)% عن الحد الأدنى المطلوب لعينة ضبط الجودة ولا يوجد عينة استلام.",
        "(تطبق الحالة رقم 3 من الجدول رقم 3: وزن التنفيذ = 60%، وزن ضبط الجودة = 40%).",
        "من الجدول رقم (10) بند (2): نسبة الحسم (ن) = 3%، التجاوز المسموح للزيادة (ح+) = 1.5، والتجاوز المسموح للنقص (ح-) = 0.5."
      ],
      unitA: "m²",
      unitB: "JD/m²",
      defaultA: 2000,
      defaultB: 6.5,
      equations: [
        "قيمة الحسم على عينة التنفيذ (C) = A × B × (3/100) × (0.8/1.5) × (60/100)",
        "قيمة الحسم على عينة ضبط الجودة (D) = A × B × (3/100) × (0.3/0.5) × (40/100)",
        "مقدار الحسم الكلي = C + D"
      ],
      compute: (A, B) => {
        const C = A * B * (3 / 100) * (0.8 / 1.5) * (60 / 100);
        const D = A * B * (3 / 100) * (0.3 / 0.5) * (40 / 100);
        const total = C + D;
        return {
          steps: [
            { label: "قيمة الحسم على عينة التنفيذ (C) [زيادة 0.8 / 1.5]", formula: `${A} × ${B} × (3/100) × (0.8/1.5) × (60/100)`, value: C },
            { label: "قيمة الحسم على عينة ضبط الجودة (D) [نقص 0.3 / 0.5]", formula: `${A} × ${B} × (3/100) × (0.3/0.5) × (40/100)`, value: D },
            { label: "مقدار الحسم الكلي (C + D)", formula: `${C.toFixed(3)} + ${D.toFixed(3)}`, value: total, isTotal: true }
          ],
          effectiveFactor: (3 / 100) * (0.8 / 1.5) * (60 / 100) + (3 / 100) * (0.3 / 0.5) * (40 / 100)
        };
      },
      presetMainCalc: {
        roadCategory: "main",
        tableNum: 10,
        itemId: "t10_2",
        weightCase: 3,
        devExec: 0.8,
        dirExec: "plus",
        devQC: 0.3,
        dirQC: "minus",
        devAccept: 0
      }
    },
    {
      id: "ex_thick_1",
      category: "ثالثاً: أمثلة توضيحية على النقص في السماكة في طبقات الخلطة الإسفلتية حسب الجدول رقم (4) صفحة 20",
      title: "مثال رقم (1) على البند رقم (1) / كورات تنفيذ - صفحة 46",
      page: 46,
      problemText: [
        "طول المشروع (7) كم، عدد الكورات لكامل المشروع = 35 كور.",
        "عدد الكورات التي يوجد فيها نقص ولا يتجاوز النقص عن ما هو موضح في الجدول (4) البند رقم (1) [أي ضمن 3مم لطبقة واحدة] = 3 كور.",
        "نسبة عدد الكورات التي يوجد فيها نقص إلى عدد الكورات لكامل المشروع = 35 × (10/100) = 3.5 كور، ويقرب إلى أقرب عدد صحيح (4).",
        "بما أن عدد الكورات الناقصة (3) لم يتجاوز النسبة المسموحة (4 كورات = 10%): مقبول بدون حسم لكل الطبقات."
      ],
      unitA: "m² (المساحة الممثلة للكور)",
      unitB: "JD/m²",
      defaultA: 1400,
      defaultB: 6.5,
      equations: [
        "العدد المسموح للكورات ضمن التفاوت (10%) = تقريب(35 × 0.10) = تقريب(3.5) = 4 كورات",
        "عدد الكورات الفعلية التي فيها نقص طفيف (3 كورات) ≤ 4 كورات",
        "النتيجة: مقبول بدون حسم لكل الطبقات (مقدار الحسم = 0 دينار)"
      ],
      compute: (A, B) => {
        return {
          steps: [
            { label: "حساب حد الـ 10% من كورات المشروع", formula: "35 × (10/100) = 3.5 ← يقرب إلى (4) كورات", value: 4, isCount: true },
            { label: "مقارنة الكورات الناقصة (3 كورات) بالحد المسموح (4 كورات)", formula: "النسبة لم تتجاوز (10%) - مقبول بدون حسم", value: 0, isTotal: true }
          ],
          effectiveFactor: 0
        };
      }
    },
    {
      id: "ex_thick_2a",
      category: "ثالثاً: أمثلة توضيحية على النقص في السماكة في طبقات الخلطة الإسفلتية حسب الجدول رقم (4) صفحة 20",
      title: "مثال رقم (2) على البند رقم (2/A) / كورات تنفيذ - صفحة 46",
      page: 46,
      problemText: [
        "طول المشروع (7) كم، السماكة المطلوبة = 5 سم (طبقة واحدة: السماح بدون حسم = 3 مم = 0.3 سم).",
        "عدد الكورات لكامل المشروع = 35 كور.",
        "عدد الكورات التي يوجد فيها نقص ولا يتجاوز النقص عن ما هو موضح في الجدول (4) البند رقم (2) = 6 كور:",
        "الكور رقم (1) = 4.7 سم ، الكور رقم (2) = 4.8 سم ، الكور رقم (3) = 4.9 سم ، الكور رقم (4) = 4.7 سم ، الكور رقم (5) = 4.7 سم ، الكور رقم (6) = 4.9 سم.",
        "نسبة 10% من الكورات = 35 × (10/100) = 3.5 كور ويقرب إلى أقرب عدد صحيح (4).",
        "النسبة تزيد عن 10% -> مقبول مع حسم على ما يزيد عن 10% من عدد الكورات الكلي: 6 - 4 = 2 كورات (لأعلى قيمة شذوذ).",
        "مقدار الحسم يطبق على الكورين ذوي أعلى شذوذ (نقص 0.3 سم لكل منهما، مثل الكورات رقم 1 ورقم 4)."
      ],
      unitA: "m² (المساحة الممثلة للكور الواحد)",
      unitB: "JD/m²",
      defaultA: 1400,
      defaultB: 6.5,
      equations: [
        "عدد الكورات الخاضعة للحسم = 6 - 4 = 2 كورات (لأعلى قيمة شذوذ: 5.0 - 4.7 = 0.3 سم)",
        "مقدار الحسم للكور الواحد = (مقدار النقص في السماكة / السماكة المطلوبة) × المساحة الممثلة للكور × السعر = (0.3 / 5) × A × B",
        "مقدار الحسم الكلي (لكورين) = 2 × (0.3 / 5) × A × B"
      ],
      compute: (A, B) => {
        const c1 = (0.3 / 5) * A * B;
        const c2 = (0.3 / 5) * A * B;
        const total = c1 + c2;
        return {
          steps: [
            { label: "الكورات المعفاة ضمن نسبة 10% (4 كورات)", formula: "4 كورات بدون حسم", value: 0 },
            { label: "مقدار الحسم على الكور الأول (4.7 سم - نقص 0.3 سم)", formula: `(0.3 / 5) × ${A} × ${B}`, value: c1 },
            { label: "مقدار الحسم على الكور الثاني (4.7 سم - نقص 0.3 سم)", formula: `(0.3 / 5) × ${A} × ${B}`, value: c2 },
            { label: "إجمالي الحسم للكورين الزائدين عن نسبة 10%", formula: `${c1.toFixed(3)} + ${c2.toFixed(3)}`, value: total, isTotal: true }
          ],
          effectiveFactor: 2 * (0.3 / 5)
        };
      }
    },
    {
      id: "ex_thick_2b",
      category: "ثالثاً: أمثلة توضيحية على النقص في السماكة في طبقات الخلطة الإسفلتية حسب الجدول رقم (4) صفحة 20",
      title: "مثال على البند رقم (2/B) / كورات تنفيذ - صفحة 47",
      page: 47,
      problemText: [
        "طول المشروع (7) كم، السماكة المطلوبة = 5 سم، عدد الكورات لكامل المشروع = 34 كور.",
        "نسبة 10% من الكورات = 34 × (10/100) = 3.4 ويقرب إلى أقرب عدد صحيح (3 كورات).",
        "الكور رقم (1) = 4.7 سم (بدون حسم - كور 1 من 3).",
        "الكور رقم (2) = 4.8 سم (بدون حسم - كور 2 من 3).",
        "الكور رقم (3) = 4.5 سم (النقص 0.5 سم: يتم الحسم على 0.2 سم فقط بعد طرح السماح 0.3 سم كون هذا الكور يكمل نسبة 10% أي الكور الثالث!).",
        "الكور رقم (4) = 4.5 سم (الحسم على كامل النقص 0.5 سم كون هذا الكور تجاوز نسبة 10% من عدد الكورات)."
      ],
      unitA: "m² (المساحة الممثلة للكور الواحد)",
      unitB: "JD/m²",
      defaultA: 1400,
      defaultB: 6.5,
      equations: [
        "الكور (1) = 4.7 سم والكور (2) = 4.8 سم: بدون حسم (ضمن الـ 3 كورات المسموحة)",
        "الكور (3) = 4.5 سم (يكمل نسبة 10%): الحسم على (0.5 - 0.3 = 0.2 سم) = (0.2 / 5) × A × B",
        "الكور (4) = 4.5 سم (تجاوز نسبة 10%): الحسم على كامل النقص (0.5 سم) = (0.5 / 5) × A × B"
      ],
      compute: (A, B) => {
        const c3 = (0.2 / 5) * A * B;
        const c4 = (0.5 / 5) * A * B;
        const total = c3 + c4;
        return {
          steps: [
            { label: "الكور رقم (1) [4.7 سم] والكور رقم (2) [4.8 سم]", formula: "ضمن نسبة 10% (أول كورين من 3) = بدون حسم", value: 0 },
            { label: "الكور رقم (3) [4.5 سم - يكمل الكور الثالث من نسبة 10%]", formula: `(0.2 / 5) × ${A} × ${B}`, value: c3 },
            { label: "الكور رقم (4) [4.5 سم - تجاوز نسبة 10%]", formula: `(0.5 / 5) × ${A} × ${B}`, value: c4 },
            { label: "مقدار الحسم الكلي", formula: `${c3.toFixed(3)} + ${c4.toFixed(3)}`, value: total, isTotal: true }
          ],
          effectiveFactor: (0.2 / 5) + (0.5 / 5)
        };
      }
    },
    {
      id: "ex_thick_3",
      category: "ثالثاً: أمثلة توضيحية على النقص في السماكة في طبقات الخلطة الإسفلتية حسب الجدول رقم (4) صفحة 20",
      title: "مثال رقم (3) على البند رقم (3) / كورات تنفيذ مع مراعاة المثال رقم (2) - صفحة 47",
      page: 47,
      problemText: [
        "طول المشروع (7) كم، السماكة المطلوبة = 5 سم، عدد الكورات لكامل المشروع = 35 كور.",
        "جميع الكورات مطابقة باستثناء: الكور رقم (5) = 4.6 سم، الكور رقم (30) = 4.8 سم، الكور رقم (32) = 4.5 سم.",
        "الكور رقم (30) = 4.8 سم (نقص 0.2 سم ≤ 0.3 سم): يعالج حسب البند (1)، (2) جدول رقم (4) -> بدون حسم لأن عدد الكورات أقل من 10%.",
        "الكور رقم (5) = 4.6 سم (نقص 0.4 سم > 0.3 سم و ≤ 0.5 سم): يحسم كامل النقص = (0.4 / 5) × المساحة الممثلة × السعر.",
        "الكور رقم (32) = 4.5 سم (نقص 0.5 سم = 10%): يحسم كامل النقص = (0.5 / 5) × المساحة الممثلة × السعر."
      ],
      unitA: "m² (المساحة الممثلة للكور الواحد)",
      unitB: "JD/m²",
      defaultA: 1400,
      defaultB: 6.5,
      equations: [
        "مقدار الحسم على الكور رقم (5) = (0.4 / 5) × المساحة الممثلة للكور × السعر",
        "الكور رقم (30) [4.8 سم] = يعالج حسب البند (1)، (2) جدول رقم (4) = بدون حسم",
        "مقدار الحسم على الكور رقم (32) = (0.5 / 5) × المساحة الممثلة للكور × السعر"
      ],
      compute: (A, B) => {
        const c5 = (0.4 / 5) * A * B;
        const c32 = (0.5 / 5) * A * B;
        const total = c5 + c32;
        return {
          steps: [
            { label: "الكور رقم (30) [4.8 سم - نقص 0.2 سم ضمن 3مم]", formula: "يعالج حسب البند (1) جدول (4) = بدون حسم", value: 0 },
            { label: "مقدار الحسم على الكور رقم (5) [4.6 سم - نقص 0.4 سم]", formula: `(0.4 / 5) × ${A} × ${B}`, value: c5 },
            { label: "مقدار الحسم على الكور رقم (32) [4.5 سم - نقص 0.5 سم]", formula: `(0.5 / 5) × ${A} × ${B}`, value: c32 },
            { label: "مقدار الحسم الكلي", formula: `${c5.toFixed(3)} + ${c32.toFixed(3)}`, value: total, isTotal: true }
          ],
          effectiveFactor: (0.4 / 5) + (0.5 / 5)
        };
      }
    },
    {
      id: "ex_thick_4",
      category: "ثالثاً: أمثلة توضيحية على النقص في السماكة في طبقات الخلطة الإسفلتية حسب الجدول رقم (4) صفحة 20",
      title: "مثال رقم (4) على البند رقم (4) / كورات تنفيذ (تجاوز النقص 10%) - صفحة 48",
      page: 48,
      problemText: [
        "طول المشروع (7) كم، السماكة المطلوبة = 5 سم.",
        "سماكة أحد الكورات = 4.3 سم (النقص = 0.7 سم > 10% أي أكبر من 0.5 سم).",
        "النتيجة: مرفوض؛ يجب وضع خلطة إسفلتية على المنطقة الممثلة للكور غير المطابق تحدد سماكتها من قبل لجنة الاستلام ويتم إجراء كافة الفحوصات المطلوبة عليها (مواد، رك، سماكة)."
      ],
      unitA: "m²",
      unitB: "JD/m²",
      defaultA: 1400,
      defaultB: 6.5,
      equations: [
        "الحد الأقصى للنقص المسموح مع حسم (10%) = 5 × 10% = 0.5 سم (الحد الأدنى المقبول مع حسم = 4.5 سم)",
        "سماكة الكور (4.3 سم) < 4.5 سم (نقص 0.7 سم = 14% > 10%)",
        "القرار الهندسي: مرفوض - إضافة طبقة خلطة إسفلتية تحدد سماكتها من قبل لجنة الاستلام."
      ],
      compute: (A, B) => {
        return {
          steps: [
            { label: "تحليل سماكة الكور (4.3 سم من أصل 5.0 سم)", formula: "النقص = 0.7 سم (14% > 10%) - يتبع للبند رقم (4) جدول (4)", value: 0 },
            { label: "القرار الإلزامي", formula: "مرفوض: يجب وضع خلطة إسفلتية تحدد سماكتها من قبل لجنة الاستلام", value: 0, isRejected: true, isTotal: true }
          ],
          effectiveFactor: 0
        };
      }
    },
    {
      id: "ex_thick_5",
      category: "ثالثاً: أمثلة توضيحية على النقص في السماكة في طبقات الخلطة الإسفلتية حسب الجدول رقم (4) صفحة 20",
      title: "مثال رقم (5) على البند رقم (5) / كورات تنفيذ (طبقتين: رابطة + سطحية) - صفحة 48",
      page: 48,
      problemText: [
        "سماكة الطبقة السطحية المطلوبة = 5 سم، سماكة الطبقة الرابطة المطلوبة = 7 سم -> السماكة الكلية = 5 + 7 = 12 سم.",
        "طبقتين: مقدار النقص المسموح بدون حسم = 5 مم (0.5 سم) -> حتى سماكة 12 - 0.5 = 11.5 سم (بشرط عدم تجاوز عدد الكورات 10%).",
        "حدود الحسم (10% من السماكة الكلية): 12 × 10% = 1.2 سم -> حتى سماكة 12 - 1.2 = 10.8 سم.",
        "كانت سماكة الكورات كالآتي (علماً أن عدد الكورات التي لا يوجد عليها حسم أقل من 10% من إجمالي كورات المشروع):",
        "1- (11.7) سم: بند (2) لا يوجد حسم.",
        "2- (11.5) سم: بند (2) لا يوجد حسم.",
        "3- (10.8) سم: بند (3) يوجد حسم = (1.2 / 12) × سعر الطبقة العليا × المساحة الممثلة للكور.",
        "4- (10.4) سم: بند (4) مرفوض (لأن 10.4 < 10.8 سم أي النقص 1.6 سم > 1.2 سم)."
      ],
      unitA: "m² (المساحة الممثلة للكور رقم 3)",
      unitB: "JD/m² (سعر الطبقة السطحية العليا)",
      defaultA: 1400,
      defaultB: 6.5,
      equations: [
        "السماكة الكلية المطلوبة = 5 + 7 = 12 سم | السماح بدون حسم لطبقتين = 0.5 سم (لغاية 11.5 سم)",
        "حد الحسم الأقصى (10%) = 12 × 10% = 1.2 سم (لغاية 10.8 سم)",
        "مقدار الحسم على الكور رقم (3) [10.8 سم] = (1.2 / 12) × سعر الطبقة العليا × المساحة الممثلة للكور",
        "الكور رقم (4) [10.4 سم]: بند (4) مرفوض"
      ],
      compute: (A, B) => {
        const c3 = (1.2 / 12) * A * B;
        return {
          steps: [
            { label: "الكور رقم (1) [11.7 سم] والكور رقم (2) [11.5 سم]", formula: "النقص ≤ 0.5 سم وعددها < 10% = لا يوجد حسم", value: 0 },
            { label: "مقدار الحسم على الكور رقم (3) [10.8 سم - نقص 1.2 سم]", formula: `(1.2 / 12) × ${A} × ${B}`, value: c3, isTotal: true },
            { label: "الكور رقم (4) [10.4 سم - نقص 1.6 سم > 1.2 سم]", formula: "بند (4) مرفوض - إضافة طبقة خلطة إسفلتية", value: 0, isRejected: true }
          ],
          effectiveFactor: 1.2 / 12
        };
      }
    },
    {
      id: "ex_compaction_6",
      category: "رابعاً: أمثلة درجات الرك للخلطة الإسفلتية - صفحة 49",
      title: "مثال رقم (6) / درجات الرك (الحالة الأولى: تنفيذ + الحالة الثانية: استلام) - صفحة 49",
      page: 49,
      problemText: [
        "تم أخذ كورات لمشروع وكانت درجات الرك المطلوبة (98)% ليوم عمل واحد على النحو التالي:",
        "كور رقم (1): 97% | كور رقم (2): 94% | كور رقم (3): 96.5% | كور رقم (4): 94% | كور رقم (5): 96%",
        "عند احتساب معدل درجات الرك يستثنى كور رقم (2) وكور رقم (4) وذلك لأن النقص في درجة الرك المنفردة لكل منهما يزيد عن 3 درجات (98 - 94 = 4 > 3)، ويتم رفضهما (حسم كامل قيمة البند للمنطقة الممثلة لهما).",
        "المعدل للكورات المقبولة (1، 3، 5) = (97 + 96.5 + 96) / 3 = 96.5% (مقدار النقص عن 98% = 1.5 درجة).",
        "الحالة الأولى (الكورات لغايات التنفيذ): مقدار الحسم = السعر × المساحة الكلية ليوم العمل × (30/100) × (1.5 / 2).",
        "الحالة الثانية (الكورات لغايات الاستلام): لا يتم الحسم على نقص الدرجة الأولى حسب الأسس ويتم الحسم على نقص 0.5% فقط: مقدار الحسم = السعر × المساحة الكلية ليوم العمل × (20/100) × 0.5."
      ],
      unitA: "m² (المساحة الكلية ليوم العمل)",
      unitB: "JD/m² (السعر)",
      defaultA: 3000,
      defaultB: 6.5,
      equations: [
        "المعدل بعد استبعاد كور (2) وكور (4) = (97 + 96.5 + 96) / 3 = 96.5% (النقص = 1.5%)",
        "الحالة الأولى (لغايات التنفيذ): مقدار الحسم = السعر × المساحة الكلية ليوم العمل × (30/100) × (1.5/2)",
        "الحالة الثانية (لغايات الاستلام): مقدار الحسم = السعر × المساحة الكلية ليوم العمل × (20/100) × 0.5",
        "الكورات المرفوضة: كور رقم (2) وكور رقم (4) حسم كامل قيمة البند للمنطقة الممثلة لهما."
      ],
      compute: (A, B) => {
        const deductExec = A * B * (30 / 100) * (1.5 / 2);
        const deductAccept = A * B * (20 / 100) * 0.5;
        return {
          steps: [
            { label: "معدل درجات الرك للكورات (1، 3، 5)", formula: "(97 + 96.5 + 96) / 3 = 96.5% (نقص 1.5 درجة عن 98%)", value: 96.5, isPercent: true },
            { label: "الحالة الأولى: مقدار الحسم (كورات لغايات التنفيذ)", formula: `${A} × ${B} × (30/100) × (1.5/2)`, value: deductExec, isTotal: true },
            { label: "الحالة الثانية: مقدار الحسم (كورات لغايات الاستلام)", formula: `${A} × ${B} × (20/100) × 0.5`, value: deductAccept, isTotal: true },
            { label: "الكورات المرفوضة (كور 2 = 94%، كور 4 = 94%)", formula: "حسم كامل قيمة البند للمنطقة الممثلة لهما (النقص المنفرد 4 درجات > 3)", value: 0, isRejected: true }
          ],
          effectiveFactor: (30 / 100) * (1.5 / 2)
        };
      }
    }
  ]
};

/* ============================================================
   نسخ الجداول 10 و 15: نُبقي النسخة القديمة ونضيف نسخة معدلة
   لتظهر النسختان معاً في الحاسبة والجداول المرجعية.
   ============================================================ */
function cloneTableData(value) {
  return JSON.parse(JSON.stringify(value));
}

function tableRefText(item) {
  if (!item) return "()";
  const label = item.tableLabel || "";
  return `(${item.tableNum || "---"}${label ? " " + label : ""})`;
}

function addModifiedTableVariant(baseTable, num, oldKey, newKey, modifiedExec) {
  const oldTitle = `الجدول رقم (${num}):`;
  baseTable.variantKey = `${oldKey}_old`;
  baseTable.variantLabel = "قديم";
  if (baseTable.title.startsWith(oldTitle)) {
    baseTable.title = baseTable.title.replace(oldTitle, `الجدول رقم (${num}) قديم:`);
  }

  const modified = cloneTableData(baseTable);
  modified.variantKey = `${newKey}_new`;
  modified.variantLabel = "معدل";
  modified.title = modified.title.replace(`الجدول رقم (${num}) قديم:`, `الجدول رقم (${num}) معدل:`);
  modified.items = modified.items.map((item) => ({
    ...item,
    id: item.id.replace(`t${num}_`, `t${num}m_`),
    exec: item.num === 8 ? cloneTableData(modifiedExec) : item.exec
  }));

  const idx = MPWH_DATA.tables.indexOf(baseTable);
  MPWH_DATA.tables.splice(idx + 1, 0, modified);
  return modified;
}

// الجدول 10: النسخة القديمة كما كانت (-2 و15%+15%)، والنسخة المعدلة (-3 و5%+15%+30%)
const table10Old = MPWH_DATA.tables.find((t) => t.tableNum === 10);
const table10ModifiedExec = {
  mode: "tiered_degrees", freeTol: 0, maxDev: 3, deductRate: 50,
  tiers: [{ upTo: 1, rate: 5 }, { upTo: 2, rate: 15 }, { upTo: 3, rate: 30 }],
  textMaxDev: "-3 خارج حدود المواصفة المطلوبة",
  textRate: "50% توزع (تراكمياً) 5% للأولى و15% للثانية و30% للثالثة"
};
addModifiedTableVariant(table10Old, 10, "t10", "t10", table10ModifiedExec);

// الجدول 15: نُعيد نسخته القديمة إلى قيمها الأصلية، ثم نضيف النسخة المعدلة
const table15Old = MPWH_DATA.tables.find((t) => t.tableNum === 15);
const table15ModifiedExec = cloneTableData(table15Old.items.find((i) => i.num === 8).exec);
table15Old.items.find((i) => i.num === 8).exec = {
  mode: "standard", freeTol: 0, maxDev: 2, deductRate: 30,
  textMaxDev: "-2 خارج حدود المواصفة المطلوبة",
  textRate: "30% توزع تراكمياً (15% للأولى و15% للثانية)"
};
addModifiedTableVariant(table15Old, 15, "t15", "t15", table15ModifiedExec);

// البيانات المحفوظة للمشاريع والتقارير المعتمدة
const DEFAULT_PROJECTS_SEED = {
  "nextProjectSerial": 4,
  "activeProjectId": "prj_1794984952504_631",
  "projects": [
    {
      "id": "prj_1794984576703_254",
      "serialNumber": 1,
      "projectNo": "ش م أ/2026/12",
      "name": "استكمال اعمال العطاء ش م أ/2025/13 الخاص بتنفيذ طرق لب ومليح",
      "contractor": "شركة الوهب للمقاولات الانشائية",
      "consultant": "مديرية اشغال مادبا",
      "location": "محافظة مأدبا/لب ومليح",
      "lengthKm": "اربعة طرق متفرقة",
      "createdDate": "2026-11-18",
      "logItems": [
        {
          "location": "يوم عمل 1/9/2026",
          "tableNum": "15",
          "tableTitle": "الجدول رقم (15): حسميات تجاوزات فحوصات الخلطة الإسفلتية (Hot Mix Asphalt / Wearing Course) - الطرق الزراعية",
          "itemName": "الفراغات الهوائية",
          "unit": "م²",
          "repQty": 4714.19,
          "unitPrice": 4.59,
          "totalWorkValue": 21638.1321,
          "q1": 129.8287926,
          "q2": 0,
          "q3": 0,
          "totalDeduction": 129.8287926,
          "finalDecision": "مقبول مع حسم مالي",
          "anyRejected": false,
          "id": "itm_1795425202527_13"
        },
        {
          "location": "يوم عمل 1/9/2026",
          "tableNum": "15",
          "tableTitle": "الجدول رقم (15): حسميات تجاوزات فحوصات الخلطة الإسفلتية (Hot Mix Asphalt / Wearing Course) - الطرق الزراعية",
          "itemName": "التدرج (الجزء الناعم #4 - #20)",
          "unit": "م²",
          "repQty": 4714.19,
          "unitPrice": 4.59,
          "totalWorkValue": 21638.1321,
          "q1": 108.19066049999999,
          "q2": 0,
          "q3": 0,
          "totalDeduction": 108.19066049999999,
          "finalDecision": "مقبول مع حسم مالي",
          "anyRejected": false,
          "id": "itm_1795425233335_107"
        },
        {
          "location": "يوم عمل 1/9/2026",
          "tableNum": "15",
          "tableTitle": "الجدول رقم (15): حسميات تجاوزات فحوصات الخلطة الإسفلتية (Hot Mix Asphalt / Wearing Course) - الطرق الزراعية",
          "itemName": "الفراغات المعدنية",
          "unit": "م²",
          "repQty": 4714.19,
          "unitPrice": 4.59,
          "totalWorkValue": 21638.1321,
          "q1": 194.74318889999998,
          "q2": 0,
          "q3": 0,
          "totalDeduction": 194.74318889999998,
          "finalDecision": "مقبول مع حسم مالي",
          "anyRejected": false,
          "id": "itm_1795425335367_648"
        },
        {
          "location": "معدل رك طريق الهروط",
          "tableNum": 15,
          "tableTitle": "الجدول رقم (15): حسميات تجاوزات فحوصات الخلطة الإسفلتية (Hot Mix Asphalt / Wearing Course) - الطرق الزراعية",
          "itemName": "درجة الرك",
          "unit": "م²",
          "repQty": 924.45,
          "unitPrice": 4.59,
          "totalWorkValue": 4243.2255000000005,
          "q1": 0,
          "q2": 324.18242820000006,
          "q3": 0,
          "totalDeduction": 324.18242820000006,
          "finalDecision": "مقبول مع حسم مالي",
          "anyRejected": false,
          "id": "itm_1795429707080_626"
        },
        {
          "location": "معدل رك باقي الطرق",
          "tableNum": 15,
          "tableTitle": "الجدول رقم (15): حسميات تجاوزات فحوصات الخلطة الإسفلتية (Hot Mix Asphalt / Wearing Course) - الطرق الزراعية",
          "itemName": "درجة الرك",
          "unit": "م²",
          "repQty": 3789.74,
          "unitPrice": 4.59,
          "totalWorkValue": 17394.9066,
          "q1": 521.8471979999999,
          "q2": 0,
          "q3": 0,
          "totalDeduction": 521.8471979999999,
          "finalDecision": "مقبول مع حسم مالي",
          "anyRejected": false,
          "id": "itm_1795429799073_729"
        },
        {
          "location": "كورات سماكة الخلطة الإسفلتية — ضبط الجودة",
          "tableNum": 4,
          "itemName": "فروقات السماكة - كورات ضبط الجودة (5 سم)",
          "unit": "م²",
          "repQty": 673.4557142857142,
          "unitPrice": 6.5,
          "totalWorkValue": 4377.462142857142,
          "q1": 0,
          "q2": 0,
          "q3": 0,
          "totalDeduction": 0,
          "finalDecision": "مقبول بدون حسم",
          "anyRejected": false,
          "id": "itm_1795432900234_142"
        }
      ],
      "reports": [
        {
          "id": "rpt_1795505477851_379",
          "serialNumber": 4,
          "reportNo": "ش م أ/2026/12/تقرير/004",
          "title": "تقرير الحسميات والشذوذات المخبرية",
          "date": "24/11/2026",
          "items": [
            {
              "location": "يوم عمل 1/9/2026",
              "tableNum": "15",
              "tableTitle": "الجدول رقم (15): حسميات تجاوزات فحوصات الخلطة الإسفلتية (Hot Mix Asphalt / Wearing Course) - الطرق الزراعية",
              "itemName": "الفراغات الهوائية",
              "unit": "م²",
              "repQty": 4714.19,
              "unitPrice": 4.59,
              "totalWorkValue": 21638.1321,
              "q1": 129.8287926,
              "q2": 0,
              "q3": 0,
              "totalDeduction": 129.8287926,
              "finalDecision": "مقبول مع حسم مالي",
              "anyRejected": false,
              "id": "itm_1795425202527_13"
            },
            {
              "location": "يوم عمل 1/9/2026",
              "tableNum": "15",
              "tableTitle": "الجدول رقم (15): حسميات تجاوزات فحوصات الخلطة الإسفلتية (Hot Mix Asphalt / Wearing Course) - الطرق الزراعية",
              "itemName": "التدرج (الجزء الناعم #4 - #20)",
              "unit": "م²",
              "repQty": 4714.19,
              "unitPrice": 4.59,
              "totalWorkValue": 21638.1321,
              "q1": 108.19066049999999,
              "q2": 0,
              "q3": 0,
              "totalDeduction": 108.19066049999999,
              "finalDecision": "مقبول مع حسم مالي",
              "anyRejected": false,
              "id": "itm_1795425233335_107"
            },
            {
              "location": "يوم عمل 1/9/2026",
              "tableNum": "15",
              "tableTitle": "الجدول رقم (15): حسميات تجاوزات فحوصات الخلطة الإسفلتية (Hot Mix Asphalt / Wearing Course) - الطرق الزراعية",
              "itemName": "الفراغات المعدنية",
              "unit": "م²",
              "repQty": 4714.19,
              "unitPrice": 4.59,
              "totalWorkValue": 21638.1321,
              "q1": 194.74318889999998,
              "q2": 0,
              "q3": 0,
              "totalDeduction": 194.74318889999998,
              "finalDecision": "مقبول مع حسم مالي",
              "anyRejected": false,
              "id": "itm_1795425335367_648"
            },
            {
              "location": "معدل رك طريق الهروط",
              "tableNum": 15,
              "tableTitle": "الجدول رقم (15): حسميات تجاوزات فحوصات الخلطة الإسفلتية (Hot Mix Asphalt / Wearing Course) - الطرق الزراعية",
              "itemName": "درجة الرك",
              "unit": "م²",
              "repQty": 924.45,
              "unitPrice": 4.59,
              "totalWorkValue": 4243.2255000000005,
              "q1": 0,
              "q2": 324.18242820000006,
              "q3": 0,
              "totalDeduction": 324.18242820000006,
              "finalDecision": "مقبول مع حسم مالي",
              "anyRejected": false,
              "id": "itm_1795429707080_626"
            },
            {
              "location": "معدل رك باقي الطرق",
              "tableNum": 15,
              "tableTitle": "الجدول رقم (15): حسميات تجاوزات فحوصات الخلطة الإسفلتية (Hot Mix Asphalt / Wearing Course) - الطرق الزراعية",
              "itemName": "درجة الرك",
              "unit": "م²",
              "repQty": 3789.74,
              "unitPrice": 4.59,
              "totalWorkValue": 17394.9066,
              "q1": 521.8471979999999,
              "q2": 0,
              "q3": 0,
              "totalDeduction": 521.8471979999999,
              "finalDecision": "مقبول مع حسم مالي",
              "anyRejected": false,
              "id": "itm_1795429799073_729"
            },
            {
              "location": "كورات سماكة الخلطة الإسفلتية — ضبط الجودة",
              "tableNum": 4,
              "itemName": "فروقات السماكة - كورات ضبط الجودة (5 سم)",
              "unit": "م²",
              "repQty": 673.4557142857142,
              "unitPrice": 6.5,
              "totalWorkValue": 4377.462142857142,
              "q1": 0,
              "q2": 0,
              "q3": 0,
              "totalDeduction": 0,
              "finalDecision": "مقبول بدون حسم",
              "anyRejected": false,
              "id": "itm_1795432900234_142"
            }
          ],
          "totals": {
            "work": 90929.99054285714,
            "q1": 954.60984,
            "q2": 324.18242820000006,
            "q3": 0,
            "deduction": 1278.7922682,
            "rejectedCount": 0
          },
          "signatureFlags": {
            "engineer": false,
            "head": true,
            "director": false
          },
          "visibleItemIds": null
        }
      ],
      "nextReportSerial": 5,
      "sampleType": "خلطة اسفلتية +كورات (كامل الفحوصات)"
    },
    {
      "id": "prj_1794984952504_631",
      "serialNumber": 2,
      "projectNo": "مأدبا/2026/002",
      "name": "الكرك",
      "contractor": "",
      "consultant": "",
      "location": "محافظة مأدبا",
      "lengthKm": "",
      "createdDate": "2026-11-18",
      "logItems": [
        {
          "location": "مثال رقم (1) - صفحة 44: فحص CBR للفرشيات (عينة تنفيذ + عينة ضبط جودة)",
          "tableNum": 9,
          "tableKey": "9",
          "tableLabel": "",
          "tableTitle": "الجدول رقم (9): حسميات تجاوزات فحوصات الفرشيات (Sub-base & Base Course)",
          "itemName": "التدرج (المنخل #40)",
          "unit": "م³",
          "repQty": 1000,
          "unitPrice": 12,
          "totalWorkValue": 12000,
          "q1": 72,
          "q2": 96,
          "q3": 0,
          "totalDeduction": 168,
          "finalDecision": "مقبول مع حسم مالي",
          "anyRejected": false,
          "id": "itm_1795515459408_617"
        },
        {
          "location": "مثال رقم (1) - صفحة 44: فحص CBR للفرشيات (عينة تنفيذ + عينة ضبط جودة)",
          "tableNum": 10,
          "tableKey": "t10_old",
          "tableLabel": "قديم",
          "tableTitle": "الجدول رقم (10) قديم: حسميات تجاوزات فحوصات الخلطة الإسفلتية (Hot Mix Asphalt / Binder & Wearing Course)",
          "itemName": "نسبة الإسفلت من الخليط",
          "unit": "م²",
          "repQty": 1000,
          "unitPrice": 12,
          "totalWorkValue": 12000,
          "q1": 0,
          "q2": 96,
          "q3": 0,
          "totalDeduction": 96,
          "finalDecision": "مقبول مع حسم مالي",
          "anyRejected": false,
          "id": "itm_1795515539161_182"
        },
        {
          "location": "مثال رقم (1) - صفحة 44: فحص CBR للفرشيات (عينة تنفيذ + عينة ضبط جودة)",
          "tableNum": 10,
          "tableKey": "t10_old",
          "tableLabel": "قديم",
          "tableTitle": "الجدول رقم (10) قديم: حسميات تجاوزات فحوصات الخلطة الإسفلتية (Hot Mix Asphalt / Binder & Wearing Course)",
          "itemName": "درجة الرك (معدل يوم العمل)",
          "unit": "م²",
          "repQty": 1000,
          "unitPrice": 12,
          "totalWorkValue": 12000,
          "q1": 0,
          "q2": 0,
          "q3": 0,
          "totalDeduction": 0,
          "finalDecision": "مرفوض (تجاوز الحدود المسموحة في الأسس)",
          "anyRejected": true,
          "id": "itm_1795515596713_671"
        }
      ],
      "reports": [
        {
          "id": "rpt_1795515755745_658",
          "serialNumber": 1,
          "reportNo": "مأدبا/2026/002/تقرير/001",
          "title": "تقرير الحسميات والشذوذات المخبرية",
          "date": "24/11/2026",
          "items": [
            {
              "location": "مثال رقم (1) - صفحة 44: فحص CBR للفرشيات (عينة تنفيذ + عينة ضبط جودة)",
              "tableNum": 9,
              "tableKey": "9",
              "tableLabel": "",
              "tableTitle": "الجدول رقم (9): حسميات تجاوزات فحوصات الفرشيات (Sub-base & Base Course)",
              "itemName": "التدرج (المنخل #40)",
              "unit": "م³",
              "repQty": 1000,
              "unitPrice": 12,
              "totalWorkValue": 12000,
              "q1": 72,
              "q2": 96,
              "q3": 0,
              "totalDeduction": 168,
              "finalDecision": "مقبول مع حسم مالي",
              "anyRejected": false,
              "id": "itm_1795515459408_617"
            },
            {
              "location": "مثال رقم (1) - صفحة 44: فحص CBR للفرشيات (عينة تنفيذ + عينة ضبط جودة)",
              "tableNum": 10,
              "tableKey": "t10_old",
              "tableLabel": "قديم",
              "tableTitle": "الجدول رقم (10) قديم: حسميات تجاوزات فحوصات الخلطة الإسفلتية (Hot Mix Asphalt / Binder & Wearing Course)",
              "itemName": "نسبة الإسفلت من الخليط",
              "unit": "م²",
              "repQty": 1000,
              "unitPrice": 12,
              "totalWorkValue": 12000,
              "q1": 0,
              "q2": 96,
              "q3": 0,
              "totalDeduction": 96,
              "finalDecision": "مقبول مع حسم مالي",
              "anyRejected": false,
              "id": "itm_1795515539161_182"
            },
            {
              "location": "مثال رقم (1) - صفحة 44: فحص CBR للفرشيات (عينة تنفيذ + عينة ضبط جودة)",
              "tableNum": 10,
              "tableKey": "t10_old",
              "tableLabel": "قديم",
              "tableTitle": "الجدول رقم (10) قديم: حسميات تجاوزات فحوصات الخلطة الإسفلتية (Hot Mix Asphalt / Binder & Wearing Course)",
              "itemName": "درجة الرك (معدل يوم العمل)",
              "unit": "م²",
              "repQty": 1000,
              "unitPrice": 12,
              "totalWorkValue": 12000,
              "q1": 0,
              "q2": 0,
              "q3": 0,
              "totalDeduction": 0,
              "finalDecision": "مرفوض (تجاوز الحدود المسموحة في الأسس)",
              "anyRejected": true,
              "id": "itm_1795515596713_671"
            }
          ],
          "totals": {
            "work": 36000,
            "q1": 72,
            "q2": 192,
            "q3": 0,
            "deduction": 264,
            "rejectedCount": 1
          },
          "visibleItemIds": null,
          "signatureFlags": {
            "engineer": false,
            "head": true,
            "director": false
          }
        }
      ],
      "nextReportSerial": 2
    },
    {
      "id": "prj_1794989498469_629",
      "serialNumber": 3,
      "projectNo": "مأدبا/2026/003",
      "name": "الطريق الملوكي",
      "contractor": "",
      "consultant": "",
      "location": "محافظة مأدبا",
      "lengthKm": "",
      "createdDate": "2026-11-18",
      "logItems": [
        {
          "location": "كورات سماكة الخلطة الإسفلتية",
          "tableNum": 4,
          "itemName": "فروقات السماكة (1 طبقة / السماكة المطلوبة 5 سم)",
          "unit": "م²",
          "repQty": 1400,
          "unitPrice": 6.5,
          "totalWorkValue": 9100,
          "q1": 0,
          "q2": 0,
          "q3": 0,
          "totalDeduction": 0,
          "finalDecision": "مقبول بدون حسم",
          "anyRejected": false,
          "id": "itm_1794989671468_172"
        }
      ],
      "reports": [],
      "nextReportSerial": 1
    }
  ]
};
