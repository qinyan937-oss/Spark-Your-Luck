
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { UserProfile, FortuneResult, CelebrityMatch } from "../types";

// Helper to get API key safely
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    console.warn("API Key not found. Using Local Lucky Engine.");
    return "";
  }
  return key;
};

// --- LOCAL CALCULATION HELPERS ---

const getZodiacData = (month: number, day: number) => {
  const zodiacs = [
    { sign: "摩羯座", start: [1, 1], end: [1, 19], luckyTrait: "坚韧稳重", compliment: "你拥有最让人安心的可靠力量。" },
    { sign: "水瓶座", start: [1, 20], end: [2, 18], luckyTrait: "独一无二", compliment: "你的灵魂里住着璀璨的星河。" },
    { sign: "双鱼座", start: [2, 19], end: [3, 20], luckyTrait: "温柔浪漫", compliment: "世界因为你的温柔而变得柔软。" },
    { sign: "白羊座", start: [3, 21], end: [4, 19], luckyTrait: "赤诚热烈", compliment: "你永远拥有少年的勇气和热情。" },
    { sign: "金牛座", start: [4, 20], end: [5, 20], luckyTrait: "温润如玉", compliment: "你懂得发现生活最本质的美好。" },
    { sign: "双子座", start: [5, 21], end: [6, 21], luckyTrait: "灵动有趣", compliment: "你是有趣灵魂的最佳代言人。" },
    { sign: "巨蟹座", start: [6, 22], end: [7, 22], luckyTrait: "细腻体贴", compliment: "你的爱像月光一样温柔地治愈他人。" },
    { sign: "狮子座", start: [7, 23], end: [8, 22], luckyTrait: "光芒万丈", compliment: "你天生就是舞台中央的主角。" },
    { sign: "处女座", start: [8, 23], end: [9, 22], luckyTrait: "精致完美", compliment: "你把生活过成了一首精致的诗。" },
    { sign: "天秤座", start: [9, 23], end: [10, 23], luckyTrait: "优雅迷人", compliment: "你的存在本身就是一种和谐的美。" },
    { sign: "天蝎座", start: [10, 24], end: [11, 22], luckyTrait: "深邃迷人", compliment: "你的神秘感是让人无法抗拒的引力。" },
    { sign: "射手座", start: [11, 23], end: [12, 21], luckyTrait: "自由洒脱", compliment: "你是自由的风，永远追逐着光。" },
    { sign: "摩羯座", start: [12, 22], end: [12, 31], luckyTrait: "坚韧稳重", compliment: "你拥有最让人安心的可靠力量。" },
  ];

  for (const z of zodiacs) {
    if (
      (month === z.start[0] && day >= z.start[1]) ||
      (month === z.end[0] && day <= z.end[1])
    ) {
      return z;
    }
  }
  return zodiacs[0];
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

// Life Path Number Calculation
const calculateLifePathNumber = (birthDate: string): { number: string; meaning: string } => {
  const digits = birthDate.replace(/\D/g, '').split('').map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = String(sum).split('').map(Number).reduce((a, b) => a + b, 0);
  }
  const numStr = String(sum);
  const meanings: Record<string, string> = {
    "1": "开创与领导", "2": "平衡与敏感", "3": "表达与创意", "4": "稳定与秩序",
    "5": "自由与冒险", "6": "关怀与责任", "7": "真理与智慧", "8": "力量与丰盛",
    "9": "人道与大爱", "11": "灵性启蒙", "22": "梦想成真", "33": "无私奉献"
  };
  return { number: numStr, meaning: meanings[numStr] || "神秘能量" };
};

// --- MASSIVE LOCAL DATABASES (500+ Items) ---

const LOCAL_TAROT = [
  { cardName: "愚人", meaning: "无限潜力", advice: "保持赤子之心，勇敢迈出第一步。" },
  { cardName: "魔术师", meaning: "创造力爆棚", advice: "你拥有一切实现梦想所需的资源。" },
  { cardName: "女祭司", meaning: "直觉敏锐", advice: "静下心来，倾听内心的声音。" },
  { cardName: "女皇", meaning: "丰盛与爱", advice: "尽情享受生活的美好与富足。" },
  { cardName: "皇帝", meaning: "掌控力", advice: "你的自律将带来巨大的成功。" },
  { cardName: "教皇", meaning: "智慧指引", advice: "向智者学习，你会获得新的启发。" },
  { cardName: "恋人", meaning: "和谐关系", advice: "跟随心的指引，做出爱的选择。" },
  { cardName: "战车", meaning: "胜利在望", advice: "只要坚持，你就一定能赢。" },
  { cardName: "力量", meaning: "温柔勇气", advice: "以柔克刚，相信你内心的力量。" },
  { cardName: "隐士", meaning: "自我探索", advice: "独处是为了遇见更好的自己。" },
  { cardName: "命运之轮", meaning: "好运降临", advice: "顺势而为，好运正在向你转动。" },
  { cardName: "正义", meaning: "公平真相", advice: "坚持做正确的事，结果会令你满意。" },
  { cardName: "倒吊人", meaning: "新视角", advice: "换个角度看世界，你会发现惊喜。" },
  { cardName: "死神", meaning: "重生蜕变", advice: "告别过去，迎接崭新的开始。" },
  { cardName: "节制", meaning: "平衡之道", advice: "保持耐心，一切在往最好的方向发展。" },
  { cardName: "魔鬼", meaning: "挣脱束缚", advice: "正视欲望，你拥有打破枷锁的能力。" },
  { cardName: "塔", meaning: "破旧立新", advice: "打破常规，重建更坚固的基石。" },
  { cardName: "星星", meaning: "希望之光", advice: "保持乐观，愿望即将实现。" },
  { cardName: "月亮", meaning: "探索潜意识", advice: "相信直觉，迷雾终将散去。" },
  { cardName: "太阳", meaning: "纯粹快乐", advice: "大胆去展示你自己吧，你就是光！" },
  { cardName: "审判", meaning: "觉醒时刻", advice: "响应内心的召唤，去做你想做的事。" },
  { cardName: "世界", meaning: "圆满达成", advice: "你的一个重要阶段即将完美收官。" },
];

const LOCAL_MANSIONS = [
  { starName: "角木蛟", guidance: "如龙潜深渊，积蓄力量待时而动。" },
  { starName: "亢金龙", guidance: "刚柔并济，你的正直是最大的护身符。" },
  { starName: "氐土貉", guidance: "根基稳固，只要坚持就能看到开花结果。" },
  { starName: "房日兔", guidance: "温顺善良，好人缘会为你带来贵人。" },
  { starName: "心月狐", guidance: "灵动聪慧，相信你的直觉。" },
  { starName: "尾火虎", guidance: "霸气侧漏，关键时刻果断出击能定乾坤。" },
  { starName: "箕水豹", guidance: "反应敏捷，在变化中寻找机会是你的强项。" },
  { starName: "斗木蟹", guidance: "坚韧不拔，困难只是你成功的垫脚石。" },
  { starName: "牛金牛", guidance: "勤勉踏实，你的每一分付出都会有回报。" },
  { starName: "女土蝠", guidance: "深藏不露，你的智慧往往在关键时刻惊艳众人。" },
  { starName: "虚日鼠", guidance: "谨慎细致，细节决定成败。" },
  { starName: "危月燕", guidance: "居安思危，未雨绸缪让你立于不败之地。" },
  { starName: "室火猪", guidance: "勇猛直前，有时候莽撞一点也是一种可爱。" },
  { starName: "壁水貐", guidance: "温和包容，你的胸怀能容纳万千沟壑。" },
  { starName: "奎木狼", guidance: "团结协作，和伙伴在一起能发挥最大能量。" },
  { starName: "娄金狗", guidance: "忠诚可靠，你的信誉是你最宝贵的资产。" },
  { starName: "胃土雉", guidance: "沉稳务实，一步一个脚印。" },
  { starName: "昴日鸡", guidance: "名声大噪，今日你的光芒无法被遮挡。" },
  { starName: "毕月乌", guidance: "大智若愚，看透本质。" },
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

const LOCAL_COLORS = [
  "薄柿色", "天青色", "暮山紫", "月白", "朱砂红", "琥珀色", "翡翠绿", "琉璃蓝", 
  "香槟金", "樱花粉", "奶油黄", "薄荷绿", "雾霾蓝", "脏橘色", "奶茶色", "藕粉色",
  "松石绿", "黛蓝", "胭脂红", "象牙白", "极光紫", "星空灰", "珊瑚红", "柠檬黄",
  "青柠色", "孔雀蓝", "玫瑰金", "薰衣草紫", "抹茶绿", "大地色", "酒红", "藏青"
];

const LOCAL_LUCKY_OBJECTS = [
  "一枚硬币", "旧车票", "发光的石头", "一片树叶", "羽毛", "水晶", "香薰", "镜子", 
  "铃铛", "红绳", "书签", "钥匙扣", "玻璃珠", "贝壳", "干花", "纽扣", 
  "便利贴", "多肉植物", "咖啡杯", "耳机", "手表", "戒指", "项链", "围巾",
  "帽子", "眼镜", "钢笔", "笔记本", "明信片", "玩偶", "护身符", "香水"
];

const LOCAL_ANIMALS = [
  { animal: "水豚", trait: "情绪稳定", reason: "保持佛系，万事不慌。" },
  { animal: "小熊猫", trait: "可可爱爱", reason: "你的萌力能治愈世界。" },
  { animal: "海豚", trait: "自由快乐", reason: "在大海中畅游，追逐浪花。" },
  { animal: "树懒", trait: "从容淡定", reason: "慢下来，享受生活的节奏。" },
  { animal: "猫头鹰", trait: "智慧洞察", reason: "在暗夜中也能看清方向。" },
  { animal: "考拉", trait: "温和慵懒", reason: "给心灵一个大大的拥抱。" },
  { animal: "狐狸", trait: "灵动机智", reason: "用智慧化解所有难题。" },
  { animal: "企鹅", trait: "团结有爱", reason: "不管风雪多大，身边都有伙伴。" },
  { animal: "长颈鹿", trait: "高瞻远瞩", reason: "站得高，看得远。" },
  { animal: "蝴蝶", trait: "蜕变重生", reason: "美丽的蜕变正在发生。" },
  { animal: "蜜蜂", trait: "勤劳甜蜜", reason: "每一分耕耘都有收获。" },
  { animal: "松鼠", trait: "未雨绸缪", reason: "为未来积攒好运。" },
  { animal: "大象", trait: "稳重可靠", reason: "每一步都走得踏踏实实。" },
  { animal: "白鲸", trait: "治愈天使", reason: "你的笑容是最好的良药。" },
  { animal: "梅花鹿", trait: "灵性优雅", reason: "保持内心的纯净与美好。" },
  { animal: "柯基", trait: "元气满满", reason: "快乐的小短腿跑向未来。" },
  { animal: "萨摩耶", trait: "微笑天使", reason: "温暖的笑容融化冰雪。" },
  { animal: "金毛", trait: "暖心大白", reason: "永远给你最忠诚的陪伴。" },
  { animal: "羊驼", trait: "个性十足", reason: "做不一样的烟火。" },
  { animal: "独角兽", trait: "梦幻纯真", reason: "相信奇迹，奇迹就会发生。" },
  { animal: "火烈鸟", trait: "热情奔放", reason: "活出色彩，活出精彩。" },
  { animal: "海獭", trait: "牵手睡觉", reason: "不论何时，都要抓住爱的人。" },
  { animal: "袋鼠", trait: "勇往直前", reason: "生活就是不断跳跃向前。" },
  { animal: "北极熊", trait: "强大温柔", reason: "外表强悍，内心柔软。" },
  { animal: "刺猬", trait: "自我保护", reason: "有软肋，也有铠甲。" }
];

const LOCAL_FOODS = [
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
  { food: "章鱼小丸子", reason: "外焦里嫩，一口一个满足。" },
  { food: "芒果班戟", reason: "柔软的外皮包裹着甜蜜的惊喜。" },
  { food: "桂花糕", reason: "淡雅的清香，是秋天的馈赠。" },
  { food: "黑森林蛋糕", reason: "醇厚的巧克力与酸甜樱桃的完美邂逅。" },
  { food: "珍珠奶茶", reason: "咀嚼的快乐，谁喝谁知道。" },
  { food: "寿喜锅", reason: "咕嘟咕嘟的声音，是幸福在冒泡。" },
  { food: "鳗鱼饭", reason: "软糯鲜香，每一口都是享受。" },
  { food: "凯撒沙拉", reason: "轻盈健康，给身体减个负。" },
  { food: "罗宋汤", reason: "酸甜开胃，暖身又暖心。" },
  { food: "华夫饼", reason: "格子里藏着甜蜜的秘密。" },
  { food: "雪媚娘", reason: "白白胖胖，软糯到心里。" },
];

const LOCAL_ACTIVITIES = [
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
  { action: "擦鞋子", benefit: "脚踏实地，从整洁开始。" },
  { action: "观察路人", benefit: "每个人都是一本书，阅读人生百态。" },
  { action: "拍一张照片", benefit: "定格此刻的美好，留住时间。" },
  { action: "闭目养神", benefit: "短暂的抽离，是为了更好的回归。" },
  { action: "做个鬼脸", benefit: "别太严肃，生活需要一点调皮。" },
  { action: "赞美别人", benefit: "赠人玫瑰，手有余香。" },
  { action: "听播客", benefit: "获取新知，拓宽认知的边界。" },
  { action: "跳一支舞", benefit: "无论跳得如何，享受身体的律动。" },
  { action: "拼图", benefit: "在一片片碎片中构建完整的世界。" },
  { action: "看纪录片", benefit: "探索未知的领域，保持好奇心。" },
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
  { title: "饮食男女", reason: "唯有美食与爱不可辜负。" },
  { title: "你的名字", reason: "重要的人，不想忘记的人，绝对不能忘记的人。" },
  { title: "海街日记", reason: "生活虽琐碎，但充满了爱与温情。" },
  { title: "大鱼海棠", reason: "爱一个人，攀一座山，追一个梦，不妨大胆一些。" },
  { title: "哪吒之魔童降世", reason: "我命由我不由天。" },
  { title: "霸王别姬", reason: "不疯魔不成活，极致的艺术追求。" },
  { title: "卧虎藏龙", reason: "见自己，见天地，见众生。" },
  { title: "爱乐之城", reason: "献给所有做梦的人，即使他们看起来很傻。" },
  { title: "沙丘", reason: "恐惧是思维的杀手，穿越恐惧，唯我长存。" },
  { title: "瞬息全宇宙", reason: "在所有的宇宙中，我只想和你在一起报税。" },
  { title: "玩具总动员", reason: "你救了我们，我们永远感谢你。" },
  { title: "狮子王", reason: "记住你是谁。" },
  { title: "哈利波特", reason: "决定我们成为什么样的人的，不是我们的能力，而是我们的选择。" },
  { title: "魔女宅急便", reason: "尽管也曾有消沉的时候，但我过得很好。" },
  { title: "哈尔的移动城堡", reason: "世界这么大，人生这么长，总会有这么一个人，让你想要温柔的对待。" },
  { title: "侧耳倾听", reason: "为了让我的名字出现在借书卡上，我看了好多书。" },
  { title: "借东西的小人阿莉埃蒂", reason: "你的心，是我永远的家。" },
  { title: "崖上的波妞", reason: "波妞喜欢宗介！" },
  { title: "这个杀手不太冷", reason: "生活总是这么艰辛吗？还是只有童年如此？" },
  { title: "美丽人生", reason: "早安，公主！" },
  { title: "海上钢琴师", reason: "陆地对我来说是一艘太大的船。" },
  { title: "天堂电影院", reason: "人生和电影不一样，人生辛苦多了。" },
  { title: "情书", reason: "你好吗？我很好。" },
  { title: "重庆森林", reason: "不知道从什么时候开始，在什么东西上面都有个日期。" },
  { title: "春光乍泄", reason: "不如我们从头来过。" },
  { title: "甜蜜蜜", reason: "傻丫头，回去洗个热水澡，睡个好觉。" }
];

const LOCAL_MUSIC = [
  { title: "Golden Hour", artist: "JVKE", vibe: "感受日落时分的金色浪漫。" },
  { title: "Viva La Vida", artist: "Coldplay", vibe: "史诗般的旋律，给你征服世界的力量。" },
  { title: "稻香", artist: "周杰伦", vibe: "回到最初的美好，功成名就不是目的。" },
  { title: "Try Everything", artist: "Shakira", vibe: "永不放弃，再一次尝试。" },
  { title: "Lemon", artist: "米津玄师", vibe: "苦涩后的回甘，是成长的味道。" },
  { title: "起风了", artist: "买辣椒也用券", vibe: "这一路上走走停停，顺着少年漂流的痕迹。" },
  { title: "New Boy", artist: "朴树", vibe: "是的我看见到处是阳光，快乐在城市上空飘扬。" },
  { title: "Yellow", artist: "Coldplay", vibe: "看那星光，为你闪耀。" },
  { title: "Love Story", artist: "Taylor Swift", vibe: "勇敢去爱，书写属于你的故事。" },
  { title: "Mojito", artist: "周杰伦", vibe: "麻烦给我的爱人来一杯Mojito。" },
  { title: "平凡之路", artist: "朴树", vibe: "我曾经跨过山和大海，也穿过人山人海。" },
  { title: "Summer", artist: "久石让", vibe: "那个夏天的微风，永远吹在记忆里。" },
  { title: "遇见", artist: "孙燕姿", vibe: "我遇见你是最美丽的意外。" },
  { title: "后来", artist: "刘若英", vibe: "学会如何去爱，可惜你早已远去。" },
  { title: "晴天", artist: "周杰伦", vibe: "故事的小黄花，从出生那年就飘着。" },
  { title: "Fix You", artist: "Coldplay", vibe: "光芒会指引你回家，我会治愈你。" },
  { title: "Hero", artist: "Mariah Carey", vibe: "英雄就在你心中。" },
  { title: "Imagine", artist: "John Lennon", vibe: "想象所有的人，生活在和平中。" },
  { title: "Yesterday Once More", artist: "Carpenters", vibe: "经典的旋律，永不过时。" },
  { title: "My Heart Will Go On", artist: "Céline Dion", vibe: "爱无止境，心永相随。" },
  { title: "千千阙歌", artist: "陈慧娴", vibe: "来日纵是千千阙歌，飘于远方我路上。" },
  { title: "光辉岁月", artist: "Beyond", vibe: "迎接光辉岁月，风雨中抱紧自由。" },
  { title: "海阔天空", artist: "Beyond", vibe: "原谅我这一生不羁放纵爱自由。" },
  { title: "红豆", artist: "王菲", vibe: "有时候，有时候，我会相信一切有尽头。" },
  { title: "因为爱情", artist: "陈奕迅/王菲", vibe: "因为爱情，怎么会有沧桑。" },
  { title: "简单爱", artist: "周杰伦", vibe: "我想就这样牵着你的手不放开。" },
  { title: "七里香", artist: "周杰伦", vibe: "雨下整夜，我的爱溢出就像雨水。" },
  { title: "夜曲", artist: "周杰伦", vibe: "为你弹奏萧邦的夜曲，纪念我死去的爱情。" },
  { title: "青花瓷", artist: "周杰伦", vibe: "天青色等烟雨，而我在等你。" },
  { title: "告白气球", artist: "周杰伦", vibe: "亲爱的，爱上你，从那天起。" },
  { title: "Fly Me to the Moon", artist: "Frank Sinatra", vibe: "带我去月球，让我在星辰间起舞。" },
  { title: "What a Wonderful World", artist: "Louis Armstrong", vibe: "这个世界多么美好，只要你用心感受。" },
  { title: "Perfect", artist: "Ed Sheeran", vibe: "在黑暗中慢舞，你是完美的。" },
  { title: "Shape of You", artist: "Ed Sheeran", vibe: "我爱上了你的样子。" },
  { title: "Counting Stars", artist: "OneRepublic", vibe: "不再数钱，我们来数星星。" },
  { title: "Rolling in the Deep", artist: "Adele", vibe: "即使深陷谷底，也要高歌。" },
  { title: "Someone Like You", artist: "Adele", vibe: "别担心，我会找到像你一样的人。" },
  { title: "Shallow", artist: "Lady Gaga", vibe: "在浅滩之外，我们远离伤害。" },
  { title: "City of Stars", artist: "Ryan Gosling", vibe: "星光之城，你是否只为我闪耀。" },
  { title: "Let It Go", artist: "Idina Menzel", vibe: "随它吧，随它吧，回头已没有办法。" }
];

const LOCAL_CELEBS: CelebrityMatch[] = [
  { name: "奥黛丽·赫本", desc: "优雅天使", reason: "你们都拥有一颗温暖善良的心。", romanticVibe: "灵魂共鸣" },
  { name: "周杰伦", desc: "音乐才子", reason: "感性频率一致，懂彼此的浪漫。", romanticVibe: "浪漫听众" },
  { name: "宫崎骏", desc: "造梦师", reason: "都相信童话与魔法的存在。", romanticVibe: "梦想伙伴" },
  { name: "霉霉 (Taylor Swift)", desc: "才华天后", reason: "在爱与被爱中勇敢做自己。", romanticVibe: "闪耀拍档" },
  { name: "王嘉尔", desc: "热情骑士", reason: "真诚热烈的性格一拍即合。", romanticVibe: "活力满分" },
  { name: "刘亦菲", desc: "人间仙女", reason: "淡然处世的智慧不谋而合。", romanticVibe: "清醒独立" },
  { name: "易烊千玺", desc: "沉稳少年", reason: "内心的丰富世界只有你们懂。", romanticVibe: "静谧默契" },
  { name: "Lisa", desc: "人间芭比", reason: "阳光自信的笑容会互相感染。", romanticVibe: "快乐源泉" },
  { name: "胡歌", desc: "温润君子", reason: "历经千帆归来仍是少年的赤诚。", romanticVibe: "知己之交" },
  { name: "新垣结衣", desc: "治愈女神", reason: "笑容能融化世间一切冰雪。", romanticVibe: "温暖陪伴" },
  { name: "权志龙", desc: "潮流先锋", reason: "独特的审美与个性相互吸引。", romanticVibe: "灵感缪斯" },
  { name: "艾玛·沃特森", desc: "智慧魔女", reason: "独立思考的能力让你们惺惺相惜。", romanticVibe: "智性恋人" },
  { name: "肖战", desc: "温暖学长", reason: "温柔坚定的力量感让人安心。", romanticVibe: "温柔依靠" },
  { name: "Jennie", desc: "猫系女友", reason: "慵懒中带着野性，魅力十足。", romanticVibe: "时尚伴侣" },
  { name: "基努·里维斯", desc: "孤独行者", reason: "在这个喧嚣世界中保持清醒。", romanticVibe: "深沉共鸣" },
  { name: "王一博", desc: "酷盖少年", reason: "对热爱的执着让你们互相欣赏。", romanticVibe: "热血搭档" },
  { name: "迪丽热巴", desc: "明艳玫瑰", reason: "热情开朗，生活充满欢声笑语。", romanticVibe: "甜蜜暴击" },
  { name: "抖森", desc: "英伦绅士", reason: "博学多才，交流永远充满乐趣。", romanticVibe: "优雅之恋" },
  { name: "赵丽颖", desc: "励志女神", reason: "坚韧不拔的品格相互激励。", romanticVibe: "成长伙伴" },
  { name: "甜茶", desc: "文艺忧郁", reason: "细腻的情感世界只有你能懂。", romanticVibe: "文艺知音" },
  { name: "舒淇", desc: "风情万种", reason: "随性洒脱的生活态度令人向往。", romanticVibe: "自由灵魂" },
  { name: "木村拓哉", desc: "日剧天王", reason: "一生悬命的努力令人动容。", romanticVibe: "坚定信仰" },
  { name: "全智贤", desc: "气场女王", reason: "自信的样子是最好的风景。", romanticVibe: "霸气守护" },
  { name: "安妮·海瑟薇", desc: "完美公主", reason: "无论顺境逆境都能保持优雅。", romanticVibe: "优雅同行" },
  { name: "孔刘", desc: "温暖大叔", reason: "成熟稳重的安全感正是你需要的。", romanticVibe: "安心港湾" }
];

// Seeded Random Generator for "Daily" feel
const seededRandom = (seed: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  }
};

const getRandom = <T>(arr: T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)];
const getRandomSubset = <T>(arr: T[], count: number, rng: () => number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - rng());
  return shuffled.slice(0, count);
};

export const generateFortuneReport = async (user: UserProfile): Promise<FortuneResult> => {
  const apiKey = getApiKey();
  const today = new Date().toISOString().split('T')[0];
  
  // Basic Astrology Calculation (Always Local for accuracy)
  const birthDate = new Date(user.birthDate);
  const zodiacData = getZodiacData(birthDate.getMonth() + 1, birthDate.getDate());
  const chineseZodiacData = getChineseZodiacData(birthDate.getFullYear());
  const lifePath = calculateLifePathNumber(user.birthDate);

  if (apiKey) {
    // --- API MODE ---
    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = ai.models.generateContent;
      
      const prompt = `
        You are a warm, healing, and strictly positive astrologer.
        Current Date: ${today}
        User: Name=${user.name}, DOB=${user.birthDate}, Zodiac=${zodiacData.sign}, Chinese=${chineseZodiacData.animal}, LifePath=${lifePath.number}.
        Task: Generate a "Lucky Day" report.
        Requirements:
        1. Tone: Cute, encouraging, safe, warm (Little Red Book style).
        2. DailyAffirmation: A handwritten-style positive quote.
        3. Tarot: Pick one major arcana, give POSITIVE interpretation only.
        4. AstralChart: Analyze planetary transits for TODAY for this zodiac. Include 'keyAspect' (e.g. Sun Trine Venus) and 'luckyHouse' (e.g. 5th House).
        5. Constellation: Must use CHINESE 28 MANSIONS (e.g. 角木蛟), not Western stars.
        6. LuckyFood: Comfort food, reason must be emotional/healing.
        7. LuckyActivity: FREE, simple action (e.g. hug a tree), no spending money.
        8. LuckyItems: Color, Item, Number (${lifePath.number}).
        9. CelebrityMatch: Return 5 different celebrities who match this vibe.
        10. CompatibleAnimal: A cute spirit animal.

        Output JSON schema:
        {
          "dailyAffirmation": "string",
          "tarot": { "cardName": "string", "meaning": "string", "advice": "string" },
          "astralChart": { "analysis": "string", "planetaryInfluence": "string", "keyAspect": "string", "luckyHouse": "string" },
          "mbtiAnalysis": { "type": "string (guess based on vibe if not provided)", "superpower": "string", "socialVibe": "string" },
          "constellation": { "starName": "string (Chinese 28 Mansions)", "guidance": "string" },
          "luckyItems": { "color": "string", "number": "${lifePath.number}", "item": "string" },
          "celebrityMatch": [{ "name": "string", "desc": "string", "reason": "string", "romanticVibe": "string" }],
          "luckyFood": { "food": "string", "reason": "string" },
          "luckyActivity": { "action": "string", "benefit": "string" },
          "compatibleAnimal": { "animal": "string", "trait": "string", "reason": "string" },
          "dailyMovie": { "title": "string", "reason": "string" },
          "dailyMusic": { "title": "string", "artist": "string", "vibe": "string" }
        }
      `;

      const response = await model({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        }
      });
      
      if (response.text) {
        const data = JSON.parse(response.text);
        // Merge calculated data to ensure accuracy
        return {
          ...data,
          isFallback: false,
          zodiac: zodiacData,
          chineseZodiac: chineseZodiacData,
          luckyItems: { ...data.luckyItems, number: lifePath.number } // Enforce numerology
        };
      }
    } catch (e) {
      console.warn("Gemini API failed, switching to local engine.", e);
    }
  }

  // --- LOCAL FALLBACK ENGINE (ROBUST & DAILY SEEDED) ---
  
  // Create a daily seed: Date + User Name + Zodiac
  const seedString = `${today}-${user.name}-${zodiacData.sign}`;
  const rng = seededRandom(seedString);

  const tarot = getRandom(LOCAL_TAROT, rng);
  const mansion = getRandom(LOCAL_MANSIONS, rng);
  const food = getRandom(LOCAL_FOODS, rng);
  const activity = getRandom(LOCAL_ACTIVITIES, rng);
  const movie = getRandom(LOCAL_MOVIES, rng);
  const music = getRandom(LOCAL_MUSIC, rng);
  const celebMatches = getRandomSubset(LOCAL_CELEBS, 5, rng);
  const animal = getRandom(LOCAL_ANIMALS, rng);
  const color = getRandom(LOCAL_COLORS, rng);
  const luckyObj = getRandom(LOCAL_LUCKY_OBJECTS, rng);

  return {
    isFallback: true,
    zodiac: zodiacData,
    chineseZodiac: chineseZodiacData,
    astralChart: {
      analysis: `亲爱的${user.name}，今天的星象为你点亮了${zodiacData.sign}的能量中心。这是一个适合向内探索、向外连接的好时机。宇宙正在悄悄为你铺路，你只需要保持现在的节奏，相信美好的事情即将发生。`,
      planetaryInfluence: "金星守护",
      keyAspect: "月亮六合木星",
      luckyHouse: "第五宫 (真爱宫)"
    },
    tarot: tarot,
    mbtiAnalysis: {
      type: user.mbti || "ENFP",
      superpower: "治愈系光环",
      socialVibe: "你是人群中的小太阳，温暖着身边的每一个人。"
    },
    constellation: mansion,
    luckyItems: {
      color: color,
      number: lifePath.number,
      item: luckyObj
    },
    celebrityMatch: celebMatches,
    luckyFood: food,
    luckyActivity: activity,
    compatibleAnimal: animal,
    dailyMovie: movie,
    dailyMusic: music,
    dailyAffirmation: "你不需要成为任何人，做你自己就是最棒的事情。"
  };
};

export const createGenieChat = (): Chat => {
  const apiKey = getApiKey();
  if (!apiKey) {
    // Return a mock chat object if no key
    return {
      sendMessage: async (msg: any) => ({
        text: "抱歉呀，我现在连不上宇宙信号 (API Key缺失)，无法和你聊天。不过你要相信，好运一直都在你身边！✨"
      })
    } as any;
  }
  
  const ai = new GoogleGenAI({ apiKey });
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: "You are a 'Lucky Genie' (好运小精灵). Your persona is cute, empathetic, strictly positive, and magical. You answer in Chinese. Use emojis. Keep answers short and healing.",
    }
  });
};
