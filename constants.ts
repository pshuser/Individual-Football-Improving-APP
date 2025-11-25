import { Drill, UserStats, Language } from './types';

export const INITIAL_STATS: UserStats = {
  technical: 65,
  physical: 70,
  tactical: 50,
  mental: 60,
  trainingHours: 12.5,
  drillsCompleted: 24,
};

export const SAMPLE_DRILLS: Record<Language, Drill[]> = {
  en: [
    {
      id: '1',
      title: 'Cone Weave & Shoot',
      category: 'Technical',
      difficulty: 'Beginner',
      duration: '15 mins',
      description: 'Set up 5 cones in a line 1m apart. Dribble through using inside/outside of foot, then shoot at goal.',
      equipment: ['5 Cones', '1 Ball', 'Goal']
    },
    {
      id: '2',
      title: 'Box-to-Box Stamina',
      category: 'Physical',
      difficulty: 'Intermediate',
      duration: '20 mins',
      description: 'Sprint from one 18-yard box line to the other. Jog back. Repeat 10 times. Rest 2 mins. Do 2 sets.',
      equipment: ['Field']
    },
    {
      id: '3',
      title: 'Wall Pass Mastery',
      category: 'Technical',
      difficulty: 'Intermediate',
      duration: '10 mins',
      description: 'Pass against a wall using one touch. Alternate feet. Focus on locking the ankle.',
      equipment: ['1 Ball', 'Wall']
    }
  ],
  zh: [
    {
      id: '1',
      title: '绕桩射门',
      category: 'Technical',
      difficulty: 'Beginner',
      duration: '15 分钟',
      description: '将5个标志桶排成一列，间距1米。使用脚内侧/外侧绕桩盘带，然后射门。',
      equipment: ['5个标志桶', '1个足球', '球门']
    },
    {
      id: '2',
      title: '禁区往返跑',
      category: 'Physical',
      difficulty: 'Intermediate',
      duration: '20 分钟',
      description: '从一个18码线冲刺到另一个。慢跑返回。重复10次。休息2分钟。做2组。',
      equipment: ['足球场']
    },
    {
      id: '3',
      title: '墙球练习',
      category: 'Technical',
      difficulty: 'Intermediate',
      duration: '10 分钟',
      description: '对着墙壁进行一脚传球。左右脚交替。专注于锁紧脚踝。',
      equipment: ['1个足球', '墙壁']
    }
  ]
};

export const TRANSLATIONS = {
  en: {
    nav: {
      stats: "Stats",
      train: "Train",
      analyst: "Analyst",
      tactics: "Tactics",
      coach: "Coach"
    },
    dashboard: {
      trainingHours: "Training Hours",
      drillsDone: "Drills Done",
      playerAttributes: "Player Attributes",
      weeklyFocus: "Weekly Focus",
      noPlan: "No active plan. Generate one in Drills!",
      following: "Following"
    },
    drills: {
      header: "Training",
      btnPlan: "Plan",
      btnNew: "New",
      library: "Library",
      myPlan: "My Plan",
      generateTitle: "Generate Single Drill",
      promptPlaceholder: "Focus area (e.g. Speed)",
      cancel: "Cancel",
      generate: "Generate",
      planTitle: "Create Weekly Plan",
      level: "Level",
      goal: "Primary Goal",
      availability: "Availability",
      createPlan: "Create Plan",
      day: "Day"
    },
    analyst: {
      header: "Video Analyst",
      uploadTitle: "Upload a clip of your technique",
      uploadSubtitle: "(Dribbling, Shooting, etc)",
      dragDrop: "or Drag & Drop Video",
      selectBtn: "Select Video",
      clear: "Clear",
      analyze: "Analyze Technique",
      reportTitle: "Technique Report",
      score: "Score",
      mechanics: "Mechanics",
      corrections: "Corrections",
      recommendation: "Recommended Drill"
    },
    tactics: {
      header: "Tactical IQ",
      newScenario: "New Scenario",
      emptyState: "Start a simulation to test your tactical decision making.",
      startSim: "Start Simulation",
      analysis: "Coach Analysis",
      next: "Next Scenario"
    },
    coach: {
      welcome: "Welcome to PitchIQ. I'm your tactical analyst. Ask me about playing positions, tactical concepts, or mental preparation.",
      placeholder: "Ask about tactics, rules, or analysis...",
      isTyping: "Coach is typing..."
    },
    common: {
      loading: "Loading...",
      hrs: "hrs"
    },
    categories: {
      Technical: "Technical",
      Physical: "Physical",
      Tactical: "Tactical",
      Mental: "Mental"
    },
    difficulties: {
      Beginner: "Beginner",
      Intermediate: "Intermediate",
      Advanced: "Advanced",
      Pro: "Pro"
    }
  },
  zh: {
    nav: {
      stats: "数据",
      train: "训练",
      analyst: "分析",
      tactics: "战术",
      coach: "教练"
    },
    dashboard: {
      trainingHours: "训练时长",
      drillsDone: "完成训练",
      playerAttributes: "球员属性",
      weeklyFocus: "本周重点",
      noPlan: "暂无计划。请在训练页面生成！",
      following: "正在执行"
    },
    drills: {
      header: "训练中心",
      btnPlan: "计划",
      btnNew: "新建",
      library: "训练库",
      myPlan: "我的计划",
      generateTitle: "生成专项训练",
      promptPlaceholder: "训练重点 (例如：速度)",
      cancel: "取消",
      generate: "生成",
      planTitle: "制定周计划",
      level: "水平",
      goal: "主要目标",
      availability: "训练频率",
      createPlan: "生成计划",
      day: "天/周"
    },
    analyst: {
      header: "视频分析师",
      uploadTitle: "上传你的技术动作视频",
      uploadSubtitle: "(盘带, 射门, 等)",
      dragDrop: "或拖拽视频上传",
      selectBtn: "选择视频",
      clear: "清除",
      analyze: "分析技术",
      reportTitle: "技术分析报告",
      score: "评分",
      mechanics: "动作机制",
      corrections: "纠正建议",
      recommendation: "推荐训练"
    },
    tactics: {
      header: "战术智商",
      newScenario: "新场景",
      emptyState: "开始模拟以测试你的战术决策能力。",
      startSim: "开始模拟",
      analysis: "教练分析",
      next: "下一场景"
    },
    coach: {
      welcome: "欢迎来到PitchIQ。我是你的战术分析师。你可以问我关于位置、战术概念或心理准备的问题。",
      placeholder: "询问战术、规则或分析...",
      isTyping: "教练正在输入..."
    },
    common: {
      loading: "加载中...",
      hrs: "小时"
    },
    categories: {
      Technical: "技术",
      Physical: "体能",
      Tactical: "战术",
      Mental: "心理"
    },
    difficulties: {
      Beginner: "初学者",
      Intermediate: "中级",
      Advanced: "高级",
      Pro: "职业"
    }
  }
};