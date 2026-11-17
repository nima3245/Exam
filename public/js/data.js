// آزمون‌ها و سوالات نمونه
const TESTS = [
  {
    id: 'vocab-a2',
    title: 'آزمون واژگان پایه',
    level: 'A2',
    questionsCount: 12,
    freeLimit: 5,
    type: 'free',
    description: 'واژگان روزمره و پرکاربرد سطح پایه',
    icon: '📚',
    color: 'from-blue-500 to-indigo-600',
    questions: [
      { q: 'کدام کلمه به معنای «پیشرفت کردن» است؟', options: ['Improve', 'Reduce', 'Ignore', 'Delay'], correct: 0 },
      { q: 'معنی کلمه "Beautiful" چیست؟', options: ['زشت', 'زیبا', 'سریع', 'بزرگ'], correct: 1 },
      { q: 'کدام گزینه مترادف "Happy" است؟', options: ['Sad', 'Angry', 'Joyful', 'Tired'], correct: 2 },
      { q: '"Book" به چه معناست؟', options: ['قلم', 'کتاب', 'میز', 'صندلی'], correct: 1 },
      { q: 'معنی "Friend" چیست؟', options: ['دشمن', 'دوست', 'معلم', 'دانش‌آموز'], correct: 1 },
      { q: 'کدام کلمه به معنای «سفر کردن» است؟', options: ['Travel', 'Sleep', 'Eat', 'Write'], correct: 0 },
      { q: 'معنی "Important" چیست؟', options: ['بی‌اهمیت', 'مهم', 'کوچک', 'سریع'], correct: 1 },
      { q: 'مترادف "Big" کدام است؟', options: ['Small', 'Large', 'Thin', 'Short'], correct: 1 },
      { q: '"Water" یعنی؟', options: ['آتش', 'آب', 'هوا', 'خاک'], correct: 1 },
      { q: 'کدام گزینه به معنای «یادگیری» است؟', options: ['Learning', 'Forgetting', 'Playing', 'Running'], correct: 0 },
      { q: 'معنی "Quick" چیست؟', options: ['کند', 'سریع', 'بلند', 'کوتاه'], correct: 1 },
      { q: 'کدام کلمه به معنای «خانه» است؟', options: ['School', 'Home', 'Office', 'Park'], correct: 1 }
    ]
  },
  {
    id: 'grammar-b1',
    title: 'گرامر سطح متوسط',
    level: 'B1',
    questionsCount: 10,
    freeLimit: 4,
    type: 'free',
    description: 'زمان‌ها، ساختارهای شرطی و مجهول',
    icon: '✍️',
    color: 'from-emerald-500 to-teal-600',
    questions: [
      { q: 'She _____ to school every day.', options: ['go', 'goes', 'going', 'gone'], correct: 1 },
      { q: 'I _____ English for 5 years.', options: ['study', 'studied', 'have studied', 'am studying'], correct: 2 },
      { q: 'If it rains, we _____ at home.', options: ['stay', 'will stay', 'stayed', 'staying'], correct: 1 },
      { q: 'The book _____ by many people.', options: ['reads', 'is read', 'read', 'reading'], correct: 1 },
      { q: 'He asked me where I _____.', options: ['live', 'lived', 'living', 'lives'], correct: 1 },
      { q: 'They _____ already left when we arrived.', options: ['have', 'had', 'has', 'having'], correct: 1 },
      { q: 'I wish I _____ more time.', options: ['have', 'had', 'will have', 'having'], correct: 1 },
      { q: 'This is the house _____ I was born.', options: ['which', 'where', 'who', 'whose'], correct: 1 },
      { q: 'She is used to _____ early.', options: ['get up', 'getting up', 'got up', 'gets up'], correct: 1 },
      { q: 'By next year, I _____ graduated.', options: ['will', 'will have', 'have', 'had'], correct: 1 }
    ]
  },
  {
    id: 'listening-a2',
    title: 'درک مطلب ساده',
    level: 'A2',
    questionsCount: 8,
    freeLimit: 3,
    type: 'free',
    description: 'متن‌های کوتاه و سوالات درک مطلب',
    icon: '📖',
    color: 'from-violet-500 to-purple-600',
    questions: [
      { q: 'متن: "Tom is a teacher. He works at a school." Tom کجاست؟', options: ['در خانه', 'در مدرسه', 'در پارک', 'در فروشگاه'], correct: 1 },
      { q: 'متن: "Sara likes coffee but not tea." سارا چه چیزی دوست دارد؟', options: ['چای', 'قهوه', 'آب', 'شیر'], correct: 1 },
      { q: 'متن: "The museum opens at 9 AM." موزه چه ساعتی باز می‌شود؟', options: ['۸ صبح', '۹ صبح', '۱۰ صبح', 'ظهر'], correct: 1 },
      { q: 'متن: "I usually walk to work." گوینده معمولاً چگونه به سر کار می‌رود؟', options: ['با ماشین', 'پیاده', 'با اتوبوس', 'با دوچرخه'], correct: 1 },
      { q: 'متن: "The train was delayed by 20 minutes." قطار چند دقیقه تاخیر داشت؟', options: ['۱۰', '۱۵', '۲۰', '۳۰'], correct: 2 },
      { q: 'متن: "Please turn off your phones." درخواست چیست؟', options: ['روشن کردن گوشی', 'خاموش کردن گوشی', 'شارژ کردن', 'تماس گرفتن'], correct: 1 },
      { q: 'متن: "Meeting starts at 3 PM sharp." جلسه چه ساعتی شروع می‌شود؟', options: ['۲ بعدازظهر', '۳ بعدازظهر', '۴ بعدازظهر', 'ظهر'], correct: 1 },
      { q: 'متن: "She has two brothers and one sister." او چند خواهر دارد؟', options: ['صفر', 'یک', 'دو', 'سه'], correct: 1 }
    ]
  },
  {
    id: 'ielts-reading',
    title: 'آزمون شبیه‌سازی IELTS Reading',
    level: 'B2-C1',
    questionsCount: 15,
    freeLimit: 0,
    type: 'premium',
    description: 'پاسخی کامل به بخش Reading آزمون آیلتس با تایمر',
    icon: '🎯',
    color: 'from-rose-500 to-pink-600',
    questions: [
      { q: 'According to the passage, what is the main cause of urban heat islands?', options: ['Increased vegetation', 'High building density and dark surfaces', 'More rainfall', 'Lower population'], correct: 1 },
      { q: 'The word "mitigate" in paragraph 2 is closest in meaning to:', options: ['increase', 'reduce', 'ignore', 'measure'], correct: 1 },
      { q: 'Which of the following is NOT mentioned as a solution?', options: ['Green roofs', 'Cool pavements', 'More cars', 'Urban forests'], correct: 2 },
      { q: 'The author\'s tone can best be described as:', options: ['sarcastic', 'objective and informative', 'angry', 'humorous'], correct: 1 },
      { q: 'What percentage of cities have implemented cool roof policies according to the text?', options: ['10%', '25%', '40%', '60%'], correct: 1 },
      { q: 'The phrase "exacerbate the problem" means:', options: ['solve the problem', 'make the problem worse', 'ignore the problem', 'study the problem'], correct: 1 },
      { q: 'Which group is most vulnerable according to the passage?', options: ['Young adults', 'Elderly and children', 'Office workers', 'Tourists'], correct: 1 },
      { q: 'The passage suggests that government action is:', options: ['unnecessary', 'essential', 'too expensive', 'already complete'], correct: 1 },
      { q: 'Cool pavements work by:', options: ['absorbing more heat', 'reflecting more sunlight', 'producing shade', 'using water'], correct: 1 },
      { q: 'The main purpose of the text is to:', options: ['entertain readers', 'explain a problem and solutions', 'advertise a product', 'criticize a city'], correct: 1 },
      { q: 'According to experts, the temperature difference can reach:', options: ['2°C', '5°C', '10°C or more', '1°C'], correct: 2 },
      { q: 'Which material is recommended for roofs?', options: ['Black asphalt', 'Reflective coatings', 'Metal only', 'Wood'], correct: 1 },
      { q: 'The term "albedo" refers to:', options: ['air pollution', 'reflectivity of surfaces', 'water usage', 'noise levels'], correct: 1 },
      { q: 'Community gardens help by:', options: ['increasing heat', 'providing shade and cooling', 'attracting more cars', 'reducing jobs'], correct: 1 },
      { q: 'The conclusion of the passage emphasizes:', options: ['waiting for technology', 'immediate and combined actions', 'moving to rural areas', 'ignoring climate'], correct: 1 }
    ]
  },
  {
    id: 'toefl-structure',
    title: 'آزمون ساختار TOEFL',
    level: 'B2+',
    questionsCount: 12,
    freeLimit: 0,
    type: 'premium',
    description: 'سوالات Structure & Written Expression آزمون تافل',
    icon: '🏆',
    color: 'from-amber-500 to-orange-600',
    questions: [
      { q: 'Choose the correct sentence:', options: ['She don\'t like coffee.', 'She doesn\'t likes coffee.', 'She doesn\'t like coffee.', 'She not like coffee.'], correct: 2 },
      { q: 'Neither the teacher nor the students _____ ready.', options: ['was', 'were', 'is', 'be'], correct: 1 },
      { q: 'The book, along with the notes, _____ on the table.', options: ['are', 'is', 'were', 'have been'], correct: 1 },
      { q: 'I look forward to _____ from you.', options: ['hear', 'hearing', 'heard', 'hears'], correct: 1 },
      { q: 'Despite _____ hard, he failed the exam.', options: ['study', 'studying', 'studied', 'to study'], correct: 1 },
      { q: 'It is essential that she _____ on time.', options: ['arrives', 'arrive', 'arrived', 'arriving'], correct: 1 },
      { q: 'The more you practice, _____ you become.', options: ['the better', 'better', 'the best', 'best'], correct: 0 },
      { q: 'Had I known, I _____ differently.', options: ['would act', 'would have acted', 'will act', 'acted'], correct: 1 },
      { q: 'Not only _____ late, but he also forgot the documents.', options: ['he was', 'was he', 'he is', 'is he'], correct: 1 },
      { q: 'She prefers tea _____ coffee.', options: ['than', 'to', 'from', 'over'], correct: 1 },
      { q: 'By the time we arrive, the movie _____.', options: ['will start', 'will have started', 'starts', 'started'], correct: 1 },
      { q: 'I wish I _____ the answer yesterday.', options: ['know', 'knew', 'had known', 'have known'], correct: 2 }
    ]
  },
  {
    id: 'advanced-vocab',
    title: 'واژگان پیشرفته دانشگاهی',
    level: 'C1',
    questionsCount: 10,
    freeLimit: 0,
    type: 'premium',
    description: 'واژگان آکادمیک و اصطلاحات سطح بالا',
    icon: '💎',
    color: 'from-cyan-500 to-blue-600',
    questions: [
      { q: 'The word "ubiquitous" means:', options: ['rare', 'present everywhere', 'ancient', 'expensive'], correct: 1 },
      { q: '"Ephemeral" is closest in meaning to:', options: ['permanent', 'short-lived', 'beautiful', 'complex'], correct: 1 },
      { q: 'A "paradigm shift" refers to:', options: ['a small change', 'a fundamental change in approach', 'a financial loss', 'a legal decision'], correct: 1 },
      { q: '"Ambiguous" means:', options: ['clear', 'open to more than one interpretation', 'angry', 'happy'], correct: 1 },
      { q: 'The opposite of "benevolent" is:', options: ['kind', 'malevolent', 'neutral', 'generous'], correct: 1 },
      { q: '"Pragmatic" approach means:', options: ['idealistic', 'practical', 'theoretical', 'emotional'], correct: 1 },
      { q: '"Resilient" people are those who:', options: ['give up easily', 'recover quickly from difficulties', 'avoid challenges', 'complain a lot'], correct: 1 },
      { q: 'An "anomaly" is:', options: ['a normal occurrence', 'something that deviates from the norm', 'a scientific law', 'a type of animal'], correct: 1 },
      { q: '"Mitigate" means to:', options: ['worsen', 'make less severe', 'ignore', 'celebrate'], correct: 1 },
      { q: 'A "catalyst" is something that:', options: ['slows a process', 'speeds up or causes a change', 'stops completely', 'measures time'], correct: 1 }
    ]
  }
];

const PLANS = {
  monthly: { name: 'اشتراک ماهانه', price: 149000, days: 30 },
  quarterly: { name: 'اشتراک سه‌ماهه', price: 379000, days: 90 },
  yearly: { name: 'اشتراک سالانه', price: 999000, days: 365 }
};
