/* =========================================================
   口语话题卡数据
   每个话题包含：题目、关键词提示、示范答案、追问、自评清单
   ========================================================= */
window.CET = window.CET || {};
CET.data = CET.data || {};

(function () {
  CET.data.speaking = [
    {
      id: "S1",
      level: "CET4",
      title: "自我介绍",
      subtitle: "Self-introduction · 校园 / 面试通用",
      prompt: "请用 1 分钟介绍自己：姓名、专业、兴趣，以及你为什么在准备四六级。",
      keywords: [
        { en: "major in", cn: "主修" },
        { en: "be keen on", cn: "热衷于" },
        { en: "in my spare time", cn: "在业余时间" },
        { en: "prepare for CET-4", cn: "备考四级" },
        { en: "improve my English", cn: "提升英语" }
      ],
      sample: "Good morning. My name is Li Ming, and I major in computer science. In my spare time I am keen on reading and playing basketball. I am preparing for CET-4 because a good English score will help me read technical papers and communicate with others more confidently. I hope to improve my listening and speaking this term.",
      sampleCn: "早上好。我叫李明，主修计算机科学。业余时间我喜欢阅读和打篮球。我正在准备四级，因为好的英语成绩能帮助我阅读技术论文，也更自信地与人交流。我希望这学期提升听力和口语。",
      followups: ["What do you usually do on weekends?", "Why did you choose your major?", "How do you balance study and hobbies?"],
      rubric: ["发音清晰，音量适中", "内容完整（姓名/专业/兴趣/目标）", "使用至少 3 个话题关键词", "语速自然，停顿得当", "无明显长时间卡顿"],
      tip: "先说结构：who → what → why。每部分 1-2 句，避免背长难句。"
    },
    {
      id: "S2",
      level: "CET4",
      title: "大学生该不该做兼职",
      subtitle: "Opinion · 观点表达",
      prompt: "Some students take part-time jobs while studying. Do you think it is a good idea? Give your reasons.",
      keywords: [
        { en: "part-time job", cn: "兼职" },
        { en: "gain working experience", cn: "获得工作经验" },
        { en: "manage time properly", cn: "合理安排时间" },
        { en: "affect academic performance", cn: "影响学业" },
        { en: "on the other hand", cn: "另一方面" }
      ],
      sample: "In my opinion, part-time jobs can be helpful if students manage their time properly. First, they gain working experience and learn how to communicate with different people. Second, earning money makes them more independent. On the other hand, a job may affect academic performance if it takes too much time. Therefore, I think students should choose flexible jobs and put study first.",
      sampleCn: "在我看来，如果学生能合理安排时间，兼职是有益的。首先，他们能获得工作经验，学会与不同的人沟通。其次，挣钱让他们更独立。另一方面，如果占用太多时间，工作可能影响学业。因此，我认为学生应选择时间灵活的工作，并把学习放在首位。",
      followups: ["What kind of part-time job is suitable for students?", "Should parents allow teenagers to work?", "Have you ever had a part-time job?"],
      rubric: ["明确表明立场", "给出至少 2 个理由", "使用连接词（first / second / therefore）", "有让步或反方观点", "结尾有总结句"],
      tip: "观点题用“立场 + 2 个理由 + 让步 + 结论”的四段式，逻辑最稳。"
    },
    {
      id: "S3",
      level: "CET4",
      title: "一次难忘的旅行",
      subtitle: "Narration · 叙事描述",
      prompt: "Describe a trip you will never forget. Where did you go, what happened, and why is it memorable?",
      keywords: [
        { en: "memorable", cn: "难忘的" },
        { en: "set off", cn: "出发" },
        { en: "out of the blue", cn: "出乎意料地" },
        { en: "make a difference", cn: "带来改变" },
        { en: "look back on", cn: "回顾" }
      ],
      sample: "Last summer I went to a small village in Yunnan with two friends. We set off early, but our bus broke down out of the blue. A local farmer invited us to his home and cooked us dinner. We talked for hours and learned a lot about village life. Looking back on that trip, I realize that unexpected moments often make the best memories.",
      sampleCn: "去年夏天，我和两个朋友去了云南的一个小村庄。我们出发很早，但大巴突然抛锚了。一位当地农民邀请我们去他家，还为我们做了晚饭。我们聊了几个小时，了解了很多乡村生活。回想那次旅行，我意识到意外的瞬间往往造就最美好的回忆。",
      followups: ["Would you like to travel alone?", "What is the best way to plan a trip?", "How has tourism changed small villages?"],
      rubric: ["交代时间地点人物", "有情节起伏（问题 + 转折）", "使用 2 个以上关键词", "时态以过去时为主", "结尾点明意义"],
      tip: "叙事题准备一个“万能故事骨架”：出发 → 意外 → 解决 → 感悟，可套用多个题目。"
    },
    {
      id: "S4",
      level: "CET6",
      title: "手机使用与睡眠",
      subtitle: "Issue discussion · 现象讨论",
      prompt: "Many young people use their phones late at night. What problems does this cause, and what advice would you give?",
      keywords: [
        { en: "screen time", cn: "屏幕使用时间" },
        { en: "sleep quality", cn: "睡眠质量" },
        { en: "be addicted to", cn: "沉迷于" },
        { en: "set a limit", cn: "设定限制" },
        { en: "lead to", cn: "导致" }
      ],
      sample: "Using phones late at night has become common among young people. It can reduce sleep quality and lead to poor concentration the next day. Some students even become addicted to short videos. In my view, we should set a limit on screen time and put our phones away an hour before bed. Universities can also organize more evening activities to help students relax without screens.",
      sampleCn: "深夜使用手机在年轻人中很普遍。它可能降低睡眠质量，导致第二天注意力不集中。一些学生甚至沉迷于短视频。我认为我们应该限制屏幕使用时间，并在睡前一小时把手机放远。大学也可以组织更多晚间活动，帮助学生在不使用屏幕的情况下放松。",
      followups: ["Should schools ban phones in class?", "How can parents help children use phones wisely?", "Is technology making us less patient?"],
      rubric: ["描述现象", "分析 2 个影响", "给出 2 条建议", "使用话题关键词", "结尾有呼吁或总结"],
      tip: "问题-影响-建议结构，适合所有“现象类”六级口语题。"
    },
    {
      id: "S5",
      level: "CET6",
      title: "如何提升英语口语",
      subtitle: "Advice · 经验分享",
      prompt: "What are the biggest problems for Chinese students in speaking English, and how can they improve?",
      keywords: [
        { en: "lack confidence", cn: "缺乏自信" },
        { en: "think in Chinese", cn: "用中文思考" },
        { en: "shadow the audio", cn: "跟读音频" },
        { en: "build a habit", cn: "养成习惯" },
        { en: "step out of the comfort zone", cn: "走出舒适区" }
      ],
      sample: "Many students lack confidence and think in Chinese before they speak, so they sound slow and unnatural. To improve, I suggest three steps. First, shadow a short audio clip for ten minutes every day. Second, record yourself and compare your pronunciation with the original. Third, find a partner and speak for five minutes without worrying about mistakes. Above all, build a daily habit and step out of your comfort zone.",
      sampleCn: "许多学生缺乏自信，开口前先用中文思考，因此表达缓慢且不自然。要提升，我建议三个步骤。第一，每天跟读一段短音频十分钟。第二，录下自己并与原音比较。第三，找搭档说五分钟，不要担心犯错。最重要的是养成每日习惯并走出舒适区。",
      followups: ["Is grammar more important than pronunciation?", "Can AI tools replace language teachers?", "How long does it take to speak fluently?"],
      rubric: ["先指出问题", "给出 3 条可执行建议", "使用序数词组织", "有具体做法而非空话", "结尾强调坚持"],
      tip: "建议类题目尽量给“可执行动作”，如 shadow / record / partner，比泛泛而谈更加分。"
    },
    {
      id: "S6",
      level: "CET6",
      title: "失败与成长",
      subtitle: "Abstract topic · 价值观",
      prompt: "Do you agree that failure is a better teacher than success? Explain with an example.",
      keywords: [
        { en: "learn from mistakes", cn: "从错误中学习" },
        { en: "get back on one's feet", cn: "重新振作" },
        { en: "self-reflection", cn: "自我反思" },
        { en: "a turning point", cn: "转折点" },
        { en: "grow stronger", cn: "变得更强" }
      ],
      sample: "I partly agree. Success gives us confidence, but failure forces us to reflect. Last year I failed an important English exam. At first I was upset, but I analyzed my mistakes and changed my study plan. That failure became a turning point, and I got back on my feet. In short, failure teaches us more about ourselves, as long as we are willing to learn from it.",
      sampleCn: "我部分同意。成功给我们自信，但失败迫使我们反思。去年我一次重要的英语考试失利。起初我很沮丧，但我分析错误并调整学习计划。那次失败成为转折点，我重新振作。总之，失败让我们更了解自己，只要我们愿意从中学习。",
      followups: ["Can failure ever be harmful?", "How should teachers treat students who fail?", "Is it possible to succeed without failing?"],
      rubric: ["立场明确（同意/部分同意）", "给出个人或他人例子", "有反思与变化过程", "使用 2 个以上关键词", "结论回扣观点"],
      tip: "价值观题必须落到具体例子，抽象论述很难得高分。"
    }
  ];

  CET.data.speakingLevels = {
    CET4: "四级",
    CET6: "六级"
  };
})();
