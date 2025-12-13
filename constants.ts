import { Module } from './types';

export const COURSE_PRICE_KWD = 47;
export const UPSELL_PRICE_KWD = 60;

export const COURSE_CONTENT: Module[] = [
  {
    id: 'm1',
    title: 'اليوم ١: الفكرة الذهبية',
    lessons: [
      { 
        id: 'l1-1', 
        title: 'كيف تجد مشكلة تستحق الحل؟', 
        duration: '١٢:٤٥',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      },
      { id: 'l1-2', title: 'التحقق من الفكرة بصفر تكلفة', duration: '٠٨:٣٠' },
    ]
  },
  {
    id: 'm2',
    title: 'اليوم ٢-٣: النمذجة السريعة',
    lessons: [
      { id: 'l2-1', title: 'أدوات الـ No-Code الأساسية', duration: '١٥:٢٠' },
      { id: 'l2-2', title: 'تصميم واجهة مستخدم احترافية في ساعات', duration: '٢٢:١٠' },
      { id: 'l2-3', title: 'ربط قواعد البيانات (Database)', duration: '١٨:٠٠' },
    ]
  },
  {
    id: 'm3',
    title: 'اليوم ٤-٥: البناء والتطوير',
    lessons: [
      { id: 'l3-1', title: 'بناء الـ MVP باستخدام الذكاء الاصطناعي', duration: '٣٠:٠٠' },
      { id: 'l3-2', title: 'إضافة المميزات الأساسية', duration: '٢٠:٤٥' },
      { id: 'l3-3', title: 'اختبار التطبيق وإصلاح الأخطاء', duration: '١٦:٣٠' },
    ]
  },
  {
    id: 'm4',
    title: 'اليوم ٦: الإطلاق والنشر',
    lessons: [
      { id: 'l4-1', title: 'رفع التطبيق على الإنترنت', duration: '١٠:٥٠' },
      { id: 'l4-2', title: 'ربط الدومين الخاص بك', duration: '١٢:٢٠' },
      { id: 'l4-3', title: 'الإعدادات النهائية والأمان', duration: '٠٩:٤٠' },
    ]
  },
  {
    id: 'm5',
    title: 'اليوم ٧: التسويق والنمو',
    lessons: [
      { id: 'l5-1', title: 'استراتيجيات الإطلاق الناجح', duration: '١٦:٤٠' },
      { id: 'l5-2', title: 'جذب أول 100 عميل', duration: '٢٥:٠٠' },
      { id: 'l5-3', title: 'خطة النمو المستدام', duration: '١٨:١٥' },
    ]
  }
];

export const TESTIMONIALS = [
  {
    id: 1,
    name: "أحمد",
    role: "الكويت",
    content: "بنيت تطبيقي الأول خلال أسبوع وبدأت أحقق دخل. الكورس كان نقطة التحول في حياتي المهنية.",
    avatar: "https://i.pravatar.cc/150?u=ahmed_kuwait"
  },
  {
    id: 2,
    name: "سارة",
    role: "السعودية",
    content: "وفرت أكثر من ٥٠٠٠ دينار كنت راح أدفعها لشركة برمجة. الشرح عملي جداً ومباشر.",
    avatar: "https://i.pravatar.cc/150?u=sara_saudi"
  },
  {
    id: 3,
    name: "محمد",
    role: "الإمارات",
    content: "الآن عندي ٣ تطبيقات تدر علي دخل شهري. الاستثمار في هذا الكورس كان أفضل قرار اتخذته.",
    avatar: "https://i.pravatar.cc/150?u=mohammed_uae"
  }
];

export const FAQS = [
  {
    question: "هل أحتاج خبرة برمجية سابقة؟",
    answer: "لا، الدورة مصممة للمبتدئين تماماً. نستخدم أدوات No-Code وذكاء اصطناعي يكتب الكود بدلاً عنك."
  },
  {
    question: "كم المدة للوصول للدورة؟",
    answer: "وصول فوري ومدى الحياة. بمجرد الاشتراك، تحصل على كل المحتوى فوراً."
  },
  {
    question: "هل يوجد دعم إذا واجهت مشكلة؟",
    answer: "نعم، دعم مباشر عبر المجتمع الخاص + جلسات أسبوعية للأسئلة والأجوبة."
  },
  {
    question: "ماذا لو لم تناسبني الدورة؟",
    answer: "ضمان استرداد كامل خلال 14 يوم. إذا لم تكن راضياً، نعيد لك كامل المبلغ."
  },
  {
    question: "هل أحتاج أدوات أو برامج مدفوعة؟",
    answer: "معظم الأدوات المستخدمة مجانية. الأدوات المدفوعة اختيارية ولها بدائل مجانية."
  },
  {
    question: "كم من الوقت أحتاج يومياً؟",
    answer: "ساعة إلى ساعتين يومياً كافية. المنهج مصمم للمشغولين."
  }
];