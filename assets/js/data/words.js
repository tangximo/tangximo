/* =========================================================
   高频词汇数据
   - 基础词表：CET-4 105 词 + CET-6 105 词（A-C / A-D）
   - 扩展词表：words-4a.js ~ words-4e.js、words-6a.js ~ words-6e.js
     加载后按单词去重，实际总数在页面「词库浏览」与卡片头部实时显示
     当前超过 1000 词（四级 / 六级各 500+）
   字段：[单词, 音标, 词性, 中文释义, 英文例句, 例句翻译]
   每 20 词为一个章节，与每日 20 词打卡对齐
   ========================================================= */
window.CET = window.CET || {};
CET.data = CET.data || {};

(function () {
  var RAW4 = [
    ["abandon", "/əˈbændən/", "v.", "放弃；抛弃", "They had to abandon the plan because of the storm.", "因为暴风雨，他们不得不放弃这个计划。"],
    ["ability", "/əˈbɪləti/", "n.", "能力；才能", "She has the ability to solve difficult problems.", "她有解决难题的能力。"],
    ["absolute", "/ˈæbsəluːt/", "adj.", "绝对的；完全的", "I have absolute trust in my teammates.", "我完全信任我的队友。"],
    ["absorb", "/əbˈzɔːb/", "v.", "吸收；理解", "Plants absorb water through their roots.", "植物通过根吸收水分。"],
    ["academic", "/ˌækəˈdemɪk/", "adj.", "学术的；学业的", "His academic performance improved a lot this term.", "他这学期的学业成绩进步很大。"],
    ["accelerate", "/əkˈseləreɪt/", "v.", "加速；促进", "The government plans to accelerate economic growth.", "政府计划加快经济增长。"],
    ["access", "/ˈækses/", "n./v.", "通道；使用权；访问", "Students have free access to the online library.", "学生可以免费使用在线图书馆。"],
    ["accommodate", "/əˈkɒmədeɪt/", "v.", "容纳；为……提供住宿", "The hall can accommodate two hundred people.", "这个大厅可以容纳两百人。"],
    ["accompany", "/əˈkʌmpəni/", "v.", "陪伴；伴随", "I will accompany you to the hospital.", "我会陪你去医院。"],
    ["accomplish", "/əˈkʌmplɪʃ/", "v.", "完成；实现", "We accomplished the task ahead of time.", "我们提前完成了任务。"],
    ["accurate", "/ˈækjərət/", "adj.", "准确的；精确的", "The weather forecast is not always accurate.", "天气预报并不总是准确。"],
    ["achieve", "/əˈtʃiːv/", "v.", "实现；达到", "You can achieve your goal with hard work.", "通过努力你可以实现目标。"],
    ["acquire", "/əˈkwaɪə/", "v.", "获得；习得", "Children acquire language naturally.", "儿童自然而然地习得语言。"],
    ["adapt", "/əˈdæpt/", "v.", "适应；改编", "It took me a month to adapt to the new city.", "我花了一个月适应新城市。"],
    ["adequate", "/ˈædɪkwət/", "adj.", "足够的；适当的", "Make sure you get adequate sleep before the exam.", "考试前要确保睡眠充足。"],
    ["adjust", "/əˈdʒʌst/", "v.", "调整；适应", "Please adjust the chair to a comfortable height.", "请把椅子调到舒适的高度。"],
    ["admire", "/ədˈmaɪə/", "v.", "钦佩；欣赏", "I admire her courage to speak in public.", "我钦佩她当众讲话的勇气。"],
    ["admit", "/ədˈmɪt/", "v.", "承认；准许进入", "He admitted that he had made a mistake.", "他承认自己犯了错误。"],
    ["adopt", "/əˈdɒpt/", "v.", "采用；收养", "The school adopted a new teaching method.", "学校采用了一种新的教学方法。"],
    ["advance", "/ədˈvɑːns/", "v./n.", "前进；进步；进展", "Medical science has advanced rapidly.", "医学发展迅速。"],
    ["advantage", "/ədˈvɑːntɪdʒ/", "n.", "优势；好处", "Living near campus is a great advantage.", "住在校园附近是一大优势。"],
    ["affect", "/əˈfekt/", "v.", "影响；感动", "Lack of sleep can affect your memory.", "睡眠不足会影响记忆力。"],
    ["afford", "/əˈfɔːd/", "v.", "负担得起；承担", "We can't afford a new car this year.", "今年我们买不起新车。"],
    ["agency", "/ˈeɪdʒənsi/", "n.", "机构；代理", "She booked the tour through a travel agency.", "她通过旅行社预订了这次旅行。"],
    ["alarm", "/əˈlɑːm/", "n./v.", "警报；使惊恐", "The fire alarm woke everyone up.", "火警警报把所有人都惊醒了。"],
    ["alter", "/ˈɔːltə/", "v.", "改变；改动", "Nothing can alter my decision.", "什么也不能改变我的决定。"],
    ["amaze", "/əˈmeɪz/", "v.", "使惊奇", "Her progress amazed all her teachers.", "她的进步让所有老师都感到惊讶。"],
    ["ambition", "/æmˈbɪʃn/", "n.", "雄心；抱负", "His ambition is to become a doctor.", "他的抱负是成为一名医生。"],
    ["analyze", "/ˈænəlaɪz/", "v.", "分析", "We need to analyze the data carefully.", "我们需要仔细分析这些数据。"],
    ["ancient", "/ˈeɪnʃənt/", "adj.", "古代的；古老的", "We visited an ancient temple in the mountains.", "我们参观了山中的一座古庙。"],
    ["announce", "/əˈnaʊns/", "v.", "宣布；通告", "The company announced a new product yesterday.", "公司昨天发布了一款新产品。"],
    ["annual", "/ˈænjuəl/", "adj.", "每年的；年度的", "The annual meeting will be held in May.", "年会将在五月举行。"],
    ["anxious", "/ˈæŋkʃəs/", "adj.", "焦虑的；渴望的", "She felt anxious before the job interview.", "面试前她感到焦虑。"],
    ["apologize", "/əˈpɒlədʒaɪz/", "v.", "道歉", "I apologize for being late.", "我为迟到道歉。"],
    ["apparent", "/əˈpærənt/", "adj.", "明显的；表面上的", "It was apparent that he was very tired.", "很明显他非常疲惫。"],
    ["appeal", "/əˈpiːl/", "v./n.", "呼吁；有吸引力", "The charity appealed to the public for donations.", "慈善机构呼吁公众捐款。"],
    ["appetite", "/ˈæpɪtaɪt/", "n.", "食欲；欲望", "Exercise gave me a good appetite.", "运动让我食欲大开。"],
    ["apply", "/əˈplaɪ/", "v.", "申请；应用", "She applied for a scholarship last month.", "她上个月申请了奖学金。"],
    ["appreciate", "/əˈpriːʃieɪt/", "v.", "感激；欣赏", "I really appreciate your help.", "我非常感谢你的帮助。"],
    ["approach", "/əˈprəʊtʃ/", "v./n.", "接近；方法", "We need a new approach to this problem.", "我们需要用新方法解决这个问题。"],
    ["appropriate", "/əˈprəʊpriət/", "adj.", "恰当的；合适的", "Jeans are not appropriate for a formal dinner.", "牛仔裤不适合正式晚宴。"],
    ["approve", "/əˈpruːv/", "v.", "批准；赞成", "My parents approve of my study plan.", "父母赞成我的学习计划。"],
    ["argue", "/ˈɑːɡjuː/", "v.", "争论；主张", "They argued about the best way to travel.", "他们争论最好的旅行方式。"],
    ["arrange", "/əˈreɪndʒ/", "v.", "安排；排列", "Let's arrange a meeting for next Monday.", "我们安排下周一开会吧。"],
    ["arrest", "/əˈrest/", "v./n.", "逮捕；阻挡", "The police arrested the thief near the station.", "警察在车站附近逮捕了小偷。"],
    ["artificial", "/ˌɑːtɪˈfɪʃl/", "adj.", "人造的；人工的", "Artificial intelligence is changing our lives.", "人工智能正在改变我们的生活。"],
    ["aspect", "/ˈæspekt/", "n.", "方面；外观", "We should consider every aspect of the plan.", "我们应该考虑计划的每个方面。"],
    ["assess", "/əˈses/", "v.", "评估；评定", "Teachers assess students' progress each month.", "老师每月评估学生的进步。"],
    ["assist", "/əˈsɪst/", "v.", "帮助；协助", "A nurse assisted the doctor during the operation.", "一位护士在手术中协助医生。"],
    ["associate", "/əˈsəʊʃieɪt/", "v.", "联系；联想", "People often associate red with luck.", "人们常把红色与好运联系起来。"],
    ["assume", "/əˈsjuːm/", "v.", "假定；承担", "I assume you have read the notice.", "我想你已经看过通知了。"],
    ["attach", "/əˈtætʃ/", "v.", "附上；系上", "Please attach your photo to the form.", "请把照片附在表格上。"],
    ["attempt", "/əˈtempt/", "v./n.", "尝试；企图", "He attempted to fix the computer himself.", "他试着自己修电脑。"],
    ["attitude", "/ˈætɪtjuːd/", "n.", "态度；看法", "A positive attitude helps you learn faster.", "积极的态度有助于更快学习。"],
    ["attract", "/əˈtrækt/", "v.", "吸引；引起", "The exhibition attracted thousands of visitors.", "展览吸引了成千上万的参观者。"],
    ["authority", "/ɔːˈθɒrəti/", "n.", "权威；当局", "The local authority is responsible for the roads.", "地方当局负责道路管理。"],
    ["available", "/əˈveɪləbl/", "adj.", "可获得的；有空的", "Tickets are still available online.", "网上仍有票可买。"],
    ["avoid", "/əˈvɔɪd/", "v.", "避免；回避", "Try to avoid making the same mistake.", "尽量避免犯同样的错误。"],
    ["aware", "/əˈweə/", "adj.", "意识到的；知道的", "She was aware of the risk but kept going.", "她意识到风险，但仍继续前进。"],
    ["balance", "/ˈbæləns/", "n./v.", "平衡；余额", "It is important to balance study and rest.", "平衡学习与休息很重要。"],
    ["bargain", "/ˈbɑːɡɪn/", "n./v.", "便宜货；讨价还价", "I got this coat at a bargain price.", "我以很便宜的价格买了这件外套。"],
    ["barrier", "/ˈbæriə/", "n.", "障碍；屏障", "Language is often a barrier for newcomers.", "语言常常是新来者的障碍。"],
    ["basis", "/ˈbeɪsɪs/", "n.", "基础；依据", "Trust is the basis of any friendship.", "信任是任何友谊的基础。"],
    ["behave", "/bɪˈheɪv/", "v.", "举止；表现", "The children behaved well at the party.", "孩子们在聚会上表现得很好。"],
    ["benefit", "/ˈbenɪfɪt/", "n./v.", "益处；受益", "Reading benefits both mind and language.", "阅读对心智和语言都有益。"],
    ["blame", "/bleɪm/", "v./n.", "责备；责任", "Don't blame others for your own mistakes.", "不要为自己的错误责怪别人。"],
    ["boost", "/buːst/", "v./n.", "促进；提升", "The new policy will boost local tourism.", "新政策将促进当地旅游业。"],
    ["border", "/ˈbɔːdə/", "n./v.", "边界；与……接壤", "The village lies on the border of two provinces.", "这个村庄位于两省交界处。"],
    ["brief", "/briːf/", "adj./v.", "简短的；简要介绍", "He gave a brief introduction to the project.", "他简要介绍了这个项目。"],
    ["brilliant", "/ˈbrɪliənt/", "adj.", "杰出的；明亮的", "She came up with a brilliant idea.", "她想出了一个绝妙的主意。"],
    ["budget", "/ˈbʌdʒɪt/", "n./v.", "预算", "We must travel on a tight budget.", "我们必须在紧张的预算下旅行。"],
    ["burden", "/ˈbɜːdn/", "n./v.", "负担；使负担", "Heavy homework is a burden for many students.", "繁重的作业对许多学生来说是负担。"],
    ["calculate", "/ˈkælkjuleɪt/", "v.", "计算；估计", "Please calculate the total cost before we leave.", "出发前请算出总成本。"],
    ["campaign", "/kæmˈpeɪn/", "n.", "运动；活动", "The school launched a reading campaign.", "学校发起了一项阅读活动。"],
    ["campus", "/ˈkæmpəs/", "n.", "校园", "There is a quiet lake on campus.", "校园里有一个安静的湖。"],
    ["capable", "/ˈkeɪpəbl/", "adj.", "有能力的；能干的", "She is capable of handling the project alone.", "她有能力独自处理这个项目。"],
    ["capture", "/ˈkæptʃə/", "v.", "捕获；拍摄；吸引", "The photo captured the beauty of the sunset.", "这张照片捕捉到了日落之美。"],
    ["career", "/kəˈrɪə/", "n.", "职业；生涯", "He began his career as a teacher.", "他以教师身份开始了职业生涯。"],
    ["casual", "/ˈkæʒuəl/", "adj.", "随意的；休闲的", "It's a casual meeting, so jeans are fine.", "这是非正式会面，穿牛仔裤就行。"],
    ["celebrate", "/ˈselɪbreɪt/", "v.", "庆祝；歌颂", "We celebrated her birthday with a cake.", "我们用蛋糕庆祝她的生日。"],
    ["challenge", "/ˈtʃælɪndʒ/", "n./v.", "挑战；质疑", "Learning a language is a lifelong challenge.", "学习一门语言是终身的挑战。"],
    ["character", "/ˈkærəktə/", "n.", "性格；角色；字符", "The novel has many interesting characters.", "这部小说有许多有趣的角色。"],
    ["charge", "/tʃɑːdʒ/", "v./n.", "收费；充电；负责", "The hotel charges fifty dollars a night.", "这家酒店每晚收费五十美元。"],
    ["chemical", "/ˈkemɪkl/", "adj./n.", "化学的；化学品", "The factory must reduce chemical waste.", "工厂必须减少化学废料。"],
    ["circumstance", "/ˈsɜːkəmstəns/", "n.", "情况；环境", "Under no circumstances should you give up.", "无论如何你都不应该放弃。"],
    ["civil", "/ˈsɪvl/", "adj.", "公民的；文明的", "Everyone should know their civil rights.", "每个人都应该了解自己的公民权利。"],
    ["claim", "/kleɪm/", "v./n.", "声称；索赔", "He claims that he saw the accident.", "他声称自己看到了那场事故。"],
    ["classify", "/ˈklæsɪfaɪ/", "v.", "分类；归类", "Books are classified by subject in the library.", "图书馆里的书按学科分类。"],
    ["climate", "/ˈklaɪmət/", "n.", "气候；氛围", "The climate here is mild all year round.", "这里全年气候温和。"],
    ["combine", "/kəmˈbaɪn/", "v.", "结合；联合", "The course combines theory with practice.", "这门课把理论与实践结合起来。"],
    ["comfort", "/ˈkʌmfət/", "n./v.", "舒适；安慰", "Her kind words brought me great comfort.", "她温暖的话语给了我很大安慰。"],
    ["command", "/kəˈmɑːnd/", "n./v.", "命令；掌握", "He has a good command of English.", "他英语掌握得很好。"],
    ["comment", "/ˈkɒment/", "n./v.", "评论；发表意见", "The teacher left a helpful comment on my essay.", "老师在我的文章上留下了有用的评语。"],
    ["commit", "/kəˈmɪt/", "v.", "犯（错）；承诺", "She committed herself to finishing the project.", "她承诺完成这个项目。"],
    ["communicate", "/kəˈmjuːnɪkeɪt/", "v.", "交流；沟通", "We communicate mainly by email.", "我们主要通过电子邮件交流。"],
    ["compare", "/kəmˈpeə/", "v.", "比较；对比", "Compare the two answers and find the difference.", "比较两个答案，找出不同之处。"],
    ["compete", "/kəmˈpiːt/", "v.", "竞争；比赛", "Ten teams will compete for the prize.", "十支队伍将角逐该奖项。"],
    ["complain", "/kəmˈpleɪn/", "v.", "抱怨；投诉", "Customers complained about the poor service.", "顾客抱怨服务太差。"],
    ["complex", "/ˈkɒmpleks/", "adj.", "复杂的；复合的", "The problem is more complex than it seems.", "这个问题比看上去更复杂。"],
    ["concentrate", "/ˈkɒnsntreɪt/", "v.", "集中；专注", "I can't concentrate with so much noise.", "这么吵我无法集中注意力。"],
    ["concept", "/ˈkɒnsept/", "n.", "概念；观念", "The concept of time differs across cultures.", "时间的概念因文化而异。"],
    ["concern", "/kənˈsɜːn/", "n./v.", "关心；担忧", "Air pollution is a growing concern.", "空气污染日益令人担忧。"],
    ["conclude", "/kənˈkluːd/", "v.", "得出结论；结束", "The report concludes that exercise is essential.", "报告得出结论：运动必不可少。"],
    ["conduct", "/kənˈdʌkt/", "v.", "进行；指挥；行为", "The team conducted a survey among students.", "团队在学生中开展了一项调查。"],
    ["confidence", "/ˈkɒnfɪdəns/", "n.", "信心；信任", "Practice gave her confidence in speaking.", "练习让她对开口说话有了信心。"]
  ];

  var RAW6 = [
    ["abolish", "/əˈbɒlɪʃ/", "v.", "废除；取消", "The country abolished the old tax law.", "该国废除了旧的税法。"],
    ["abrupt", "/əˈbrʌpt/", "adj.", "突然的；生硬的", "The meeting came to an abrupt end.", "会议突然结束了。"],
    ["absurd", "/əbˈsɜːd/", "adj.", "荒谬的；可笑的", "It is absurd to blame the weather for your laziness.", "把你的懒惰归咎于天气是荒谬的。"],
    ["accessory", "/əkˈsesəri/", "n.", "配件；饰品", "A scarf is a useful accessory in winter.", "围巾是冬天实用的配饰。"],
    ["acclaim", "/əˈkleɪm/", "v./n.", "称赞；欢呼", "The film won critical acclaim worldwide.", "这部电影在世界范围内赢得评论界赞誉。"],
    ["acknowledge", "/əkˈnɒlɪdʒ/", "v.", "承认；致谢", "He acknowledged the support of his family.", "他感谢家人的支持。"],
    ["acute", "/əˈkjuːt/", "adj.", "敏锐的；严重的；急性的", "There is an acute shortage of nurses.", "护士严重短缺。"],
    ["adhere", "/ədˈhɪə/", "v.", "坚持；遵守；黏附", "We must adhere to the safety rules.", "我们必须遵守安全规定。"],
    ["adjacent", "/əˈdʒeɪsnt/", "adj.", "邻近的；毗连的", "Our office is adjacent to the library.", "我们的办公室紧邻图书馆。"],
    ["administer", "/ədˈmɪnɪstə/", "v.", "管理；实施", "A committee administers the scholarship fund.", "一个委员会管理奖学金基金。"],
    ["adverse", "/ˈædvɜːs/", "adj.", "不利的；有害的", "Adverse weather delayed the flight.", "恶劣天气使航班延误。"],
    ["aesthetic", "/iːsˈθetɪk/", "adj.", "审美的；美学的", "The building is both functional and aesthetic.", "这座建筑既实用又美观。"],
    ["aggravate", "/ˈæɡrəveɪt/", "v.", "使恶化；加重", "Stress can aggravate the illness.", "压力会使病情加重。"],
    ["alienate", "/ˈeɪliəneɪt/", "v.", "疏远；使异化", "His harsh words alienated his colleagues.", "他刻薄的话让同事们疏远了他。"],
    ["allocate", "/ˈæləkeɪt/", "v.", "分配；拨给", "The school allocated more funds to research.", "学校把更多资金分配给科研。"],
    ["ambiguous", "/æmˈbɪɡjuəs/", "adj.", "模棱两可的；含糊的", "His answer was deliberately ambiguous.", "他的回答故意含糊其辞。"],
    ["amend", "/əˈmend/", "v.", "修正；修订", "Parliament voted to amend the law.", "议会投票修改这项法律。"],
    ["ample", "/ˈæmpl/", "adj.", "充足的；宽敞的", "There is ample time to prepare.", "有充足的时间准备。"],
    ["analogy", "/əˈnælədʒi/", "n.", "类比；类推", "The teacher explained the idea by analogy.", "老师用类比解释了这个概念。"],
    ["anonymous", "/əˈnɒnɪməs/", "adj.", "匿名的；无名的", "The donation came from an anonymous reader.", "这笔捐款来自一位匿名读者。"],
    ["anticipate", "/ænˈtɪsɪpeɪt/", "v.", "预期；预料", "We anticipate a rise in demand this winter.", "我们预计今年冬天需求会上升。"],
    ["apparatus", "/ˌæpəˈreɪtəs/", "n.", "仪器；设备；机构", "The lab bought new apparatus for experiments.", "实验室购买了新的实验仪器。"],
    ["appraisal", "/əˈpreɪzl/", "n.", "评估；鉴定", "The annual appraisal helps employees grow.", "年度评估有助于员工成长。"],
    ["arbitrary", "/ˈɑːbɪtrəri/", "adj.", "任意的；专断的", "The decision seemed arbitrary and unfair.", "这个决定似乎武断而不公平。"],
    ["articulate", "/ɑːˈtɪkjuleɪt/", "v./adj.", "清楚表达；口齿伶俐的", "She can articulate complex ideas clearly.", "她能清楚地表达复杂的想法。"],
    ["ascertain", "/ˌæsəˈteɪn/", "v.", "查明；确定", "Police are trying to ascertain the cause.", "警方正努力查明原因。"],
    ["aspire", "/əˈspaɪə/", "v.", "渴望；立志", "Many young people aspire to work abroad.", "许多年轻人渴望到国外工作。"],
    ["assert", "/əˈsɜːt/", "v.", "断言；维护", "She asserted her right to remain silent.", "她主张保持沉默的权利。"],
    ["attain", "/əˈteɪn/", "v.", "达到；获得", "He attained his goal after years of effort.", "经过多年努力，他实现了目标。"],
    ["attribute", "/əˈtrɪbjuːt/", "v./n.", "归因于；属性", "She attributes her success to hard work.", "她把成功归因于努力。"],
    ["authentic", "/ɔːˈθentɪk/", "adj.", "真正的；可信的", "The museum displays authentic ancient coins.", "博物馆展出真正的古钱币。"],
    ["autonomy", "/ɔːˈtɒnəmi/", "n.", "自治；自主权", "Universities enjoy a high degree of autonomy.", "大学享有高度自治。"],
    ["avert", "/əˈvɜːt/", "v.", "避免；转移", "Quick action averted a serious accident.", "迅速行动避免了一场严重事故。"],
    ["benevolent", "/bəˈnevələnt/", "adj.", "仁慈的；慈善的", "A benevolent stranger paid for her ticket.", "一位仁慈的陌生人替她付了车票钱。"],
    ["bewilder", "/bɪˈwɪldə/", "v.", "使困惑；使迷惑", "The complicated form bewildered many applicants.", "复杂的表格让许多申请者困惑。"],
    ["bias", "/ˈbaɪəs/", "n./v.", "偏见；使有偏见", "The report was criticized for its bias.", "这份报告因偏见而受到批评。"],
    ["breach", "/briːtʃ/", "n./v.", "违反；缺口", "The company was fined for a data breach.", "该公司因数据泄露被罚款。"],
    ["brisk", "/brɪsk/", "adj.", "轻快的；活跃的", "We had a brisk walk in the morning air.", "我们在清晨的空气中快步走。"],
    ["bulk", "/bʌlk/", "n.", "大部分；大批", "The bulk of the work has been done.", "大部分工作已经完成。"],
    ["candid", "/ˈkændɪd/", "adj.", "坦率的；直言的", "Thank you for your candid advice.", "谢谢你坦率的建议。"],
    ["capacity", "/kəˈpæsəti/", "n.", "容量；能力", "The stadium has a capacity of 60,000.", "这座体育场可容纳六万人。"],
    ["cater", "/ˈkeɪtə/", "v.", "迎合；提供饮食", "The course caters to beginners.", "这门课程面向初学者。"],
    ["censor", "/ˈsensə/", "v./n.", "审查；审查员", "The film was censored before release.", "这部电影在上映前被审查。"],
    ["chronic", "/ˈkrɒnɪk/", "adj.", "慢性的；长期的", "He suffers from chronic back pain.", "他长期受背痛困扰。"],
    ["circulate", "/ˈsɜːkjuleɪt/", "v.", "循环；传播", "Rumors circulated quickly on social media.", "谣言在社交媒体上迅速传播。"],
    ["cite", "/saɪt/", "v.", "引用；引证", "The paper cites several recent studies.", "这篇论文引用了几项近期研究。"],
    ["coherent", "/kəʊˈhɪərənt/", "adj.", "连贯的；一致的", "Her essay is clear and coherent.", "她的文章清晰连贯。"],
    ["coincide", "/ˌkəʊɪnˈsaɪd/", "v.", "同时发生；一致", "My holiday coincided with the festival.", "我的假期恰逢那个节日。"],
    ["collaborate", "/kəˈlæbəreɪt/", "v.", "合作；协作", "Two universities collaborated on the research.", "两所大学合作开展了这项研究。"],
    ["commence", "/kəˈmens/", "v.", "开始；着手", "The ceremony will commence at nine.", "典礼将在九点开始。"],
    ["compensate", "/ˈkɒmpenseɪt/", "v.", "补偿；弥补", "The airline compensated passengers for the delay.", "航空公司因延误赔偿了乘客。"],
    ["competent", "/ˈkɒmpɪtənt/", "adj.", "有能力的；称职的", "She is a competent and reliable manager.", "她是一位称职可靠的经理。"],
    ["compile", "/kəmˈpaɪl/", "v.", "汇编；编制", "They compiled a list of useful websites.", "他们汇编了一份实用网站清单。"],
    ["comply", "/kəmˈplaɪ/", "v.", "遵守；遵从", "All members must comply with the rules.", "所有成员都必须遵守规定。"],
    ["comprise", "/kəmˈpraɪz/", "v.", "由……组成；包含", "The course comprises twelve lessons.", "这门课程由十二节课组成。"],
    ["compromise", "/ˈkɒmprəmaɪz/", "n./v.", "妥协；折中", "Both sides reached a compromise at last.", "双方最终达成了妥协。"],
    ["conceal", "/kənˈsiːl/", "v.", "隐藏；隐瞒", "He could not conceal his disappointment.", "他无法掩饰自己的失望。"],
    ["conceive", "/kənˈsiːv/", "v.", "构想；想象", "It's hard to conceive of life without the internet.", "很难想象没有互联网的生活。"],
    ["concise", "/kənˈsaɪs/", "adj.", "简洁的；简明的", "Please keep your summary concise.", "请保持摘要简洁。"],
    ["condemn", "/kənˈdem/", "v.", "谴责；判刑", "World leaders condemned the attack.", "世界各国领导人谴责这次袭击。"],
    ["confer", "/kənˈfɜː/", "v.", "授予；商议", "The university conferred an honorary degree on him.", "大学授予他荣誉学位。"],
    ["confine", "/kənˈfaɪn/", "v.", "限制；禁闭", "Please confine your comments to the topic.", "请把你的评论限定在话题内。"],
    ["conform", "/kənˈfɔːm/", "v.", "遵守；符合", "Products must conform to safety standards.", "产品必须符合安全标准。"],
    ["confront", "/kənˈfrʌnt/", "v.", "面对；对抗", "We must confront the problem directly.", "我们必须直接面对这个问题。"],
    ["conserve", "/kənˈsɜːv/", "v.", "保护；节约", "Turning off lights helps conserve energy.", "关灯有助于节约能源。"],
    ["conspicuous", "/kənˈspɪkjuəs/", "adj.", "显眼的；明显的", "The bright sign is conspicuous from afar.", "那块明亮的招牌从远处就很显眼。"],
    ["constitute", "/ˈkɒnstɪtjuːt/", "v.", "构成；组成", "Women constitute over half of the workforce.", "女性占劳动力的半数以上。"],
    ["constrain", "/kənˈstreɪn/", "v.", "限制；约束", "A small budget constrains our choices.", "有限的预算限制了我们的选择。"],
    ["contaminate", "/kənˈtæmɪneɪt/", "v.", "污染；弄脏", "The river was contaminated by chemicals.", "这条河被化学品污染了。"],
    ["contemplate", "/ˈkɒntəmpleɪt/", "v.", "考虑；沉思", "She contemplated studying abroad for a year.", "她考虑出国学习一年。"],
    ["contemporary", "/kənˈtemprəri/", "adj.", "当代的；同时代的", "The gallery focuses on contemporary art.", "这家画廊专注于当代艺术。"],
    ["contempt", "/kənˈtempt/", "n.", "蔑视；轻视", "He showed contempt for the rules.", "他对规则表现出蔑视。"],
    ["contend", "/kənˈtend/", "v.", "主张；竞争", "Some researchers contend that screens harm sleep.", "一些研究者认为屏幕会损害睡眠。"],
    ["contradict", "/ˌkɒntrəˈdɪkt/", "v.", "反驳；与……矛盾", "The results contradict the earlier report.", "结果与早先的报告相矛盾。"],
    ["controversial", "/ˌkɒntrəˈvɜːʃl/", "adj.", "有争议的", "It remains a controversial issue in education.", "这在教育界仍是一个有争议的问题。"],
    ["convene", "/kənˈviːn/", "v.", "召集；开会", "The chairman convened an emergency meeting.", "主席召集了一次紧急会议。"],
    ["converge", "/kənˈvɜːdʒ/", "v.", "汇聚；趋同", "The two roads converge near the river.", "两条路在河边汇合。"],
    ["conviction", "/kənˈvɪkʃn/", "n.", "信念；定罪", "She spoke with deep conviction.", "她满怀信念地讲话。"],
    ["correlate", "/ˈkɒrəleɪt/", "v.", "相关；使相互关联", "Exercise correlates with better mental health.", "运动与更好的心理健康相关。"],
    ["corrupt", "/kəˈrʌpt/", "adj./v.", "腐败的；使腐化", "The official was removed for corrupt behavior.", "这名官员因腐败行为被免职。"],
    ["crucial", "/ˈkruːʃl/", "adj.", "关键的；至关重要的", "Timing is crucial in this experiment.", "在这个实验中，时机至关重要。"],
    ["cultivate", "/ˈkʌltɪveɪt/", "v.", "培养；耕作", "Schools should cultivate students' curiosity.", "学校应培养学生的好奇心。"],
    ["curb", "/kɜːb/", "v./n.", "抑制；路缘", "The city tries to curb traffic pollution.", "该市努力抑制交通污染。"],
    ["cynical", "/ˈsɪnɪkl/", "adj.", "愤世嫉俗的；怀疑的", "He became cynical after repeated failures.", "经历多次失败后他变得愤世嫉俗。"],
    ["deduce", "/dɪˈdjuːs/", "v.", "推断；演绎", "We can deduce the answer from the data.", "我们可以从数据推断出答案。"],
    ["deficit", "/ˈdefɪsɪt/", "n.", "赤字；不足", "The company reported a large deficit.", "公司报告了巨额亏损。"],
    ["deliberate", "/dɪˈlɪbərət/", "adj.", "故意的；深思熟虑的", "It was a deliberate attempt to mislead.", "那是蓄意误导。"],
    ["denote", "/dɪˈnəʊt/", "v.", "表示；指示", "In this chart, blue denotes cold areas.", "在这张图表中，蓝色表示寒冷地区。"],
    ["depict", "/dɪˈpɪkt/", "v.", "描绘；描述", "The painting depicts a busy market.", "这幅画描绘了一个热闹的市场。"],
    ["deprive", "/dɪˈpraɪv/", "v.", "剥夺；使丧失", "Noise deprived me of sleep last night.", "昨晚的噪音让我无法入睡。"],
    ["derive", "/dɪˈraɪv/", "v.", "源自；获得", "The word derives from an ancient language.", "这个词源自一种古老语言。"],
    ["descend", "/dɪˈsend/", "v.", "下降；下来", "The plane began to descend toward the airport.", "飞机开始向机场下降。"],
    ["designate", "/ˈdezɪɡneɪt/", "v.", "指定；命名", "The area was designated as a nature reserve.", "该地区被指定为自然保护区。"],
    ["deteriorate", "/dɪˈtɪəriəreɪt/", "v.", "恶化；变坏", "His health deteriorated during the winter.", "冬天他的健康状况恶化了。"],
    ["deviate", "/ˈdiːvieɪt/", "v.", "偏离；背离", "The plane deviated from its usual route.", "飞机偏离了通常的航线。"],
    ["devise", "/dɪˈvaɪz/", "v.", "设计；想出", "They devised a clever way to save water.", "他们想出了一个节约用水的巧妙方法。"],
    ["diminish", "/dɪˈmɪnɪʃ/", "v.", "减少；削弱", "The pain diminished gradually.", "疼痛逐渐减轻。"],
    ["discern", "/dɪˈsɜːn/", "v.", "辨别；察觉", "It is hard to discern the difference.", "很难辨别其中的差别。"],
    ["disclose", "/dɪsˈkləʊz/", "v.", "透露；揭露", "The company refused to disclose the details.", "公司拒绝透露细节。"],
    ["discreet", "/dɪˈskriːt/", "adj.", "谨慎的；小心的", "Please be discreet about this information.", "请对这些信息保密。"],
    ["dispatch", "/dɪˈspætʃ/", "v./n.", "派遣；发送", "Rescue teams were dispatched to the area.", "救援队被派往该地区。"],
    ["disperse", "/dɪˈspɜːs/", "v.", "驱散；分散", "The crowd dispersed after the speech.", "演讲结束后人群散去了。"],
    ["dispose", "/dɪˈspəʊz/", "v.", "处理；处置", "Please dispose of waste properly.", "请妥善处理垃圾。"],
    ["disrupt", "/dɪsˈrʌpt/", "v.", "扰乱；中断", "The heavy snow disrupted train services.", "大雪扰乱了火车服务。"],
    ["dissolve", "/dɪˈzɒlv/", "v.", "溶解；解散", "Sugar dissolves quickly in hot water.", "糖在热水中溶解得很快。"]
  ];

  var EXTRA4 = CET.extra4 || [];
  var EXTRA6 = CET.extra6 || [];

  // 不同批次词表可能重复，按单词去重，保证词库统计与每日计划不重复
  function dedupe(list) {
    var seen = {};
    return list.filter(function (row) {
      var key = String(row[0] || "").toLowerCase();
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  var ALL4 = dedupe(RAW4.concat(EXTRA4));
  var ALL6 = dedupe(RAW6.concat(EXTRA6));

  // 跨级别去重：同一单词只保留首次出现（四级优先），保证词库统计不含重复词条
  var seenAll = {};
  function dedupeAll(list) {
    return list.filter(function (row) {
      var key = String(row[0] || "").toLowerCase();
      if (!key || seenAll[key]) return false;
      seenAll[key] = true;
      return true;
    });
  }
  ALL4 = dedupeAll(ALL4);
  ALL6 = dedupeAll(ALL6);

  function toWords(list, level) {
    return list.map(function (row, i) {
      return {
        id: level.toLowerCase() + "-" + (i + 1),
        level: level,
        chapter: Math.floor(i / 20) + 1,
        word: row[0],
        phonetic: row[1],
        pos: row[2],
        cn: row[3],
        example: row[4],
        exampleCn: row[5]
      };
    });
  }

  CET.data.words = toWords(ALL4, "CET4").concat(toWords(ALL6, "CET6"));
  CET.data.chapterSize = 20;
  CET.data.chapters = Math.ceil(Math.max(ALL4.length, ALL6.length) / 20);
  CET.data.count4 = ALL4.length;
  CET.data.count6 = ALL6.length;
})();
