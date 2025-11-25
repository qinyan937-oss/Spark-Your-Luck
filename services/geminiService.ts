
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
  // Simplified logic: keep reducing until <= 9 unless it's 11, 22, 33
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = String(sum).split('').map(Number).reduce((a, b) => a + b, 0);
  }

  const numStr = String(sum);
  const meanings: Record<string, string> = {
    "1": "开创与领导",
    "2": "平衡与敏感",
    "3": "表达与创意",
    "4": "稳定与秩序",
    "5": "自由与冒险",
    "6": "关怀与责任",
    "7": "真理与智慧",
    "8": "力量与丰盛",
    "9": "人道与大爱",
    "11": "灵性启蒙 (卓越数)",
    "22": "梦想成真 (卓越数)",
    "33": "无私奉献 (卓越数)"
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

// Local Databases for Fallback
const LOCAL_TAROT = [
  { cardName: "太阳", meaning: "纯粹的快乐与成功", advice: "大胆去展示你自己吧！" },
  { cardName: "力量", meaning: "温柔而坚定的勇气", advice: "相信你内心的力量。" },
  { cardName: "星星", meaning: "希望与治愈", advice: "保持乐观，愿望即将实现。" },
  { cardName: "命运之轮", meaning: "幸运的转折点", advice: "好运正在向你转动。" },
  { cardName: "女皇", meaning: "丰盛与爱", advice: "尽情享受生活的美好吧。" },
  { cardName: "世界", meaning: "圆满与达成", advice: "你的一个重要阶段即将完美收官。" },
  { cardName: "愚人", meaning: "新的开始", advice: "保持赤子之心，勇敢迈出第一步。" },
  { cardName: "魔术师", meaning: "无限潜能", advice: "你拥有一切实现梦想所需的资源。" },
  { cardName: "恋人", meaning: "和谐与选择", advice: "跟随心的指引，做出爱的选择。" },
  { cardName: "战车", meaning: "胜利与意志", advice: "只要坚持，你就一定能赢。" }
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
  { food: "关东煮", reason: "热气腾腾的汤底治愈深夜的疲惫。" }
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
  { action: "给花浇水", benefit: "见证生命生长的微小喜悦。" }
];

const LOCAL_CELEBS: CelebrityMatch[] = [
  { name: "奥黛丽·赫本", desc: "优雅天使", reason: "你们都拥有一颗温暖善良的心。", romanticVibe: "灵魂共鸣" },
  { name: "周杰伦", desc: "音乐才子", reason: "感性频率一致，懂彼此的浪漫。", romanticVibe: "浪漫听众" },
  { name: "宫崎骏", desc: "造梦师", reason: "都相信童话与魔法的存在。", romanticVibe: "梦想伙伴" },
  { name: "小王子", desc: "星际旅人", reason: "保持着纯真，能看懂本质。", romanticVibe: "纯真守护" },
  { name: "霉霉 (Taylor Swift)", desc: "才华天后", reason: "在爱与被爱中勇敢做自己。", romanticVibe: "闪耀拍档" },
  { name: "王嘉尔", desc: "热情骑士", reason: "真诚热烈的性格一拍即合。", romanticVibe: "活力满分" },
  { name: "刘亦菲", desc: "人间仙女", reason: "淡然处世的智慧不谋而合。", romanticVibe: "清醒独立" },
  { name: "易烊千玺", desc: "沉稳少年", reason: "内心的丰富世界只有你们懂。", romanticVibe: "静谧默契" },
  { name: "Lisa", desc: "人间芭比", reason: "阳光自信的笑容会互相感染。", romanticVibe: "快乐源泉" },
  { name: "胡歌", desc: "温润君子", reason: "历经千帆归来仍是少年的赤诚。", romanticVibe: "知己之交" }
];

const LOCAL_MANSIONS = [
  { starName: "角木蛟", guidance: "如龙潜深渊，积蓄力量待时而动。" },
  { starName: "亢金龙", guidance: "刚柔并济，你的正直是最大的护身符。" },
  { starName: "心月狐", guidance: "灵动聪慧，直觉会指引你找到答案。" },
  { starName: "房日兔", guidance: "温顺善良，好人缘会为你带来贵人。" },
  { starName: "参水猿", guidance: "才华横溢，今日宜展示你的独特才艺。" },
  { starName: "井木犴", guidance: "由于条理清晰，适合处理复杂的难题。" },
  { starName: "奎木狼", guidance: "勇往直前，你的魄力能打破一切僵局。" },
  { starName: "娄金狗", guidance: "忠诚可靠，你的付出终将被温柔以待。" },
  { starName: "胃土雉", guidance: "沉稳务实，一步一个脚印便是捷径。" },
  { starName: "昴日鸡", guidance: "名声大噪，今日你的光芒无法被遮挡。" }
];

const generateLocalFortune = (profile: UserProfile): FortuneResult => {
  const date = new Date(profile.birthDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const zodiac = getZodiacData(month, day);
  const cZodiac = getChineseZodiacData(year);
  const lifePath = calculateLifePathNumber(profile.birthDate);
  const mansion = getRandom(LOCAL_MANSIONS);

  return {
    isFallback: true,
    zodiac: {
      sign: zodiac.sign,
      luckyTrait: zodiac.trait,
      compliment: zodiac.compliment
    },
    astralChart: {
      analysis: `亲爱的${zodiac.sign}，星盘显示太阳正照亮你的本命宫位，这意味着你原本的特质正在闪闪发光。无需刻意改变，做最真实的自己就能吸引好运。`,
      planetaryInfluence: `${zodiac.sign}守护星能量增强`,
      keyAspect: "太阳六合木星",
      luckyHouse: "第一宫-命宫"
    },
    chineseZodiac: cZodiac,
    tarot: getRandom(LOCAL_TAROT),
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
    celebrityMatch: getRandomSubset(LOCAL_CELEBS, 5),
    luckyFood: getRandom(LOCAL_FOODS),
    luckyActivity: getRandom(LOCAL_ACTIVITIES),
    compatibleAnimal: {
      animal: "卡皮巴拉 (水豚)",
      trait: "情绪稳定",
      reason: "它能听懂你心里的所有碎碎念。"
    },
    dailyMovie: {
      title: "白日梦想家",
      reason: "去看世界吧，去感受生活。"
    },
    dailyMusic: {
      title: "Golden Hour",
      artist: "JVKE",
      vibe: "感受日落时分的金色浪漫。"
    },
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
