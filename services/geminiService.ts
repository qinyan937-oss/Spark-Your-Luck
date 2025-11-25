
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { UserProfile, FortuneResult } from "../types";

// Helper to get API key safely
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API Key not found in environment variables");
    return "";
  }
  return key;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

/**
 * Generates the "Positivity Report" based on user profile.
 * Strictly enforces JSON output and positive vibes.
 */
export const generateFortuneReport = async (profile: UserProfile): Promise<FortuneResult> => {
  const model = "gemini-2.5-flash";
  
  const systemInstruction = `
    You are a "Lucky Engine" for the app "Lucky" (幸运点点). 
    
    CORE DIRECTIVE:
    You must act as an expert Astrologer and Fortune Teller. 
    You MUST calculate the accurate Zodiac Sign (Sun Sign) and Chinese Zodiac (Animal) based on the user's specific Birth Date provided. DO NOT guess or randomize this. 
    Example: If birth date is 1990-01-28, User is Aquarius (Zodiac) and Horse (Chinese Zodiac).
    
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
  `;

  const prompt = `
    User Profile:
    Name: ${profile.name}
    Birthday: ${profile.birthDate}
    MBTI: ${profile.mbti || "Unknown (please intuit based on birthday)"}

    Task:
    1. First, accurately determine the Zodiac Sign and Chinese Zodiac for ${profile.birthDate}.
    2. Analyze the current astrological energy for this specific person.
    3. Generate a JSON object containing a comprehensive positive analysis.
    
    CRITICAL: The 'celebrityMatch' field must be an ARRAY of 5 different objects.
    CRITICAL: In 'astralChart', provide 'keyAspect' (e.g. 'Sun Trine Jupiter') and 'luckyHouse' (e.g. '11th House') relevant to this person.
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
                starName: { type: Type.STRING, description: "A lucky star or constellation" },
                guidance: { type: Type.STRING },
              },
              required: ["starName", "guidance"],
            },
            luckyItems: {
              type: Type.OBJECT,
              properties: {
                color: { type: Type.STRING },
                number: { type: Type.STRING },
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
                   desc: { type: Type.STRING, description: "Short description like 'Gentle Poet' or 'Pop Star'" },
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
    console.error("Error generating fortune:", error);
    // Fallback data in case of API error to keep the app "safe"
    return {
      zodiac: { sign: "太阳", luckyTrait: "光芒万丈", compliment: "你就像小太阳一样温暖周围的人。" },
      astralChart: { 
        analysis: "你的星盘显示，此刻木星正温柔地驻留在你的第五宫（创造与快乐之宫），这为你带来了源源不断的灵感与好运。无论是表达自我还是享受生活，现在都是宇宙为你开绿灯的最佳时刻。", 
        planetaryInfluence: "金星正在为你加持魅力",
        keyAspect: "木星拱太阳 (Jupiter Trine Sun)",
        luckyHouse: "第五宫-创造宫"
      },
      chineseZodiac: { animal: "龙", secretStrength: "天生好运", compliment: "你拥有改变周围气氛的神奇力量。" },
      tarot: { cardName: "太阳", meaning: "纯粹的快乐与成功", advice: "大胆去展示你自己吧！" },
      mbtiAnalysis: { type: "ENFP", superpower: "感染力", socialVibe: "快乐小狗" },
      constellation: { starName: "天狼星", guidance: "指引方向的光芒就在你心中。" },
      luckyItems: { color: "金色", number: "8", item: "向日葵" },
      celebrityMatch: [
        { name: "奥黛丽·赫本", desc: "优雅的灵魂", reason: "你们都拥有一颗温暖善良的心，能发现生活细微处的美好。", romanticVibe: "灵魂共鸣" },
        { name: "小王子", desc: "B612星球的旅人", reason: "你们都保持着纯真的童心，能看懂大人看不懂的事情。", romanticVibe: "纯真守护" },
        { name: "周杰伦", desc: "音乐才子", reason: "你们的感性频率一致，都能在旋律中找到最深的情感。", romanticVibe: "浪漫听众" },
        { name: "宫崎骏", desc: "造梦师", reason: "你们都相信魔法的存在，愿意温柔地对待这个世界。", romanticVibe: "梦想伙伴" },
        { name: "林黛玉", desc: "世外仙姝", reason: "你们拥有同样细腻的感知力，能读懂风的语言。", romanticVibe: "知己" }
      ],
      luckyFood: { food: "热燕麦粥", reason: "温暖的谷物香气能抚平内心的褶皱。" },
      luckyActivity: { action: "抬头看云", benefit: "在云朵的变幻中感受自由和轻松。" },
      compatibleAnimal: { animal: "水豚", trait: "情绪稳定", reason: "今天的你拥有让人安心的治愈磁场。" },
      dailyMovie: { title: "普罗旺斯的夏天", reason: "感受阳光与亲情的治愈力量。" },
      dailyMusic: { title: "Happy", artist: "Pharrell Williams", vibe: "把快乐因子注入每一个细胞。" },
      dailyAffirmation: "我值得拥有这世间所有的美好。",
    };
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
