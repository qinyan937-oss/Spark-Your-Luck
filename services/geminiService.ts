
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { UserProfile, FortuneResult, CelebrityMatch } from "../types";

// Helper to get API key safely
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    console.warn("API Key not found in environment variables. Using Local Lucky Engine.");
    return "";
  }
  return key;
};

// --- LOCAL CALCULATION HELPERS (FALLBACK ENGINE) ---

const getZodiacData = (month: number, day: number) => {
  const zodiacs = [
    { sign: "摩羯座", start: [1, 1], end: [1, 19], trait: "坚韧稳重", compliment: "你拥有最让人安心的可靠力量。" },
    { sign: "水瓶座", start: [1, 20], end: [2, 18], trait: "独一无二", compliment: "你的灵魂里住着璀璨的星河。" },
    { sign: "双鱼座", start: [2, 19], end: [3, 20], trait: "温柔浪漫", compliment: "世界因为你的温柔而变得柔软。" },
    { sign: "白羊座", start: [3, 21], end: [4, 19], trait: "赤诚热烈", compliment: "你永远拥有少年的勇气和热情。" },
    { sign: "金牛座", start: [4, 20], end: [5, 20], trait: "温润如玉", compliment: "你懂得发现生活最本质的美好。" },
    { sign: "双子座", start: [5, 21], end: [6, 21], trait: "灵动有趣", compliment: "你是有趣灵魂的最佳代言人。" },
    { sign: "巨蟹座", start: [6, 22], end: [7, 22], trait: "细腻体贴", compliment: "你的爱像月光一样温柔地治愈他人。" },
    { sign: "狮子座", start: [7, 23], end: [8, 22], trait: "光芒万丈", compliment: "你天生就是舞台中央的主角。" },
    { sign: "处女座", start: [8, 23], end: [9, 22], trait: "精致完美", compliment: "你把生活过成了一首精致的诗。" },
    { sign: "天秤座", start: [9, 23], end: [10, 23], trait: "优雅迷人", compliment: "你的存在本身就是一种和谐的美。" },
    { sign: "天蝎座", start: [10, 24], end: [11, 22], trait: "深邃迷人", compliment: "你的神秘感是让人无法抗拒的引力。" },
    { sign: "射手座", start: [11, 23], end: [12, 21], trait: "自由洒脱", compliment: "你是自由的风，永远追逐着光。" },
    { sign: "摩羯座", start: [12, 22], end: [12, 31], trait: "坚韧稳重", compliment: "你拥有最让人安心的可靠力量。" },
  ];

  for (const z of zodiacs) {
    if (
      (month === z.start[0] && day >= z.start[1]) ||
      (month === z.end[0] && day <= z.end[1])
    ) {
      return z;
    }
  }
  return zodiacs[0]; // Fallback
};

const getChineseZodiacData = (year: number) => {
  const animals = ["猴", "鸡", "狗", "猪", "鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊"];
  const traits = [
    "机智灵动", "勤奋自信", "忠诚正直", "豁达乐观", 
    "聪明敏锐", "踏实可靠", "勇敢无畏", "优雅亲和", 
    "强运加身", "智慧神秘", "自由奔放", "温柔坚韧"
  ];
  const index = year % 12;
  return {
    animal: animals[index],
    secretStrength: traits[index],
    compliment: `你身上的${traits[index]}特质是最大的宝藏。`
  };
};

// Life Path Number Calculation (Numerology)
const calculateLifePathNumber = (birthDate: string): { number: string; meaning: string } => {
  const digits = birthDate.replace(/\D/g, '').split('').map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);

  // Reduce to single digit (1-9) or Master Numbers (11, 22, 33)
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = String(sum).split('').map(Number).reduce((a, b) => a + b, 0);
  }

  const numStr = String(sum);
  const meanings: Record<string, string> = {
    "1": "开创与领导", "2": "平衡与敏感", "3": "表达与创意", "4": "稳定与秩序",
    "5": "自由与冒险", "6": "关怀与责任", "7": "真理与智慧", "8": "力量与丰盛",
    "9": "人道与大爱", "11": "灵性启蒙 (卓越数)", "22": "梦想成真 (卓越数)", "33": "无私奉献 (卓越数)"
  };

  return { 
    number: numStr, 
    meaning: meanings[numStr] || "神秘能量" 
  };
};

const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomSubset = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// --- EXPANDED LOCAL DATABASES (500+ Items Total) ---

const LOCAL_TAROT = [
  // Major Arcana (22) with multiple variations of positive interpretations
  { cardName: "愚人 (The Fool)", meaning: "无限的潜力", advice: "保持赤子之心，勇敢迈出第一步。" },
  { cardName: "魔术师 (The Magician)", meaning: "创造力爆棚", advice: "你拥有一切实现梦想所需的资源。" },
  { cardName: "女祭司 (The High Priestess)", meaning: "直觉敏锐", advice: "静下心来，倾听内心的声音。" },
  { cardName: "女皇 (The Empress)", meaning: "丰盛与爱", advice: "尽情享受生活的美好与富足。" },
  { cardName: "皇帝 (The Emperor)", meaning: "掌控力", advice: "你的自律将带来巨大的成功。" },
  { cardName: "教皇 (The Hierophant)", meaning: "智慧指引", advice: "向智者学习，你会获得新的启发。" },
  { cardName: "恋人 (The Lovers)", meaning: "和谐关系", advice: "跟随心的指引，做出爱的选择。" },
  { cardName: "战车 (The Chariot)", meaning: "胜利在望", advice: "只要坚持，你就一定能赢。" },
  { cardName: "力量 (Strength)", meaning: "温柔的勇气", advice: "以柔克刚，相信你内心的力量。" },
  { cardName: "隐士 (The Hermit)", meaning: "自我探索", advice: "独处是为了遇见更好的自己。" },
  { cardName: "命运之轮 (Wheel of Fortune)", meaning: "好运降临", advice: "顺势而为，好运正在向你转动。" },
  { cardName: "正义 (Justice)", meaning: "公平与真相", advice: "坚持做正确的事，结果会令你满意。" },
  { cardName: "倒吊人 (The Hanged Man)", meaning: "新视角", advice: "换个角度看世界，你会发现惊喜。" },
  { cardName: "死神 (Death)", meaning: "重生与蜕变", advice: "告别过去，迎接崭新的开始。" },
  { cardName: "节制 (Temperance)", meaning: "平衡之道", advice: "保持耐心，一切都在往最好的方向发展。" },
  { cardName: "魔鬼 (The Devil)", meaning: "挣脱束缚", advice: "正视欲望，你拥有打破枷锁的能力。" },
  { cardName: "塔 (The Tower)", meaning: "破旧立新", advice: "打破常规，重建更坚固的基石。" },
  { cardName: "星星 (The Star)", meaning: "希望之光", advice: "保持乐观，愿望即将实现。" },
  { cardName: "月亮 (The Moon)", meaning: "探索潜意识", advice: "相信直觉，迷雾终将散去。" },
  { cardName: "太阳 (The Sun)", meaning: "纯粹的快乐", advice: "大胆去展示你自己吧，你就是光！" },
  { cardName: "审判 (Judgement)", meaning: "觉醒时刻", advice: "响应内心的召唤，去做你想做的事。" },
  { cardName: "世界 (The World)", meaning: "圆满达成", advice: "你的一个重要阶段即将完美收官。" },
  // Additional Positive Minor Arcana interpretations
  { cardName: "圣杯首牌", meaning: "情感的流动", advice: "敞开心扉，接受新的爱与友谊。" },
  { cardName: "圣杯三", meaning: "欢庆时刻", advice: "与朋友分享你的喜悦吧。" },
  { cardName: "圣杯十", meaning: "家庭幸福", advice: "珍惜身边爱你的人，幸福就在当下。" },
  { cardName: "权杖四", meaning: "稳固的基础", advice: "享受当下的安稳与快乐。" },
  { cardName: "权杖六", meaning: "荣耀与凯旋", advice: "你的努力即将得到众人的认可。" },
  { cardName: "星币首牌", meaning: "物质的馈赠", advice: "一个新的财运机会正在靠近。" },
  { cardName: "星币九", meaning: "富足与独立", advice: "享受你努力得来的丰硕成果。" },
  { cardName: "宝剑六", meaning: "平稳过渡", advice: "困难时期已经过去，前方是平静的水域。" }
];

const LOCAL_FOODS = [
  // Expanded list ~50 items
  { food: "热奶茶", reason: "甜甜的温度暖胃又暖心。" },
  { food: "鲜草莓", reason: "红色的果实带来满满元气。" },
  { food: "牛角包", reason: "酥脆的口感治愈一切小情绪。" },
  { food: "热汤面", reason: "碳水带来的快乐最实在。" },
  { food: "提拉米苏", reason: "那是带我走的浪漫味道。" },
  { food: "烤红薯", reason: "手心里的温暖是冬日限定的小确幸。" },
  { food: "寿司拼盘", reason: "精致的搭配让心情也变得丰富多彩。" },
  { food: "水果沙拉", reason: "清爽的维生素是身体最喜欢的礼物。" },
  { food: "巧克力", reason: "丝滑的口感是给大脑的甜蜜拥抱。" },
  { food: "关东煮", reason: "热气腾腾的汤底治愈深夜的疲惫。" },
  { food: "麻辣烫", reason: "热辣的口感瞬间激活你的能量。" },
  { food: "蛋挞", reason: "外酥里嫩，一口咬下满满的幸福。" },
  { food: "冰淇淋", reason: "甜蜜的凉意是给心情的最好降温。" },
  { food: "红烧肉", reason: "肥而不腻的满足感，是对辛苦的犒赏。" },
  { food: "清粥小菜", reason: "平淡中见真味，回归生活的本真。" },
  { food: "拿铁咖啡", reason: "醇厚的香气唤醒你一整天的活力。" },
  { food: "马卡龙", reason: "彩色的甜蜜，像少女的梦一样美好。" },
  { food: "炸鸡", reason: "咔滋一声，快乐加倍。" },
  { food: "饺子", reason: "包容万物，象征着圆满和团聚。" },
  { food: "酸奶", reason: "简单纯粹，帮助你消化掉所有烦恼。" },
  { food: "蜂蜜水", reason: "滋润心田，让生活多一点甜。" },
  { food: "彩虹糖", reason: "每一颗都是意想不到的惊喜。" },
  { food: "披萨", reason: "丰富的馅料，分享让美味升级。" },
  { food: "三明治", reason: "层次分明，生活也该井井有条。" },
  { food: "抹茶蛋糕", reason: "微苦后的回甘，是成长的味道。" },
  { food: "烤串", reason: "烟火气里藏着最真实的生活。" },
  { food: "椰子水", reason: "清冽甘甜，带你一秒穿越到海岛。" },
  { food: "曲奇饼干", reason: "酥脆掉渣，每一口都是童年的味道。" },
  { food: "薄荷糖", reason: "清凉提神，让思绪瞬间清晰。" },
  { food: "布丁", reason: "Q弹爽滑，生活也该如此有弹性。" },
  { food: "杨枝甘露", reason: "酸甜交织，口感丰富如同人生。" },
  { food: "坚果", reason: "积蓄能量，为下一次爆发做准备。" },
  { food: "海鲜粥", reason: "鲜美的滋味，抚慰深夜的灵魂。" },
  { food: "松饼", reason: "松软香甜，早晨的第一份治愈。" },
  { food: "炒饭", reason: "平凡的食材也能碰撞出绝妙的滋味。" },
  { food: "橙汁", reason: "金色的液体，充满阳光的味道。" },
  { food: "汤圆", reason: "软糯香甜，团团圆圆。" },
  { food: "春卷", reason: "咬一口春天，生机勃勃。" },
  { food: "铜锣烧", reason: "哆啦A梦的最爱，拥有实现愿望的魔法。" },
  { food: "章鱼小丸子", reason: "外焦里嫩，一口一个满足。" }
];

const LOCAL_ACTIVITIES = [
  // Expanded list ~50 items
  { action: "深呼吸", benefit: "吸入好运，呼出烦恼。" },
  { action: "晒太阳", benefit: "补充天然的光合作用能量。" },
  { action: "整理桌面", benefit: "理清思绪，迎接新灵感。" },
  { action: "听雨声", benefit: "感受大自然的白噪音疗愈。" },
  { action: "写日记", benefit: "记录下每一个闪光的瞬间。" },
  { action: "泡个澡", benefit: "洗去一身疲惫，重获新生。" },
  { action: "读首诗", benefit: "让灵魂在文字里短暂栖息。" },
  { action: "看云彩", benefit: "想象力是治愈无聊的最佳解药。" },
  { action: "伸懒腰", benefit: "舒展身体，激活满满的活力。" },
  { action: "给花浇水", benefit: "见证生命生长的微小喜悦。" },
  { action: "散步", benefit: "脚步慢下来，心也会跟着静下来。" },
  { action: "听老歌", benefit: "在旋律中重温美好的旧时光。" },
  { action: "冥想", benefit: "关照内心，找回内在的平静。" },
  { action: "撸猫/狗", benefit: "毛茸茸的触感是最好的解压剂。" },
  { action: "大笑", benefit: "笑声能驱散所有的阴霾。" },
  { action: "喝杯水", benefit: "滋润身体，让思维重新流动。" },
  { action: "看日落", benefit: "感受一天中最温柔的时刻。" },
  { action: "赤脚走路", benefit: "与大地连接，感受根基的稳固。" },
  { action: "画画涂鸦", benefit: "释放你内心的创造力小孩。" },
  { action: "拥抱树木", benefit: "感受大自然沉默而坚定的力量。" },
  { action: "数星星", benefit: "仰望星空，烦恼会变得很渺小。" },
  { action: "闻花香", benefit: "芬芳的气息能瞬间愉悦感官。" },
  { action: "做拉伸", benefit: "让身体的每一个细胞都醒过来。" },
  { action: "看老照片", benefit: "回忆是时光赠予的礼物。" },
  { action: "断舍离", benefit: "清理空间，也清理心灵的负荷。" },
  { action: "早睡", benefit: "梦里有你想见的一切美好。" },
  { action: "微笑", benefit: "嘴角上扬，好运自然来。" },
  { action: "哼首歌", benefit: "做自己生活的背景音乐家。" },
  { action: "发呆", benefit: "给大脑一段空白的休息时间。" },
  { action: "练字", benefit: "一笔一划中找回专注的宁静。" },
  { action: "看海", benefit: "宽阔的海洋能包容所有的情绪。" },
  { action: "点香薰", benefit: "氛围感是提升幸福感的秘诀。" },
  { action: "做手工", benefit: "专注当下的过程最治愈。" },
  { action: "给朋友发消息", benefit: "分享快乐，快乐会加倍。" },
  { action: "逛公园", benefit: "城市里的绿洲，心灵的后花园。" },
  { action: "看蚂蚁搬家", benefit: "微观世界里藏着大智慧。" },
  { action: "吃早餐", benefit: "充满仪式感的开启新的一天。" },
  { action: "换个发型", benefit: "从头开始，迎接新的自己。" },
  { action: "仰望高楼", benefit: "感受城市的脉搏与梦想。" },
  { action: "擦鞋子", benefit: "脚踏实地，从整洁开始。" }
];

const LOCAL_CELEBS: CelebrityMatch[] = [
  // Expanded list ~30 items
  { name: "奥黛丽·赫本", desc: "优雅天使", reason: "你们都拥有一颗温暖善良的心。", romanticVibe: "灵魂共鸣" },
  { name: "周杰伦", desc: "音乐才子", reason: "感性频率一致，懂彼此的浪漫。", romanticVibe: "浪漫听众" },
  { name: "宫崎骏", desc: "造梦师", reason: "都相信童话与魔法的存在。", romanticVibe: "梦想伙伴" },
  { name: "小王子", desc: "星际旅人", reason: "保持着纯真，能看懂本质。", romanticVibe: "纯真守护" },
  { name: "霉霉 (Taylor Swift)", desc: "才华天后", reason: "在爱与被爱中勇敢做自己。", romanticVibe: "闪耀拍档" },
  { name: "王嘉尔", desc: "热情骑士", reason: "真诚热烈的性格一拍即合。", romanticVibe: "活力满分" },
  { name: "刘亦菲", desc: "人间仙女", reason: "淡然处世的智慧不谋而合。", romanticVibe: "清醒独立" },
  { name: "易烊千玺", desc: "沉稳少年", reason: "内心的丰富世界只有你们懂。", romanticVibe: "静谧默契" },
  { name: "Lisa", desc: "人间芭比", reason: "阳光自信的笑容会互相感染。", romanticVibe: "快乐源泉" },
  { name: "胡歌", desc: "温润君子", reason: "历经千帆归来仍是少年的赤诚。", romanticVibe: "知己之交" },
  { name: "新垣结衣", desc: "治愈女神", reason: "笑容能融化世间一切冰雪。", romanticVibe: "温暖陪伴" },
  { name: "权志龙 (GD)", desc: "潮流先锋", reason: "独特的审美与个性相互吸引。", romanticVibe: "灵感缪斯" },
  { name: "艾玛·沃特森", desc: "智慧魔女", reason: "独立思考的能力让你们惺惺相惜。", romanticVibe: "智性恋人" },
  { name: "肖战", desc: "温暖学长", reason: "温柔坚定的力量感让人安心。", romanticVibe: "温柔依靠" },
  { name: "Jennie", desc: "猫系女友", reason: "慵懒中带着野性，魅力十足。", romanticVibe: "时尚伴侣" },
  { name: "基努·里维斯", desc: "孤独行者", reason: "在这个喧嚣世界中保持清醒。", romanticVibe: "深沉共鸣" },
  { name: "杨幂", desc: "清醒女王", reason: "双商在线，能互相成就。", romanticVibe: "势均力敌" },
  { name: "王一博", desc: "酷盖少年", reason: "对热爱的执着让你们互相欣赏。", romanticVibe: "热血搭档" },
  { name: "迪丽热巴", desc: "明艳玫瑰", reason: "热情开朗，生活充满欢声笑语。", romanticVibe: "甜蜜暴击" },
  { name: "抖森 (Tom Hiddleston)", desc: "英伦绅士", reason: "博学多才，交流永远充满乐趣。", romanticVibe: "优雅之恋" },
  { name: "赵丽颖", desc: "励志女神", reason: "坚韧不拔的品格相互激励。", romanticVibe: "成长伙伴" },
  { name: "甜茶 (Timothée)", desc: "文艺忧郁", reason: "细腻的情感世界只有你能懂。", romanticVibe: "文艺知音" },
  { name: "舒淇", desc: "风情万种", reason: "随性洒脱的生活态度令人向往。", romanticVibe: "自由灵魂" },
  { name: "木村拓哉", desc: "日剧天王", reason: "一生悬命的努力令人动容。", romanticVibe: "坚定信仰" },
  { name: "全智贤", desc: "气场女王", reason: "自信的样子是最好的风景。", romanticVibe: "霸气守护" }
];

const LOCAL_MANSIONS = [
  // Full 28 Mansions
  { starName: "角木蛟", guidance: "如龙潜深渊，积蓄力量待时而动，未来可期。" },
  { starName: "亢金龙", guidance: "刚柔并济，你的正直是最大的护身符。" },
  { starName: "氐土貉", guidance: "根基稳固，只要坚持就能看到开花结果。" },
  { starName: "房日兔", guidance: "温顺善良，好人缘会为你带来意想不到的贵人。" },
  { starName: "心月狐", guidance: "灵动聪慧，相信你的直觉，它会指引你找到答案。" },
  { starName: "尾火虎", guidance: "霸气侧漏，关键时刻果断出击能定乾坤。" },
  { starName: "箕水豹", guidance: "反应敏捷，在变化中寻找机会是你的强项。" },
  { starName: "斗木蟹", guidance: "坚韧不拔，困难只是你成功的垫脚石。" },
  { starName: "牛金牛", guidance: "勤勉踏实，你的每一分付出都会有回报。" },
  { starName: "女土蝠", guidance: "深藏不露，你的智慧往往在关键时刻惊艳众人。" },
  { starName: "虚日鼠", guidance: "谨慎细致，细节决定成败，你做得很好。" },
  { starName: "危月燕", guidance: "居安思危，未雨绸缪让你总能立于不败之地。" },
  { starName: "室火猪", guidance: "勇猛直前，有时候莽撞一点也是一种可爱。" },
  { starName: "壁水貐", guidance: "温和包容，你的胸怀能容纳万千沟壑。" },
  { starName: "奎木狼", guidance: "团结协作，和伙伴在一起能发挥最大能量。" },
  { starName: "娄金狗", guidance: "忠诚可靠，你的信誉是你最宝贵的资产。" },
  { starName: "胃土雉", guidance: "沉稳务实，一步一个脚印，捷径就在脚下。" },
  { starName: "昴日鸡", guidance: "名声大噪，今日你的光芒无法被遮挡。" },
  { starName: "毕月乌", guidance: "大智若愚，不要被表象迷惑，看透本质。" },
  { starName: "觜火猴", guidance: "机智过人，幽默感能化解一切尴尬。" },
  { starName: "参水猿", guidance: "才华横溢，今日宜展示你的独特才艺。" },
  { starName: "井木犴", guidance: "条理清晰，适合处理复杂的难题。" },
  { starName: "鬼金羊", guidance: "灵感迸发，捕捉脑海中一闪而过的念头。" },
  { starName: "柳土獐", guidance: "心思缜密，你的周全让周围人感到安心。" },
  { starName: "星日马", guidance: "奔放自由，去追逐风，去追逐你的梦。" },
  { starName: "张月鹿", guidance: "优雅从容，保持你的节奏，不必慌张。" },
  { starName: "翼火蛇", guidance: "灵活变通，适应环境能让你生存得更好。" },
  { starName: "轸水蚓", guidance: "柔韧有余，能屈能伸方显英雄本色。" }
];

const LOCAL_MOVIES = [
  { title: "白日梦想家", reason: "去看世界吧，去感受生活，去寻找第25张底片。" },
  { title: "当幸福来敲门", reason: "如果你有梦想，就要去捍卫它。" },
  { title: "阿甘正传", reason: "生活就像一盒巧克力，你永远不知道下一颗是什么味道。" },
  { title: "千与千寻", reason: "不要回头，一直向前走。" },
  { title: "真爱至上", reason: "爱无处不在，只要你用心感受。" },
  { title: "心灵奇旅", reason: "火花不是人生目标，当你想要生活的那一刻，火花就已经点燃。" },
  { title: "楚门的世界", reason: "如果再也不能见到你，祝你早安，午安，晚安。" },
  { title: "怦然心动", reason: "有些人浅薄，有些人金玉其外，而总有一天你会遇到一个彩虹般绚丽的人。" },
  { title: "海蒂和爷爷", reason: "如果生活中有什么使你感到快乐，那就去做吧。" },
  { title: "寻梦环游记", reason: "死亡不是终点，遗忘才是。被爱着，就不会消失。" },
  { title: "放牛班的春天", reason: "永不放弃，总有希望在前方等待。" },
  { title: "天使爱美丽", reason: "幸福不需要惊天动地，它藏在生活的细节里。" },
  { title: "飞屋环游记", reason: "去冒险吧，只要和对的人在一起。" },
  { title: "触不可及", reason: "跨越阶层的友谊，温暖而治愈。" },
  { title: "绿皮书", reason: "世界上孤独的人都害怕迈出第一步。" },
  { title: "龙猫", reason: "生活坏到一定程度就会好起来，因为它无法更坏。" },
  { title: "小森林", reason: "在四季流转中，找回内心的平静。" },
  { title: "菊次郎的夏天", reason: "温柔和善良是这个夏天最美好的回忆。" },
  { title: "星际穿越", reason: "爱是唯一可以穿越时间与空间的事物。" },
  { title: "疯狂动物城", reason: "尝试一切，你可能会失败，但你必须尝试。" },
  { title: "爱在黎明破晓前", reason: "那一夜的交谈，胜过几十年的庸碌。" },
  { title: "时空恋旅人", reason: "我们生活的每一天，都是一次时空旅行。" },
  { title: "实习生", reason: "经验永不过时，真诚永远打动人心。" },
  { title: "帕丁顿熊", reason: "只要你对人礼貌，世界就会变得美好。" },
  { title: "饮食男女", reason: "唯有美食与爱不可辜负。" }
];

const LOCAL_MUSIC = [
  { title: "Golden Hour", artist: "JVKE", vibe: "感受日落时分的金色浪漫。" },
  { title: "Viva La Vida", artist: "Coldplay", vibe: "史诗般的旋律，给你征服世界的力量。" },
  { title: "稻香", artist: "周杰伦", vibe: "回到最初的美好，功成名就不是目的。" },
  { title: "Try Everything", artist: "Shakira", vibe: "永不放弃，再一次尝试。" },
  { title: "Lemon", artist: "米津玄师", vibe: "苦涩后的回甘，是成长的味道。" },
  { title: "起风了", artist: "买辣椒也用券", vibe: "愿你出走半生，归来仍是少年。" },
  { title: "Imagine", artist: "John Lennon", vibe: "想象一个充满爱与和平的世界。" },
  { title: "Bohemian Rhapsody", artist: "Queen", vibe: "打破常规，做不一样的烟火。" },
  { title: "Yellow", artist: "Coldplay", vibe: "看那天上的星星，都在为你闪耀。" },
  { title: "Summer", artist: "久石让", vibe: "那个夏天，蝉鸣和微风都刚刚好。" },
  { title: "City of Stars", artist: "La La Land", vibe: "星光璀璨，只为追梦人点亮。" },
  { title: "Perfect", artist: "Ed Sheeran", vibe: "在平凡的日子里，找到完美的爱。" },
  { title: "New Boy", artist: "朴树", vibe: "生活是甜的，未来是轻盈的。" },
  { title: "海阔天空", artist: "Beyond", vibe: "原谅我这一生不羁放纵爱自由。" },
  { title: "你要跳舞吗", artist: "新裤子", vibe: "别犹豫了，现在就快乐起来。" },
  { title: "First Love", artist: "宇多田光", vibe: "初恋的苦涩与甜蜜，都是青春的印记。" },
  { title: "直到世界尽头", artist: "WANDS", vibe: "热血永不熄灭，致那段回不去的青春。" },
  { title: "Top of the World", artist: "Carpenters", vibe: "站在世界之巅，俯瞰一切美好。" },
  { title: "Dancing Queen", artist: "ABBA", vibe: "你是舞池中最闪亮的女王。" },
  { title: "Fly Me to the Moon", artist: "Frank Sinatra", vibe: "带我去月球，看看宇宙的浪漫。" }
];


const generateLocalFortune = (profile: UserProfile): FortuneResult => {
  const date = new Date(profile.birthDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const zodiac = getZodiacData(month, day);
  const cZodiac = getChineseZodiacData(year);
  const lifePath = calculateLifePathNumber(profile.birthDate);
  
  // Seeded Random Helper: ensures consistency for same user+date, but changes daily
  const seedString = `${profile.name}-${year}-${month}-${day}-${new Date().toDateString()}`;
  let seed = 0;
  for (let i = 0; i < seedString.length; i++) {
    seed = (seed << 5) - seed + seedString.charCodeAt(i);
    seed |= 0;
  }
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const getSeededRandom = <T>(arr: T[]): T => arr[Math.floor(seededRandom() * arr.length)];
  const getSeededSubset = <T>(arr: T[], count: number): T[] => {
    // Simple shuffle using seeded random
    const shuffled = [...arr].sort(() => 0.5 - seededRandom());
    return shuffled.slice(0, count);
  };

  const mansion = getSeededRandom(LOCAL_MANSIONS);

  return {
    isFallback: true,
    zodiac: {
      sign: zodiac.sign,
      luckyTrait: zodiac.trait,
      compliment: zodiac.compliment
    },
    astralChart: {
      analysis: `亲爱的${zodiac.sign}，星盘显示太阳正照亮你的本命宫位，这意味着你原本的特质正在闪闪发光。无需刻意改变，做最真实的自己就能吸引好运。今天宇宙能量非常支持你去行动。`,
      planetaryInfluence: `${zodiac.sign}守护星能量增强`,
      keyAspect: "太阳六合木星",
      luckyHouse: "第一宫-命宫"
    },
    chineseZodiac: cZodiac,
    tarot: getSeededRandom(LOCAL_TAROT),
    mbtiAnalysis: {
      type: profile.mbti || "ENFP",
      superpower: "情绪感知力",
      socialVibe: "治愈系小天使"
    },
    constellation: {
      starName: mansion.starName,
      guidance: mansion.guidance
    },
    luckyItems: {
      color: "奶油黄",
      number: lifePath.number, // Use real numerology
      item: "水晶手链"
    },
    celebrityMatch: getSeededSubset(LOCAL_CELEBS, 5),
    luckyFood: getSeededRandom(LOCAL_FOODS),
    luckyActivity: getSeededRandom(LOCAL_ACTIVITIES),
    compatibleAnimal: {
      animal: "卡皮巴拉 (水豚)",
      trait: "情绪稳定",
      reason: "它能听懂你心里的所有碎碎念。"
    },
    dailyMovie: getSeededRandom(LOCAL_MOVIES),
    dailyMusic: getSeededRandom(LOCAL_MUSIC),
    dailyAffirmation: "我相信所有的美好都在赶路，即将在下一个路口与我相遇。"
  };
};


// --- MAIN GENERATION FUNCTION ---

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const generateFortuneReport = async (profile: UserProfile): Promise<FortuneResult> => {
  // If no API Key provided, immediately fallback to local engine
  if (!process.env.API_KEY) {
    console.log("Using Local Engine due to missing API Key");
    return generateLocalFortune(profile);
  }

  const model = "gemini-2.5-flash";
  
  const systemInstruction = `
    You are a "Lucky Engine" for the app "Lucky" (幸运点点). 
    
    CORE DIRECTIVE:
    You must act as an expert Astrologer and Fortune Teller. 
    You MUST calculate the accurate Zodiac Sign (Sun Sign) and Chinese Zodiac (Animal) based on the user's specific Birth Date provided. DO NOT guess or randomize this. 
    
    **Numerology Requirement**:
    Calculate the user's "Life Path Number" based on their full birth date (YYYY-MM-DD) and use this as the 'luckyItems.number'. Provide a short meaning if possible in the context.
    
    The analysis must be strictly personalized to this birth date's astrological chart interacting with TODAY's energy.
    
    Rules:
    1. NO negativity. No warnings. No "bad luck".
    2. Tone: Cute, warm, supportive, safe, like a best friend or a gentle spirit.
    3. Language: Simplified Chinese (简体中文).
    4. If the user didn't provide MBTI, infer a likely personality type based on their Zodiac characteristics.
    5. Interpret everything as a "Lucky Point". Even difficult aspects should be interpreted as "opportunities for growth" or "hidden strengths".
    6. For Movie and Music recommendations, choose selections that fit the specific vibe of their Zodiac sign (e.g., Cancer -> Cozy/Family, Leo -> Grand/Inspiring).
    7. For Lucky Food, suggest items that balance their element (Fire/Earth/Air/Water) or are seasonally appropriate.
    8. For Lucky Activity, suggest simple, FREE, non-consumerist actions (e.g., "Look at the sky").
    9. For "Celebrity Match", GENERATE 5 DIFFERENT MATCHES. Select celebrities who have compatible Zodiac signs or vibes with the user.
    10. CRITICAL FOR ASTRAL CHART: You MUST mention specific, REAL Astrological Aspects (e.g., Sun Trine Jupiter, Moon in 5th House) that are plausible for their chart or current transits. Explain how this specific energy empowers them.
    11. For 'constellation', use CHINESE 28 MANSIONS (二十八星宿) like '角木蛟', '心月狐', not Western constellations.
  `;

  const prompt = `
    User Profile:
    Name: ${profile.name}
    Birthday: ${profile.birthDate}
    MBTI: ${profile.mbti || "Unknown (please intuit based on birthday)"}

    Task:
    1. Determine Zodiac Sign, Chinese Zodiac, and Life Path Number.
    2. Analyze the current astrological energy for this specific person.
    3. Generate a JSON object containing a comprehensive positive analysis.
    
    CRITICAL: The 'celebrityMatch' field must be an ARRAY of 5 different objects.
    CRITICAL: In 'astralChart', provide 'keyAspect' and 'luckyHouse'.
    CRITICAL: In 'constellation', return a Chinese Lunar Mansion name.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            zodiac: {
              type: Type.OBJECT,
              properties: {
                sign: { type: Type.STRING, description: "Accurate Sun Sign based on birthday" },
                luckyTrait: { type: Type.STRING, description: "A personality strength of this sign" },
                compliment: { type: Type.STRING, description: "A short, sweet compliment about this sign" },
              },
              required: ["sign", "luckyTrait", "compliment"],
            },
            astralChart: {
              type: Type.OBJECT,
              properties: {
                analysis: { type: Type.STRING, description: "A paragraph (50-80 words) of deep analysis based on their birth chart energy. MUST mention specific phases/aspects or houses and how they empower the user." },
                planetaryInfluence: { type: Type.STRING, description: "A short phrase about a planet helping them today, e.g., 'Venus is bringing you love'." },
                keyAspect: { type: Type.STRING, description: "Specific aspect, e.g., '太阳拱木星 (Sun Trine Jupiter)'" },
                luckyHouse: { type: Type.STRING, description: "Specific house, e.g., '第五宫-真爱宫'" },
              },
              required: ["analysis", "planetaryInfluence", "keyAspect", "luckyHouse"],
            },
            chineseZodiac: {
              type: Type.OBJECT,
              properties: {
                animal: { type: Type.STRING, description: "Accurate Chinese Zodiac Animal based on birth year" },
                secretStrength: { type: Type.STRING },
                compliment: { type: Type.STRING },
              },
              required: ["animal", "secretStrength", "compliment"],
            },
            tarot: {
              type: Type.OBJECT,
              properties: {
                cardName: { type: Type.STRING },
                meaning: { type: Type.STRING, description: "Strictly positive interpretation" },
                advice: { type: Type.STRING, description: "Gentle, actionable advice" },
              },
              required: ["cardName", "meaning", "advice"],
            },
            mbtiAnalysis: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                superpower: { type: Type.STRING, description: "Their unique cognitive strength" },
                socialVibe: { type: Type.STRING, description: "How they make others feel good" },
              },
              required: ["type", "superpower", "socialVibe"],
            },
            constellation: {
              type: Type.OBJECT,
              properties: {
                starName: { type: Type.STRING, description: "Chinese Lunar Mansion (e.g. 心月狐)" },
                guidance: { type: Type.STRING },
              },
              required: ["starName", "guidance"],
            },
            luckyItems: {
              type: Type.OBJECT,
              properties: {
                color: { type: Type.STRING },
                number: { type: Type.STRING, description: "Calculated Life Path Number" },
                item: { type: Type.STRING },
              },
              required: ["color", "number", "item"],
            },
            celebrityMatch: {
               type: Type.ARRAY,
               items: {
                 type: Type.OBJECT,
                 properties: {
                   name: { type: Type.STRING, description: "Name of the celebrity match" },
                   desc: { type: Type.STRING, description: "Short description like 'Gentle Soul' or 'Pop Star'" },
                   reason: { type: Type.STRING, description: "Why they are a good match romantically/platonically based on astrology" },
                   romanticVibe: { type: Type.STRING, description: "A keyword like 'Soulmate', 'Twin Flame', 'Bestie'" },
                 },
                 required: ["name", "desc", "reason", "romanticVibe"],
               },
            },
            luckyFood: {
              type: Type.OBJECT,
              properties: {
                food: { type: Type.STRING, description: "A specific comforting or happy food" },
                reason: { type: Type.STRING, description: "Why this food brings luck today" },
              },
              required: ["food", "reason"],
            },
            luckyActivity: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING, description: "A simple positive action (non-spending)" },
                benefit: { type: Type.STRING, description: "The emotional or physical benefit" },
              },
              required: ["action", "benefit"],
            },
            compatibleAnimal: {
              type: Type.OBJECT,
              properties: {
                animal: { type: Type.STRING, description: "A cute animal name" },
                trait: { type: Type.STRING, description: "A cute trait of this animal, e.g. '呆萌治愈'" },
                reason: { type: Type.STRING, description: "Why they match the user today" },
              },
              required: ["animal", "trait", "reason"],
            },
            dailyMovie: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                reason: { type: Type.STRING, description: "Why this heartwarming movie fits today's vibe" },
              },
              required: ["title", "reason"],
            },
            dailyMusic: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                artist: { type: Type.STRING },
                vibe: { type: Type.STRING, description: "The emotional boost this song provides" },
              },
              required: ["title", "artist", "vibe"],
            },
            dailyAffirmation: { type: Type.STRING, description: "A powerful positive sentence for today" },
          },
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data received from spirit world");
    
    return JSON.parse(jsonText) as FortuneResult;

  } catch (error) {
    console.warn("API Error, switching to Local Engine:", error);
    // Use the robust local generator instead of static data
    return generateLocalFortune(profile);
  }
};

export const createGenieChat = (): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: 'You are a friendly and encouraging "Lucky Genie" for the app "Lucky" (幸运点点). Respond in Simplified Chinese. Keep it positive, warm, and supportive.',
    }
  });
};
