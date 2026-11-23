/* 在线真题原音索引 + 本地镜像路径
   音频来源：Couldyyy9/cet-website 的 GitHub Pages 真题库；本仓库已按年份镜像到
   assets/audio/<年份>/，播放时优先使用本地文件（见 views/listening.js）。
   MIT 许可只覆盖该仓库源代码；真题与音频版权归各自权利人，仅供个人学习。 */
window.CET = window.CET || {};
CET.data = CET.data || {};

(function () {
  var BASE = "https://couldyyy9.github.io/cet-website/library/";
  var LOCAL = "assets/audio/";
  function item(level, exam) {
    var p = exam.split("_");
    return {
      level: level,
      exam: exam,
      year: parseInt(p[0], 10),
      month: parseInt(p[1], 10),
      set: parseInt(p[2], 10),
      url: BASE + (level === "CET4" ? "cet4" : "cet6") + "/" + exam + "/listening.mp3",
      // 本地镜像：assets/audio/<年份>/<cet4|cet6>-<yyyy>-<mm>-set<n>.mp3
      local: LOCAL + p[0] + "/" + (level === "CET4" ? "cet4" : "cet6") + "-" + p[0] + "-" + p[1] + "-set" + p[2] + ".mp3"
    };
  }

  var matched = {
    L2: item("CET4", "2020_09_1"),
    L3: item("CET4", "2021_06_1"),
    L4: item("CET4", "2022_06_1"),
    L5: item("CET4", "2023_06_1"),
    L7: item("CET6", "2020_09_1"),
    L8: item("CET6", "2021_06_1"),
    L9: item("CET6", "2022_06_1"),
    L10: item("CET6", "2023_06_1"),
    L11: item("CET6", "2024_06_1"),
    L12: item("CET6", "2025_06_1")
  };

  var unmatched = [
    item("CET4", "2020_07_1"), item("CET4", "2020_12_1"), item("CET4", "2020_12_2"),
    item("CET4", "2021_06_2"), item("CET4", "2021_12_1"), item("CET4", "2021_12_2"),
    item("CET4", "2022_09_1"), item("CET4", "2022_12_1"), item("CET4", "2022_12_2"),
    item("CET4", "2023_03_1"), item("CET4", "2023_06_2"), item("CET4", "2023_12_1"),
    item("CET4", "2023_12_2"), item("CET4", "2024_06_1"), item("CET4", "2024_06_2"),
    item("CET4", "2024_12_1"), item("CET4", "2024_12_2"), item("CET4", "2025_06_1"),
    item("CET4", "2025_06_2"), item("CET4", "2025_12_1"), item("CET4", "2025_12_2"),
    item("CET6", "2020_07_1"), item("CET6", "2020_12_1"), item("CET6", "2020_12_2"),
    item("CET6", "2021_06_2"), item("CET6", "2021_12_1"), item("CET6", "2021_12_2"),
    item("CET6", "2022_09_1"), item("CET6", "2022_12_1"), item("CET6", "2022_12_2"),
    item("CET6", "2023_03_1"), item("CET6", "2023_06_2"), item("CET6", "2023_12_1"),
    item("CET6", "2023_12_2"), item("CET6", "2024_06_2"), item("CET6", "2024_12_1"),
    item("CET6", "2024_12_2"), item("CET6", "2025_06_2"), item("CET6", "2025_12_1"),
    item("CET6", "2025_12_2")
  ];

  CET.data.listeningAudioOnline = {
    total: 50,
    verifiedAt: "2026-11-05",
    source: {
      name: "Couldyyy9/cet-website 真题库",
      repo: "https://github.com/Couldyyy9/cet-website",
      site: "https://couldyyy9.github.io/cet-website/",
      license: "MIT（仅覆盖源代码）",
      note: "音频版权归各自权利人，仅供个人学习，请勿商用或大规模传播；在线播放需要联网。"
    },
    matched: matched,
    unmatched: unmatched
  };
})();
