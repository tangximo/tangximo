/* =========================================================
   听力数据入口
   ---------------------------------------------------------
   题库分为两个文件：
   - listening-cet4.js（L1-L5，四级）
   - listening-cet6.js（L6-L12，六级）
   合计 12 套，覆盖短对话 / 长对话 / 短文 / 讲座 / 新闻。

   数据字段：
     id, level, type, source（年份与套次）, year, session, title, intro,
     audio（默认 null）, lines[{sp,en,cn}], questions[{q,options,answer,explain}],
     cloze[{text,answers,hint}]

   音频说明：
   - 文本按历年四六级真题的场景与题型整理编写，用于练习，不是官方逐字稿；
   - 官方音频未内置。当前用浏览器 SpeechSynthesis 逐句朗读；
   - 想换成真实音频：把 mp3 放到 assets/audio/，在对应套题里写
     audio: "assets/audio/xxx.mp3"，播放器会自动显示原生音频控件。
   ========================================================= */
window.CET = window.CET || {};
CET.data = CET.data || {};
CET.data.listening = [];
