export type VerseContext =
  | "login"
  | "dashboard"
  | "students"
  | "teachers"
  | "classes"
  | "attendance"
  | "performance"
  | "exams"
  | "admissions"
  | "fee"
  | "settings"
  | "general";

export type QuranicVerse = {
  id: string;
  arabic: string;
  reference_ar: string;
  reference_en: string;
  translation_en: string;
  translation_ur: string;
  context: VerseContext[];
};

export const quranicVerses: QuranicVerse[] = [
  {
    id: "qamar-17",
    arabic: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ",
    reference_ar: "سُورَةُ الْقَمَر ٥٤:١٧",
    reference_en: "Surah Al-Qamar 54:17",
    translation_en:
      "And We have certainly made the Quran easy for remembrance, so is there any who will remember?",
    translation_ur:
      "اور بے شک ہم نے قرآن کو نصیحت کے لیے آسان کر دیا — تو ہے کوئی نصیحت حاصل کرنے والا؟",
    context: ["login", "general"],
  },
  {
    id: "alaq-1",
    arabic: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ",
    reference_ar: "سُورَةُ الْعَلَق ٩٦:١",
    reference_en: "Surah Al-Alaq 96:1",
    translation_en: "Read in the name of your Lord who created.",
    translation_ur: "پڑھ اپنے رب کے نام سے جس نے پیدا کیا۔",
    context: ["login", "general"],
  },
  {
    id: "taha-114",
    arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    reference_ar: "سُورَةُ طٰهٰ ٢٠:١١٤",
    reference_en: "Surah Taha 20:114",
    translation_en: "And say: My Lord, increase me in knowledge.",
    translation_ur: "اور کہو: اے میرے رب! میرے علم میں اضافہ فرما۔",
    context: ["login", "dashboard", "settings", "general"],
  },
  {
    id: "nahl-43",
    arabic: "فَاسْأَلُوا أَهْلَ الذِّكْرِ إِن كُنتُمْ لَا تَعْلَمُونَ",
    reference_ar: "سُورَةُ النَّحْل ١٦:٤٣",
    reference_en: "Surah An-Nahl 16:43",
    translation_en: "So ask the people of knowledge if you do not know.",
    translation_ur: "پس اگر تم نہیں جانتے تو اہلِ علم سے پوچھو۔",
    context: ["dashboard", "teachers"],
  },
  {
    id: "mujadila-11",
    arabic:
      "يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ",
    reference_ar: "سُورَةُ الْمُجَادِلَة ٥٨:١١",
    reference_en: "Surah Al-Mujadilah 58:11",
    translation_en:
      "Allah will raise those who have believed and those given knowledge by degrees.",
    translation_ur:
      "اللہ ان لوگوں کے درجات بلند فرمائے گا جو ایمان لائے اور جنہیں علم دیا گیا۔",
    context: ["dashboard", "students", "performance"],
  },
  {
    id: "zumar-9",
    arabic: "هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ",
    reference_ar: "سُورَةُ الزُّمَر ٣٩:٩",
    reference_en: "Surah Az-Zumar 39:9",
    translation_en: "Are those who know equal to those who do not know?",
    translation_ur: "کیا جاننے والے اور نہ جاننے والے برابر ہو سکتے ہیں؟",
    context: ["students", "classes"],
  },
  {
    id: "kahf-66",
    arabic:
      "هَلْ أَتَّبِعُكَ عَلَىٰ أَن تُعَلِّمَنِ مِمَّا عُلِّمْتَ رُشْدًا",
    reference_ar: "سُورَةُ الْكَهْف ١٨:٦٦",
    reference_en: "Surah Al-Kahf 18:66",
    translation_en:
      "May I follow you so that you teach me of what you have been taught of right conduct?",
    translation_ur:
      "کیا میں آپ کے ساتھ رہ سکتا ہوں تاکہ آپ مجھے وہ علم سکھائیں جو آپ کو دیا گیا؟",
    context: ["students", "teachers"],
  },
  {
    id: "asr-1-3",
    arabic:
      "وَالْعَصْرِ ۝ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ ۝ إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ",
    reference_ar: "سُورَةُ الْعَصْر ١٠٣:١-٣",
    reference_en: "Surah Al-Asr 103:1–3",
    translation_en:
      "By time — indeed, mankind is in loss — except those who believe and do righteous deeds.",
    translation_ur:
      "زمانے کی قسم — بیشک انسان خسارے میں ہے — سوائے ان لوگوں کے جو ایمان لائے اور نیک عمل کیے۔",
    context: ["attendance"],
  },
  {
    id: "inshirah-5-6",
    arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    reference_ar: "سُورَةُ الشَّرْح ٩٤:٥-٦",
    reference_en: "Surah Ash-Sharh 94:5–6",
    translation_en:
      "For indeed, with hardship will be ease. Indeed, with hardship will be ease.",
    translation_ur:
      "تو بیشک ہر مشکل کے ساتھ آسانی ہے۔ بیشک ہر مشکل کے ساتھ آسانی ہے۔",
    context: ["performance", "exams"],
  },
  {
    id: "talaq-3",
    arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    reference_ar: "سُورَةُ الطَّلَاق ٦٥:٣",
    reference_en: "Surah At-Talaq 65:3",
    translation_en:
      "And whoever relies upon Allah — then He is sufficient for him.",
    translation_ur: "اور جو اللہ پر بھروسہ رکھے تو وہی اس کے لیے کافی ہے۔",
    context: ["performance", "exams", "general"],
  },
  {
    id: "baqara-261",
    arabic:
      "مَّثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ",
    reference_ar: "سُورَةُ الْبَقَرَة ٢:٢٦١",
    reference_en: "Surah Al-Baqarah 2:261",
    translation_en:
      "The example of those who spend in the way of Allah is like a seed that grows seven spikes.",
    translation_ur:
      "جو لوگ اللہ کی راہ میں اپنا مال خرچ کرتے ہیں ان کی مثال اس دانے جیسی ہے جس سے سات بالیں اُگیں۔",
    context: ["fee"],
  },
];
