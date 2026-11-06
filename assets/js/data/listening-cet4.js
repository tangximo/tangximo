/**
 * 听力数据：四级（L1-L5）
 * 说明：文本按历年真题题型与场景整理编写，不是官方逐字稿。
 * 官方音频未内置，audio 字段一律为 null。
 * 替换方法：把对应音频放入 assets/audio/ 目录，再把 audio 字段填成音频路径，例如 assets/audio/L1.mp3。
 */
window.CET = window.CET || {};
CET.data = CET.data || {};
CET.data.listening = (CET.data.listening || []).concat([
  {
    id: "L2",
    level: "CET4",
    type: "短对话",
    source: "2020年9月 · 四级 · 短对话",
    year: 2020,
    session: "9月",
    title: "改签火车票",
    intro: "女士因会议延时错过原班火车，在窗口改签并挑选座位。",
    audio: null,
    lines: [
      { sp: "W", en: "Excuse me, I would like to change my ticket to the 3:30 train to Shanghai.", cn: "不好意思，我想把票改签到三点半去上海的那趟车。" },
      { sp: "M", en: "Let me see your ticket, please. This one is for the 1:15 train, and it is already past two.", cn: "请把票给我看一下。您这张是一点十五的车，现在已经过两点了。" },
      { sp: "W", en: "I know. My meeting ran longer than I expected. Is there any seat left on the later train?", cn: "我知道。会议比预想的拖得久。后面那趟车还有座位吗？" },
      { sp: "M", en: "There are seats in the second class coach, but you will have to pay the difference of twenty yuan.", cn: "二等座车厢还有座位，但您需要补二十元差价。" },
      { sp: "W", en: "That is fine. Can I keep my window seat?", cn: "可以。我还能保留靠窗的座位吗？" },
      { sp: "M", en: "I am afraid all window seats are taken. I can give you an aisle seat near the front.", cn: "恐怕靠窗的都没了。我可以给您一个靠前的位置，走道边。" },
      { sp: "W", en: "An aisle seat is all right. I just need to arrive in Shanghai before seven.", cn: "走道边也行。我只要七点前到上海就好。" },
      { sp: "M", en: "You will. The train gets in at 6:05.", cn: "可以的。这趟车六点零五到。" }
    ],
    questions: [
      { q: "Why does the woman need to change her ticket?", options: ["She missed her original train", "She wants to travel with a friend", "Her train was cancelled", "She prefers a later arrival time"], answer: 0, explain: "女士说会议比预想的长，而原票是一点十五的车、现在已经过两点，说明她错过了原来那趟车。" },
      { q: "How much extra does she have to pay?", options: ["Twenty yuan", "Twelve yuan", "Ten yuan", "Nothing"], answer: 0, explain: "售票员说 you will have to pay the difference of twenty yuan，需要补二十元差价。" },
      { q: "What seat does she finally get?", options: ["A window seat", "An aisle seat near the front", "A seat in the dining car", "A first class seat"], answer: 1, explain: "原文说 I can give you an aisle seat near the front，女士也接受了走道边的座位。" }
    ],
    cloze: [
      { text: "I would like to ______ my ticket to the 3:30 train to Shanghai.", answers: ["change"], hint: "改签、更改" },
      { text: "My meeting ran longer than I ______.", answers: ["expected"], hint: "预料、预期" },
      { text: "The train ______ in at 6:05.", answers: ["gets"], hint: "到达（get in）" }
    ]
  },
  {
    id: "L3",
    level: "CET4",
    type: "长对话",
    source: "2021年6月 · 四级 · 长对话",
    year: 2021,
    session: "6月",
    title: "周末志愿者招募",
    intro: "两人讨论社区图书馆周末阅读志愿项目的培训与任务安排。",
    audio: null,
    lines: [
      { sp: "W", en: "Hi, Daniel. I saw a notice about the weekend reading program at the community library. Are they still looking for volunteers?", cn: "嗨，丹尼尔。我看到社区图书馆周末阅读活动的通知。他们还在招志愿者吗？" },
      { sp: "M", en: "They are, but the training session is on Wednesday evening. Can you make it?", cn: "还在招，不过培训是周三晚上。你能来吗？" },
      { sp: "W", en: "I have a part time job at the coffee shop until seven on Wednesday.", cn: "我周三在咖啡店做兼职，要到七点。" },
      { sp: "M", en: "The training starts at seven thirty, so you could come straight from work.", cn: "培训七点半开始，你可以下班直接过来。" },
      { sp: "W", en: "Good. I have never worked with children before. Do I need any experience?", cn: "好。我以前没和孩子打过交道。需要有经验吗？" },
      { sp: "M", en: "No, they only ask for patience and a clear voice, and they will pair you with an experienced volunteer.", cn: "不需要，他们只要求有耐心、声音清楚，还会把你和有经验的志愿者配在一起。" },
      { sp: "W", en: "How many weekends do they expect me to commit to?", cn: "他们希望我承诺几个周末？" },
      { sp: "M", en: "Just four weekends this term, and you can choose either Saturday or Sunday.", cn: "这学期只要四个周末，周六或周日都可以选。" }
    ],
    questions: [
      { q: "What is the woman interested in?", options: ["A weekend reading program", "A cooking class", "A paid job at a library", "A drawing competition"], answer: 0, explain: "女士一开始就问社区图书馆周末阅读活动是否还在招志愿者，说明她感兴趣的是这个阅读项目。" },
      { q: "What does the man say is required of volunteers?", options: ["A teaching certificate", "Patience and a clear voice", "One year of experience", "A university degree"], answer: 1, explain: "男士说 they only ask for patience and a clear voice，只要求耐心和清楚的声音，不需要经验。" },
      { q: "How long is the commitment?", options: ["Four weekends this term", "Two evenings a week", "The whole year", "One weekend per month"], answer: 0, explain: "原文说 Just four weekends this term，本学期只需四个周末。" }
    ],
    cloze: [
      { text: "Are they still looking for ______?", answers: ["volunteers"], hint: "志愿者" },
      { text: "The training ______ is on Wednesday evening.", answers: ["session"], hint: "培训场次" },
      { text: "They will ______ you with an experienced volunteer.", answers: ["pair"], hint: "把……配对" }
    ]
  },
  {
    id: "L4",
    level: "CET4",
    type: "短文",
    source: "2022年6月 · 四级 · 短文",
    year: 2022,
    session: "6月",
    title: "免费的公开课",
    intro: "短文介绍面向成人的免费公开课，以及它的优势与坚持难点。",
    audio: null,
    lines: [
      { sp: "W", en: "Ten years ago, most people thought that learning ended when they left school.", cn: "十年前，多数人认为离开学校学习就结束了。" },
      { sp: "W", en: "Today, however, millions of adults sign up for free online courses every year.", cn: "然而今天，每年有数百万成年人报名免费的在线课程。" },
      { sp: "W", en: "These open courses are offered by universities and companies, and anyone with an internet connection can join.", cn: "这些公开课由大学和企业提供，只要能上网，任何人都可以参加。" },
      { sp: "W", en: "The courses rarely give a formal degree, but they do provide a certificate when you finish all the assignments.", cn: "这类课程一般不给正式学位，但完成所有作业后会发证书。" },
      { sp: "W", en: "Learners say the biggest benefit is flexibility: they can watch a lecture at midnight and hand in homework on Sunday.", cn: "学习者说最大的好处是灵活：可以半夜看讲座，周日交作业。" },
      { sp: "W", en: "The biggest challenge is not the price but the discipline, because no teacher is waiting for you in a classroom.", cn: "最大的挑战不是费用而是自律，因为教室里没有老师等着你。" },
      { sp: "W", en: "Experts suggest studying for twenty minutes a day rather than saving everything for the weekend.", cn: "专家建议每天学二十分钟，而不是把内容都攒到周末。" },
      { sp: "W", en: "In that way, a free course can become a habit, and a habit can last a lifetime.", cn: "这样，一门免费课程就能变成习惯，而习惯可以伴随一生。" }
    ],
    questions: [
      { q: "Who can join the open courses?", options: ["Only university students", "Anyone with an internet connection", "Only people who pay a fee", "Only employees of certain companies"], answer: 1, explain: "原文说 anyone with an internet connection can join，只要能上网的人都可以参加。" },
      { q: "What do learners receive after finishing all the assignments?", options: ["A formal degree", "A certificate", "A job offer", "A textbook"], answer: 1, explain: "原文说 they do provide a certificate when you finish all the assignments。" },
      { q: "What is the biggest challenge for these learners?", options: ["The high price", "The lack of teachers", "Keeping disciplined", "The difficult exams"], answer: 2, explain: "原文说 The biggest challenge is not the price but the discipline，最大的挑战是自律。" }
    ],
    cloze: [
      { text: "Today, however, millions of adults ______ up for free online courses every year.", answers: ["sign"], hint: "报名（sign up）" },
      { text: "The biggest ______ is not the price but the discipline.", answers: ["challenge"], hint: "挑战" },
      { text: "Experts suggest studying for twenty minutes a day rather than ______ everything for the weekend.", answers: ["saving"], hint: "留到、攒到" }
    ]
  },
  {
    id: "L5",
    level: "CET4",
    type: "新闻",
    source: "2023年6月 · 四级 · 新闻",
    year: 2023,
    session: "6月",
    title: "共享单车新规",
    intro: "新闻报道某城市出台共享单车停放新规，以及市民的不同反应。",
    audio: null,
    lines: [
      { sp: "N", en: "The city government announced on Monday that shared bicycles must be parked in marked areas starting next month.", cn: "市政府周一宣布，从下个月起共享单车必须停放在划线区域内。" },
      { sp: "N", en: "Riders who leave a bike outside these areas will receive a warning for the first time and a fine of fifty yuan after that.", cn: "把车停到区域外的骑行者第一次会收到警告，之后再犯罚款五十元。" },
      { sp: "N", en: "The new rule follows a survey showing that nearly half of the complaints about the city's streets involved bikes blocking sidewalks.", cn: "新规源于一项调查：有关本市街道的投诉中近一半涉及单车堵住人行道。" },
      { sp: "N", en: "Companies that operate the bikes will also be required to remove broken ones within forty eight hours.", cn: "运营企业还必须在四十八小时内清理损坏的单车。" },
      { sp: "N", en: "According to the transport office, about two hundred thousand shared bikes are in use in the city every day.", cn: "据交通部门介绍，全市每天约有二十万辆共享单车在使用。" },
      { sp: "N", en: "Some riders welcomed the rule, saying it would keep pavements clear for older people and parents with pushchairs.", cn: "一些骑行者欢迎这一规定，认为能让老人和推婴儿车的家长通行便利。" },
      { sp: "N", en: "Others complained that the marked areas are too far from their homes and offices.", cn: "也有人抱怨划线区域离家或办公室太远。" },
      { sp: "N", en: "The government says it will add one thousand parking zones before the end of the year.", cn: "政府表示年底前将增设一千个停车区。" }
    ],
    questions: [
      { q: "What must riders do starting next month?", options: ["Pay a monthly fee", "Park bikes in marked areas", "Register their bicycles", "Wear a helmet"], answer: 1, explain: "新闻开头说 shared bicycles must be parked in marked areas starting next month。" },
      { q: "What happens after a first warning?", options: ["The bike is taken away", "A fine of fifty yuan", "A one month ban", "Nothing at all"], answer: 1, explain: "原文说 receive a warning for the first time and a fine of fifty yuan after that，再犯罚款五十元。" },
      { q: "What will the government do by the end of the year?", options: ["Add one thousand parking zones", "Remove all shared bikes", "Build new bike lanes", "Raise the price of riding"], answer: 0, explain: "新闻最后一句说 it will add one thousand parking zones before the end of the year。" }
    ],
    cloze: [
      { text: "Riders who leave a bike outside these areas will receive a ______ for the first time.", answers: ["warning"], hint: "警告" },
      { text: "Companies will be required to remove ______ ones within forty eight hours.", answers: ["broken"], hint: "损坏的" },
      { text: "The government says it will add one thousand parking ______ before the end of the year.", answers: ["zones"], hint: "区域" }
    ]
  }
]);
