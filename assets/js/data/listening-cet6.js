/**
 * 听力数据：六级（L6-L12）
 * 说明：文本按历年真题题型与场景整理编写，不是官方逐字稿。
 * 官方音频未内置，audio 字段一律为 null。
 * 替换方法：把对应音频放入 assets/audio/ 目录，再把 audio 字段填成音频路径，例如 assets/audio/L6.mp3。
 */
window.CET = window.CET || {};
CET.data = CET.data || {};
CET.data.listening = (CET.data.listening || []).concat([
  {
    id: "L7",
    level: "CET6",
    type: "讲座",
    source: "2020年9月 · 六级 · 讲座",
    year: 2020,
    session: "9月",
    title: "睡眠如何巩固记忆",
    intro: "讲座阐述睡眠如何巩固白天所学，以及睡眠不足带来的影响。",
    audio: null,
    lines: [
      { sp: "M", en: "Good evening. Tonight I want to explain how sleep protects what you learn during the day.", cn: "晚上好。今晚我想讲睡眠如何保护你白天学到的东西。" },
      { sp: "M", en: "When you study a new list of words, the information is first stored in a fragile form in the brain.", cn: "当你学习一组新单词时，信息最初以不稳定的形式存储在大脑中。" },
      { sp: "M", en: "During deep sleep, the brain replays these patterns and moves them into long term memory.", cn: "在深度睡眠中，大脑会重放这些模式，并把它们转入长期记忆。" },
      { sp: "M", en: "In one classic experiment, students who slept after learning recalled forty percent more words than those who stayed awake.", cn: "在一项经典实验中，学习后睡觉的学生比保持清醒者多记住百分之四十的单词。" },
      { sp: "M", en: "The same effect appears with physical skills, such as playing a piece of music or serving a tennis ball.", cn: "同样的效果也出现在身体技能上，比如演奏一首曲子或发网球。" },
      { sp: "M", en: "Lack of sleep does more than weaken memory. It also makes people slower at judging risks and less able to control their emotions.", cn: "缺觉不只是削弱记忆，还会让人判断风险更慢、更难控制情绪。" },
      { sp: "M", en: "Some students believe they can catch up at the weekend, but research shows that one long lie in does not repair a week of short nights.", cn: "有些学生以为周末能补回来，但研究表明睡一次懒觉无法弥补一周的睡眠不足。" },
      { sp: "M", en: "So the advice is simple: keep a regular bedtime, and treat sleep as part of study rather than as time taken away from it.", cn: "所以建议很简单：保持固定的睡觉时间，把睡眠当作学习的一部分，而不是被学习占用的时间。" }
    ],
    questions: [
      { q: "What happens during deep sleep according to the lecture?", options: ["The brain deletes useless information", "The brain moves patterns into long term memory", "The brain stops working completely", "The brain produces new words"], answer: 1, explain: "原文说 During deep sleep, the brain replays these patterns and moves them into long term memory。" },
      { q: "In the classic experiment, how much more did the sleeping students recall?", options: ["Four percent", "Fourteen percent", "Forty percent", "Four hundred words"], answer: 2, explain: "原文说 recalled forty percent more words，多记住了百分之四十。" },
      { q: "What does the speaker say about catching up at the weekend?", options: ["It fully repairs a week of short nights", "It does not repair a week of short nights", "It is better than regular sleep", "It permanently harms memory"], answer: 1, explain: "原文说 one long lie in does not repair a week of short nights，周末补觉弥补不了一周的睡眠不足。" }
    ],
    cloze: [
      { text: "During deep sleep, the brain ______ these patterns and moves them into long term memory.", answers: ["replays"], hint: "重放、回放" },
      { text: "Lack of sleep does more than ______ memory.", answers: ["weaken"], hint: "削弱" },
      { text: "Keep a regular ______, and treat sleep as part of study.", answers: ["bedtime"], hint: "睡觉时间" }
    ]
  },
  {
    id: "L8",
    level: "CET6",
    type: "短文",
    source: "2021年6月 · 六级 · 短文",
    year: 2021,
    session: "6月",
    title: "海洋塑料的来源",
    intro: "短文说明海洋塑料污染的来源、微塑料的危害与治理思路。",
    audio: null,
    lines: [
      { sp: "W", en: "Every year, about eleven million tons of plastic waste enter the world's oceans.", cn: "每年约有1100万吨塑料垃圾进入世界海洋。" },
      { sp: "W", en: "Most of it does not come from ships. It flows down rivers from cities and farms far inland.", cn: "其中大部分并非来自船只，而是从内陆城市和农场顺河流而下。" },
      { sp: "W", en: "Sunlight and waves break the plastic into tiny pieces called microplastics, which are smaller than five millimetres.", cn: "阳光和海浪把塑料打碎成小于五毫米的微粒，称为微塑料。" },
      { sp: "W", en: "Fish mistake these pieces for food, and the plastic then travels up the food chain to the tables of people.", cn: "鱼把这些碎片误当食物，塑料随后沿食物链进入人们的餐桌。" },
      { sp: "W", en: "Scientists have found microplastics in salt, in bottled water, and even in the snow on remote mountains.", cn: "科学家在食盐、瓶装水中，甚至偏远山区的雪里都发现了微塑料。" },
      { sp: "W", en: "Cleaning the ocean surface is expensive and removes only a small share of the waste.", cn: "清理海面代价高昂，而且只能清除很小一部分垃圾。" },
      { sp: "W", en: "Researchers therefore argue that the answer lies upstream: better waste collection, less single use packaging, and filters on washing machines.", cn: "因此研究者认为答案在上游：更好的垃圾收集、更少的一次性包装，以及洗衣机过滤器。" },
      { sp: "W", en: "One study estimates that improving waste collection in twelve coastal countries could cut the flow of plastic by half within a decade.", cn: "一项研究估计，改善十二个沿海国家的垃圾收集，可在十年内把塑料流入量减半。" }
    ],
    questions: [
      { q: "Where does most ocean plastic come from?", options: ["Ships at sea", "Rivers flowing from inland cities and farms", "Volcanoes under the sea", "Fishing boats only"], answer: 1, explain: "原文说 Most of it does not come from ships. It flows down rivers from cities and farms far inland。" },
      { q: "What are microplastics?", options: ["Pieces smaller than five millimetres", "A kind of sea animal", "Large plastic bottles", "Chemicals used on farms"], answer: 0, explain: "原文说 tiny pieces called microplastics, which are smaller than five millimetres。" },
      { q: "What do researchers suggest as the main solution?", options: ["Cleaning the ocean surface", "Better waste collection upstream", "Banning all fishing", "Building more ships"], answer: 1, explain: "原文说 the answer lies upstream: better waste collection，答案在上游的垃圾收集环节。" }
    ],
    cloze: [
      { text: "Sunlight and waves break the plastic into tiny pieces called ______.", answers: ["microplastics"], hint: "微塑料" },
      { text: "Fish ______ these pieces for food.", answers: ["mistake"], hint: "误认为" },
      { text: "The answer lies upstream: better waste ______.", answers: ["collection"], hint: "收集" }
    ]
  },
  {
    id: "L9",
    level: "CET6",
    type: "新闻",
    source: "2022年6月 · 六级 · 新闻",
    year: 2022,
    session: "6月",
    title: "远程办公的新常态",
    intro: "新闻报道远程办公成为常态后企业的调整，以及潜在的隐忧。",
    audio: null,
    lines: [
      { sp: "N", en: "A new survey of three thousand companies shows that remote work has become a permanent part of office life.", cn: "一项针对三千家企业的新调查显示，远程办公已成为办公生活中永久的一部分。" },
      { sp: "N", en: "Nearly sixty percent of the firms now allow employees to work from home at least two days a week.", cn: "现在近六成企业允许员工每周至少两天在家办公。" },
      { sp: "N", en: "The survey also found that staff save an average of forty minutes a day on commuting.", cn: "调查还发现，员工平均每天节省四十分钟通勤时间。" },
      { sp: "N", en: "However, managers reported a rise in the time spent in online meetings, with some describing their calendars as full from morning to night.", cn: "但管理者反映线上会议时间增加，有人形容日程从早到晚排满。" },
      { sp: "N", en: "Several companies have responded by setting quiet hours, during which no internal meetings may be scheduled.", cn: "一些企业的应对办法是设立安静时段，期间不得安排内部会议。" },
      { sp: "N", en: "Others are redesigning offices with fewer desks and more rooms for teamwork and training.", cn: "另一些企业则在改造办公室，减少工位，增加用于协作和培训的空间。" },
      { sp: "N", en: "The report warns that junior employees may lose chances to learn if they rarely meet senior colleagues in person.", cn: "报告警告，初级员工若很少与资深同事面对面交流，可能失去学习机会。" },
      { sp: "N", en: "It suggests that teams come to the office on the same days rather than on days of their own choosing.", cn: "报告建议各团队统一到办公室的日子，而不是各自随意选择。" }
    ],
    questions: [
      { q: "What do nearly sixty percent of the firms allow?", options: ["Working from home at least two days a week", "A four day working week", "Unlimited holidays", "Free commuting buses"], answer: 0, explain: "原文说 allow employees to work from home at least two days a week。" },
      { q: "What problem did managers report?", options: ["Fewer online meetings", "More time spent in online meetings", "A fall in productivity", "A loss of office space"], answer: 1, explain: "原文说 managers reported a rise in the time spent in online meetings。" },
      { q: "What does the report suggest about teams?", options: ["They should never meet in person", "They should come to the office on the same days", "They should work only from home", "They should hire more junior staff"], answer: 1, explain: "最后一句说 teams come to the office on the same days rather than on days of their own choosing。" }
    ],
    cloze: [
      { text: "Remote work has become a ______ part of office life.", answers: ["permanent"], hint: "永久的" },
      { text: "Staff save an average of forty minutes a day on ______.", answers: ["commuting"], hint: "通勤" },
      { text: "Several companies have responded by setting ______ hours, during which no internal meetings may be scheduled.", answers: ["quiet"], hint: "安静的" }
    ]
  },
  {
    id: "L10",
    level: "CET6",
    type: "讲座",
    source: "2023年6月 · 六级 · 讲座",
    year: 2023,
    session: "6月",
    title: "人工智能会取代哪些岗位",
    intro: "讲座讨论人工智能对岗位任务的影响，并以历史经验给出启示。",
    audio: null,
    lines: [
      { sp: "M", en: "Today I will discuss a question that worries many of you: will artificial intelligence take our jobs?", cn: "今天我要讨论一个让很多人担忧的问题：人工智能会抢走我们的工作吗？" },
      { sp: "M", en: "The honest answer is that it will take some tasks, not whole jobs, at least in the near future.", cn: "坦率的答案是：至少近期内，它取代的是一些任务，而不是整个岗位。" },
      { sp: "M", en: "Machines are very good at tasks that repeat, such as checking invoices or answering standard questions.", cn: "机器非常擅长重复性任务，比如核对发票或回答标准问题。" },
      { sp: "M", en: "They are still poor at tasks that need judgment, negotiation, or care for another person.", cn: "它们仍然不擅长需要判断、谈判或照顾他人的任务。" },
      { sp: "M", en: "History offers a useful pattern. When banks installed cash machines, the number of bank clerks did not fall, because staff began to sell other services.", cn: "历史提供了有用的规律。银行装取款机时，柜员数量并没有减少，因为员工开始销售其他服务。" },
      { sp: "M", en: "The people who were most affected were those whose jobs consisted of a single routine task.", cn: "受影响最大的是那些工作只包含单一常规任务的人。" },
      { sp: "M", en: "The lesson is that the risk is highest for narrow skills and lowest for people who keep learning and combine technical knowledge with communication.", cn: "结论是：技能越单一风险越高，而持续学习、把技术知识与沟通结合的人风险最低。" },
      { sp: "M", en: "So rather than asking which jobs will disappear, we should ask which tasks we can hand over, and what new tasks that frees us to do.", cn: "所以与其问哪些岗位会消失，不如问哪些任务可以交出去，以及这让我们腾出手来做哪些新任务。" }
    ],
    questions: [
      { q: "What does the speaker say AI will take?", options: ["Whole jobs immediately", "Some tasks rather than whole jobs", "Only jobs in banks", "No jobs at all"], answer: 1, explain: "原文说 it will take some tasks, not whole jobs, at least in the near future。" },
      { q: "What example from history does he give?", options: ["Banks installing cash machines", "Factories using robots in 1900", "Farmers leaving the land", "Schools closing their doors"], answer: 0, explain: "原文举例 When banks installed cash machines, the number of bank clerks did not fall。" },
      { q: "Who faces the highest risk according to the lecture?", options: ["People with narrow routine skills", "People who combine technical knowledge with communication", "Managers who negotiate contracts", "Workers who keep learning"], answer: 0, explain: "原文说 the risk is highest for narrow skills，技能单一者风险最高。" }
    ],
    cloze: [
      { text: "Machines are very good at tasks that ______, such as checking invoices.", answers: ["repeat"], hint: "重复" },
      { text: "They are still poor at tasks that need ______, negotiation, or care for another person.", answers: ["judgment"], hint: "判断力" },
      { text: "We should ask which tasks we can hand over, and what new tasks that ______ us to do.", answers: ["frees"], hint: "使……腾出、解放" }
    ]
  },
  {
    id: "L11",
    level: "CET6",
    type: "长对话",
    source: "2024年6月 · 六级 · 长对话",
    year: 2024,
    session: "6月",
    title: "学术会议的行程",
    intro: "助理与教授核对学术会议的日程冲突，并安排机票、住宿与材料。",
    audio: null,
    lines: [
      { sp: "W", en: "Professor Hale, have you received the final program for the conference in Lisbon?", cn: "黑尔教授，您收到里斯本会议的最终日程了吗？" },
      { sp: "M", en: "I have, but there is a clash. My talk and the session on language testing are both on Thursday morning.", cn: "收到了，但有冲突。我的报告和语言测试专场都在周四上午。" },
      { sp: "W", en: "Let me check. Your talk is at nine, and the other session ends at ten thirty, so you can still catch the second half.", cn: "我查一下。您的报告九点开始，另一个专场十点半结束，您还能赶上后半段。" },
      { sp: "M", en: "Good, the rooms are in the same building. I would like a full night's sleep before presenting, so could you book me on the Tuesday evening flight?", cn: "好，会场都在同一栋楼。我想在做报告前睡个整觉，所以能帮我订周二晚上的航班吗？" },
      { sp: "W", en: "Certainly. I will also reserve a hotel room within walking distance of the hall.", cn: "当然。我还会订一间离会场步行可达的酒店。" },
      { sp: "M", en: "Thank you. One more thing: could you print my slides and put them in the conference folder?", cn: "谢谢。还有一件事：能帮我把幻灯片打印出来放进会议资料袋吗？" },
      { sp: "W", en: "Of course. I will also ask the organizers whether they need a copy in advance for the projector.", cn: "当然。我还会问主办方是否需要提前提供一份用于投影。" },
      { sp: "M", en: "That would help. And please put a paper copy in my bag as a backup.", cn: "那很有帮助。另外请在我的包里放一份纸质备份。" }
    ],
    questions: [
      { q: "What is the problem with the program?", options: ["Two sessions clash on Thursday morning", "The conference was cancelled", "The hotel is too far from the hall", "The flight was delayed"], answer: 0, explain: "男士说 there is a clash，自己的报告和语言测试专场都在周四上午，构成日程冲突。" },
      { q: "Why does the man want the Tuesday evening flight?", options: ["It is much cheaper", "He wants a full night's sleep before presenting", "He has another meeting on Wednesday", "There are no morning flights"], answer: 1, explain: "原文说 I would like a full night's sleep before presenting。" },
      { q: "What does the man ask the woman to do?", options: ["Print his slides", "Rewrite the whole program", "Book a taxi for each day", "Buy a new projector"], answer: 0, explain: "原文说 could you print my slides and put them in the conference folder。" }
    ],
    cloze: [
      { text: "My talk and the session on language testing are both on ______ morning.", answers: ["thursday"], hint: "星期四" },
      { text: "I would like a full night's ______ before presenting.", answers: ["sleep"], hint: "睡眠" },
      { text: "Could you ______ my slides and put them in the conference folder?", answers: ["print"], hint: "打印" }
    ]
  },
  {
    id: "L12",
    level: "CET6",
    type: "短文",
    source: "2025年6月 · 六级 · 短文",
    year: 2025,
    session: "6月",
    title: "城市绿地与居民健康",
    intro: "短文介绍城市绿地与居民健康的关系，以及绿地分配不均的问题。",
    audio: null,
    lines: [
      { sp: "W", en: "More than half of the people in the world now live in cities, and that share is still rising.", cn: "全球已有超过一半人口居住在城市，而且这一比例仍在上升。" },
      { sp: "W", en: "A growing body of research links green spaces to better physical and mental health.", cn: "越来越多的研究把绿地和更好的身心健康联系起来。" },
      { sp: "W", en: "One study of eight thousand adults found that those living within three hundred metres of a park walked more and reported less stress.", cn: "一项针对八千名成年人的研究发现，住在距公园三百米内的人走路更多、压力更小。" },
      { sp: "W", en: "Another study showed that children with trees near their schools were more attentive in class.", cn: "另一项研究显示，学校附近有树木的孩子上课更专注。" },
      { sp: "W", en: "The effect is not only about exercise. Green areas lower summer temperatures and help clean the air.", cn: "这种作用不只与运动有关。绿地在夏季降低温度，还有助于净化空气。" },
      { sp: "W", en: "Yet the benefits are not shared equally. Poorer districts often have less than half the green space of wealthy ones.", cn: "然而好处并未公平分享，较贫困城区的绿地面常不到富裕城区的一半。" },
      { sp: "W", en: "Some cities now require a small park within a five minute walk of every home, and they count trees as part of the public health budget.", cn: "一些城市现在要求每个住所步行五分钟内有一处小公园，并把树木纳入公共卫生预算。" },
      { sp: "W", en: "The lesson is that planting trees is not a decoration. It is a cheap and lasting investment in the health of a city.", cn: "结论是：种树不是装饰，而是对城市健康的一项低成本而持久的投资。" }
    ],
    questions: [
      { q: "What did the study of eight thousand adults find?", options: ["People near parks walked more and reported less stress", "People near parks slept less", "Parks raised summer temperatures", "Trees made children less attentive"], answer: 0, explain: "原文说 those living within three hundred metres of a park walked more and reported less stress。" },
      { q: "Why are green areas useful besides exercise?", options: ["They lower summer temperatures and help clean the air", "They increase traffic in the city", "They create more office space", "They reduce rainfall in winter"], answer: 0, explain: "原文说 Green areas lower summer temperatures and help clean the air。" },
      { q: "What problem does the speaker mention?", options: ["Green space is not shared equally", "There are too many parks", "Trees are too expensive to plant", "Children dislike green spaces"], answer: 0, explain: "原文说 the benefits are not shared equally，贫困城区绿地明显更少。" }
    ],
    cloze: [
      { text: "A growing body of research ______ green spaces to better physical and mental health.", answers: ["links"], hint: "把……联系起来" },
      { text: "Green areas lower summer temperatures and help clean the ______.", answers: ["air"], hint: "空气" },
      { text: "Planting trees is a cheap and ______ investment in the health of a city.", answers: ["lasting"], hint: "持久的" }
    ]
  }
]);
