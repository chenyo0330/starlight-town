/**
 * 專為 8 歲國小低年級設計的注音系統 (Bopomofo System) + 甜美女聲語音輔助 (TTS) + 音效合成器
 * 支援國字右側直排注音標註（符合台灣教育部國小低年級閱讀習慣）
 */

const BOPOMOFO_DICT = {
  // 城鎮與世界觀
  '星': 'ㄒㄧㄥ', '光': 'ㄍㄨㄤ', '鎮': 'ㄓㄣˋ', '彩': 'ㄘㄞˇ', '虹': 'ㄏㄨㄥˊ',
  '塔': 'ㄊㄚˇ', '水': 'ㄕㄨㄟˇ', '晶': 'ㄐㄧㄥ', '碎': 'ㄙㄨㄟˋ', '片': 'ㄆㄧㄢˋ',
  '夢': 'ㄇㄥˋ', '幻': 'ㄏㄨㄢˋ', '小': 'ㄒㄧㄠˇ', '魔': 'ㄇㄛˊ', '女': 'ㄋㄩˇ',
  '公': 'ㄍㄨㄥ', '主': 'ㄓㄨˇ', '飛': 'ㄈㄟ', '天': 'ㄊㄧㄢ', '貓': 'ㄇㄠ',
  '餐': 'ㄘㄢ', '廳': 'ㄊㄧㄥ', '森': 'ㄙㄣ', '林': 'ㄌㄧㄣˊ', '海': 'ㄏㄞˇ',
  '岸': 'ㄢˋ', '陽': 'ㄧㄤˊ', '公': 'ㄍㄨㄥ', '園': 'ㄩㄢˊ', '廣': 'ㄍㄨㄤˇ',
  '場': 'ㄔㄤˇ', '蘑': 'ㄇㄛˊ', '菇': 'ㄍㄨ', '屋': 'ㄨ', '島': 'ㄉㄠˇ',
  '牧': 'ㄇㄨˋ', '農': 'ㄋㄨㄥˊ', '橋': 'ㄑㄧㄠˊ', '噴': 'ㄆㄣ', '泉': 'ㄑㄩㄢˊ',

  // 角色與動物居民
  '熊': 'ㄒㄩㄥˊ', '店': 'ㄉㄧㄢˋ', '長': 'ㄓㄤˇ', '麵': 'ㄇㄧㄢˋ', '包': 'ㄅㄠ',
  '兔': 'ㄊㄨˋ', '手': 'ㄕㄡˇ', '鴨': 'ㄧㄚ', '三': 'ㄙㄢ', '花': 'ㄏㄨㄚ',
  '寵': 'ㄔㄨㄥˇ', '物': 'ㄨˋ', '夥': 'ㄏㄨㄛˇ', '伴': 'ㄅㄢˋ', '居': 'ㄐㄩ',
  '民': 'ㄇㄧㄣˊ', '客': 'ㄎㄜˋ', '人': 'ㄖㄣˊ', '代': 'ㄉㄞˋ', '理': 'ㄌㄧˇ',

  // 載具與移動
  '走': 'ㄗㄡˇ', '路': 'ㄌㄨˋ', '步': 'ㄅㄨˋ', '行': 'ㄒㄧㄥˊ', '腳': 'ㄐㄧㄠˇ',
  '踏': 'ㄊㄚˋ', '車': 'ㄔㄜ', '單': 'ㄉㄢ', '機': 'ㄐㄧ', '粉': 'ㄈㄣˇ',
  '紅': 'ㄏㄨㄥˊ', '敞': 'ㄔㄤˇ', '篷': 'ㄆㄥˊ', '獨': 'ㄉㄨˊ', '角': 'ㄐㄧㄠˇ',
  '獸': 'ㄕㄡˋ', '藍': 'ㄌㄢˊ', '色': 'ㄙㄜˋ', '汽': 'ㄑㄧˋ', '騎': 'ㄑㄧˊ',
  '上': 'ㄕㄤˋ', '下': 'ㄒㄧㄚˋ', '換': 'ㄏㄨㄢˋ', '乘': 'ㄔㄥˊ', '載': 'ㄗㄞˋ',
  '具': 'ㄐㄩˋ', '籃': 'ㄌㄢˊ', '座': 'ㄗㄨㄛˋ',

  // 食材與料理
  '草': 'ㄘㄠˇ', '莓': 'ㄇㄟˊ', '鮮': 'ㄒㄧㄢ', '奶': 'ㄋㄞˇ', '麥': 'ㄇㄞˋ',
  '冰': 'ㄅㄧㄥ', '淇': 'ㄑㄧˊ', '淋': 'ㄌㄧㄣˊ', '帕': 'ㄆㄚˋ', '菲': 'ㄈㄟ',
  '食': 'ㄕˊ', '材': 'ㄘㄞˊ', '料': 'ㄌㄧㄠˋ', '製': 'ㄓˋ', '作': 'ㄗㄨㄛˋ',
  '廚': 'ㄔㄨˊ', '房': 'ㄈㄤˊ', '櫥': 'ㄔㄨˊ', '窗': 'ㄔㄨㄤ', '營': 'ㄧㄥˊ',
  '業': 'ㄧㄝˋ', '中': 'ㄓㄨㄥ', '休': 'ㄒㄧㄡ', '息': 'ㄒㄧˊ', '親': 'ㄑㄧㄣ',
  '自': 'ㄗˋ', '動': 'ㄉㄨㄥˋ', '掛': 'ㄍㄨㄚˋ', '賣': 'ㄇㄞˋ', '出': 'ㄔㄨ',
  '份': 'ㄈㄣˋ', '金': 'ㄐㄧㄣ', '幣': 'ㄅㄧˋ', '寶': 'ㄅㄠˇ', '箱': 'ㄒㄧㄤ',
  '石': 'ㄕˊ', '領': 'ㄌㄧㄥˇ', '取': 'ㄑㄩˇ', '聘': 'ㄆㄧㄣˋ', '請': 'ㄑㄧㄥˇ',
  '擴': 'ㄎㄨㄛˋ', '建': 'ㄐㄧㄢˋ', '傘': 'ㄙㄢˇ', '桌': 'ㄓㄨㄛ', '椅': 'ㄧˇ',
  '露': 'ㄌㄨˋ', '甜': 'ㄊㄧㄢˊ', '點': 'ㄉㄧㄢˇ', '果': 'ㄍㄨㄛˇ', '醬': 'ㄐㄧㄤˋ',
  '擠': 'ㄐㄧˇ', '堆': 'ㄉㄨㄟ', '疊': 'ㄉㄧㄝˊ', '灑': 'ㄙㄚˇ', '糖': 'ㄊㄤˊ',
  '完': 'ㄨㄢˊ', '成': 'ㄔㄥˊ', '開': 'ㄎㄞ', '始': 'ㄕˇ', '庫': 'ㄎㄨˋ',
  '存': 'ㄘㄨㄣˊ', '補': 'ㄅㄨˇ', '充': 'ㄔㄨㄥ', '收': 'ㄕㄡ', '益': 'ㄧˋ',

  // 小遊戲與任務
  '任': 'ㄖㄣˋ', '務': 'ㄨˋ', '關': 'ㄍㄨㄢ', '卡': 'ㄎㄚˇ', '挑': 'ㄊㄧㄠ',
  '戰': 'ㄓㄢˋ', '遊': 'ㄧㄡˊ', '戲': 'ㄒㄧˋ', '快': 'ㄎㄨㄞˋ', '遞': 'ㄉㄧˋ',
  '幾': 'ㄐㄧˇ', '何': 'ㄏㄜˊ', '地': 'ㄉㄧˋ', '磚': 'ㄓㄨㄢ', '失': 'ㄕ',
  '蹤': 'ㄗㄨㄥ', '貝': 'ㄅㄟˋ', '殼': 'ㄎㄜˊ', '派': 'ㄆㄞˋ', '對': 'ㄉㄨㄟˋ',
  '空': 'ㄎㄨㄥ', '間': 'ㄐㄧㄢ', '反': 'ㄈㄢˇ', '應': 'ㄧㄥˋ', '軌': 'ㄍㄨㄟˇ',
  '道': 'ㄉㄠˋ', '跑': 'ㄆㄠˇ', '酷': 'ㄎㄨˋ', '躲': 'ㄉㄨㄛˇ', '避': 'ㄅㄧˋ',
  '大': 'ㄉㄚˋ', '球': 'ㄑㄧㄡˊ', '跳': 'ㄊㄧㄠˋ', '躍': 'ㄩㄝˋ', '斜': 'ㄒㄧㄝˊ',
  '坡': 'ㄆㄛ', '旋': 'ㄒㄩㄢˊ', '轉': 'ㄓㄨㄢˇ', '拼': 'ㄆㄧㄣ', '圖': 'ㄊㄨˊ',
  '束': 'ㄕㄨˋ', '水': 'ㄕㄨㄟˇ', '管': 'ㄍㄨㄢˇ', '組': 'ㄗㄨˇ', '合': 'ㄏㄜˊ',
  '紫': 'ㄗˇ', '通': 'ㄊㄨㄥ', '電': 'ㄉㄧㄢˋ', '記': 'ㄐㄧˋ', '憶': 'ㄧˋ',
  '音': 'ㄧㄣ', '律': 'ㄌㄩˋ', '符': 'ㄈㄨˊ', '順': 'ㄕㄨㄣˋ', '序': 'ㄒㄩˋ',
  '位': 'ㄨㄟˋ', '置': 'ㄓˋ', '朵': 'ㄉㄨㄛˇ', '數': 'ㄕㄨˋ', '邏': 'ㄌㄨㄛˊ',
  '輯': 'ㄐㄧˊ', '平': 'ㄆㄧㄥˊ', '衡': 'ㄏㄥˊ', '重': 'ㄓㄨㄥˋ', '量': 'ㄌㄧㄤˋ',
  '選': 'ㄒㄩㄢˇ', '相': 'ㄒㄧㄤ', '加': 'ㄐㄧㄚ', '等': 'ㄉㄥˇ', '於': 'ㄩˊ',
  '分': 'ㄈㄣ', '數': 'ㄕㄨˋ', '獎': 'ㄐㄧㄤˇ', '勵': 'ㄌㄧˋ', '過': 'ㄍㄨㄛˋ',
  '再': 'ㄗㄞˋ', '玩': 'ㄨㄢˊ', '一': 'ㄧ', '次': 'ㄘˋ', '返': 'ㄈㄢˇ',
  '回': 'ㄏㄨㄟˊ', '左': 'ㄗㄨㄛˇ', '右': 'ㄧㄡˋ', '滑': 'ㄏㄨㄚˊ', '點': 'ㄉㄧㄢˇ',
  '擊': 'ㄐㄧˊ', '按': 'ㄢˋ', '鈕': 'ㄋㄧㄡˇ', '發': 'ㄈㄚ', '射': 'ㄕㄜˋ',
  '檢': 'ㄐㄧㄢˇ', '查': 'ㄔㄚˊ', '清': 'ㄑㄧㄥ', '除': 'ㄔㄨˊ', '目': 'ㄇㄨˋ',
  '標': 'ㄅㄧㄠ', '題': 'ㄊㄧˊ', '第': 'ㄉㄧˋ', '波': 'ㄅㄛ', '秒': 'ㄇㄧㄠˇ',

  // 換裝系統
  '衣': 'ㄧ', '櫥': 'ㄔㄨˊ', '裝': 'ㄓㄨㄤ', '頭': 'ㄊㄡˊ', '飾': 'ㄕˋ',
  '服': 'ㄈㄨˊ', '鞋': 'ㄒㄧㄝˊ', '子': 'ㄗ˙', '翅': 'ㄔˋ', '膀': 'ㄅㄤˇ',
  '帽': 'ㄇㄠˋ', '安': 'ㄢ', '全': 'ㄑㄩㄢˊ', '皇': 'ㄏㄨㄤˊ', '冠': 'ㄍㄨㄢ',
  '耳': 'ㄦˇ', '髮': 'ㄈㄚˇ', '箍': 'ㄍㄨ', '蓬': 'ㄆㄥˊ', '裙': 'ㄑㄩㄣˊ',
  '圍': 'ㄨㄟˊ', '禮': 'ㄌㄧˇ', '短': 'ㄉㄨㄢˇ', '靴': 'ㄒㄩㄝ', '芭': 'ㄅㄚ',
  '蕾': 'ㄌㄟˇ', '仙': 'ㄒㄧㄢ', '薄': 'ㄅㄛˊ', '紗': 'ㄕㄚ', '羽': 'ㄩˇ',
  '翼': 'ㄧˋ', '蝴': 'ㄏㄨˊ', '蝶': 'ㄉㄧㄝˊ', '結': 'ㄐㄧㄝˊ', '紳': 'ㄕㄣ',
  '士': 'ㄕˋ', '高': 'ㄍㄠ', '項': 'ㄒㄧㄤˋ', '圈': 'ㄑㄩㄢ', '環': 'ㄏㄨㄢˊ',
  '試': 'ㄕˋ', '穿': 'ㄔㄨㄢ', '顏': 'ㄧㄢˊ', '調': 'ㄊㄧㄠˊ', '盤': 'ㄆㄢˊ',
  '舞台': 'ㄨˇ', '舞': 'ㄨˇ', '台': 'ㄊㄞˊ', '歡': 'ㄏㄨㄢ', '呼': 'ㄏㄨ',
  '已': 'ㄧˇ', '穿': 'ㄔㄨㄢ', '戴': 'ㄉㄞˋ', '解': 'ㄐㄧㄝˇ', '鎖': 'ㄙㄨㄛˇ',

  // 常用對話與動詞
  '去': 'ㄑㄩˋ', '採': 'ㄘㄞˇ', '些': 'ㄒㄧㄝ', '吧': 'ㄅㄚ˙', '好': 'ㄏㄠˇ',
  '的': 'ㄉㄜ˙', '呀': 'ㄧㄚ˙', '哇': 'ㄨㄚ', '太': 'ㄊㄞˋ', '棒': 'ㄅㄤˋ',
  '了': 'ㄌㄜ˙', '謝': 'ㄒㄧㄝˋ', '你': 'ㄋㄧˇ', '我': 'ㄨㄛˇ', '們': 'ㄇㄣ˙',
  '幫': 'ㄅㄤ', '助': 'ㄓㄨˋ', '找': 'ㄓㄠˇ', '到': 'ㄉㄠˋ', '囉': 'ㄌㄨㄛ˙',
  '喵': 'ㄇㄧㄠ', '嗚': 'ㄨ', '歡': 'ㄏㄨㄢ', '迎': 'ㄧㄥˊ', '來': 'ㄌㄞˊ',
  '現': 'ㄒㄧㄢˋ', '在': 'ㄗㄞˋ', '可': 'ㄎㄜˇ', '以': 'ㄧˇ', '裡': 'ㄌㄧˇ',
  '有': 'ㄧㄡˇ', '許': 'ㄒㄩˇ', '多': 'ㄉㄨㄛ', '美味': 'ㄇㄟˇ', '美': 'ㄇㄟˇ',
  '味': 'ㄨㄟˋ', '喔': 'ㄛ˙', '喔': 'ㄛ˙', '前': 'ㄑㄧㄢˊ', '往': 'ㄨㄤˇ',
  '互': 'ㄏㄨˋ', '動': 'ㄉㄨㄥˋ', '地': 'ㄉㄧˋ', '設': 'ㄕㄜˋ', '定': 'ㄉㄧㄥˋ',
  '血': 'ㄒㄧㄝˇ', '經': 'ㄐㄧㄥ', '驗': 'ㄧㄢˋ', '級': 'ㄐㄧˊ', '體': 'ㄊㄧˇ',
  '力': 'ㄌㄧˋ', '朗': 'ㄌㄤˇ', '讀': 'ㄉㄨˊ', '語': 'ㄩˇ', '關閉': 'ㄍㄨㄢ',
  '閉': 'ㄅㄧˋ', '新': 'ㄒㄧㄣ', '獲': 'ㄏㄨㄛˋ', '得': 'ㄉㄜˊ', '真': 'ㄓㄣ',
  '厲': 'ㄌㄧˋ', '害': 'ㄏㄞˋ', '繼': 'ㄐㄧˋ', '續': 'ㄒㄩˋ', '努': 'ㄋㄨˇ',
  '加油': 'ㄐㄧㄚ', '油': 'ㄧㄡˊ', '讓': 'ㄖㄤˋ', '恢': 'ㄏㄨㄟ', '復': 'ㄈㄨˋ',
  '色彩': 'ㄙㄜˋ', '愛': 'ㄞˋ', '心': 'ㄒㄧㄣ', '閃': 'ㄕㄢˇ', '亮': 'ㄌㄧㄤˋ',
  '黃': 'ㄏㄨㄤˊ', '綠': 'ㄌㄩˋ', '橘': 'ㄐㄩˊ', '白': 'ㄅㄞˊ', '黑': 'ㄏㄟ',
  '免費': 'ㄇㄧㄢˇ', '免': 'ㄇㄧㄢˇ', '費': 'ㄈㄟˋ', '購': 'ㄍㄡˋ', '買': 'ㄇㄞˇ',
  '足': 'ㄗㄨˊ', '夠': 'ㄍㄡˋ', '還': 'ㄏㄞˊ', '差': 'ㄔㄚ', '個': 'ㄍㄜ˙',
  '顆': 'ㄎㄜ', '座': 'ㄗㄨㄛˋ', '位': 'ㄨㄟˋ', '跟': 'ㄍㄣ', '隨': 'ㄙㄨㄟˊ',
  '隱': 'ㄧㄣˇ', '藏': 'ㄘㄤˊ', '附': 'ㄈㄨˋ', '近': 'ㄐㄧㄣˋ', '提': 'ㄊㄧˊ',
  '示': 'ㄕˋ', '秘': 'ㄇㄧˋ', '密': 'ㄇㄧˋ', '收': 'ㄕㄡ', '集': 'ㄐㄧˊ',
  '進': 'ㄐㄧㄣˋ', '入': 'ㄖㄨˋ', '出': 'ㄔㄨ', '發': 'ㄈㄚ', '探': 'ㄊㄢˋ',
  '索': 'ㄙㄨㄛˇ', '冒': 'ㄇㄠˋ', '險': 'ㄒㄧㄢˇ', '煮': 'ㄓㄨˇ', '烘': 'ㄏㄨㄥ',
  '焙': 'ㄅㄟˋ', '香': 'ㄒㄧㄤ', '甜': 'ㄊㄧㄢˊ', '脆': 'ㄘㄨㄟˋ', '軟': 'ㄖㄨㄢˇ',
  '綿': 'ㄇㄧㄢˊ', '尾': 'ㄨㄟˇ', '巴': 'ㄅㄚ', '戴': 'ㄉㄞˋ', '坐': 'ㄗㄨㄛˋ',
  '後': 'ㄏㄡˋ', '拾': 'ㄕˊ', '寶': 'ㄅㄠˇ'
};

// 破音字詞組優先覆蓋表 (Context-aware phrase overrides)
const PHRASE_OVERRIDES = [
  { word: '小魔女', zhuyin: ['ㄒㄧㄠˇ', 'ㄇㄛˊ', 'ㄋㄩˇ'] },
  { word: '星光鎮', zhuyin: ['ㄒㄧㄥ', 'ㄍㄨㄤ', 'ㄓㄣˋ'] },
  { word: '星光碎片', zhuyin: ['ㄒㄧㄥ', 'ㄍㄨㄤ', 'ㄙㄨㄟˋ', 'ㄆㄧㄢˋ'] },
  { word: '熊熊店長', zhuyin: ['ㄒㄩㄥˊ', 'ㄒㄩㄥˊ', 'ㄉㄧㄢˋ', 'ㄓㄤˇ'] },
  { word: '採些草莓', zhuyin: ['ㄘㄞˇ', 'ㄒㄧㄝ', 'ㄘㄠˇ', 'ㄇㄟˊ'] },
  { word: '店長', zhuyin: ['ㄉㄧㄢˋ', 'ㄓㄤˇ'] },
  { word: '長大', zhuyin: ['ㄓㄤˇ', 'ㄉㄚˋ'] },
  { word: '長長', zhuyin: ['ㄔㄤˊ', 'ㄔㄤˊ'] },
  { word: '音樂', zhuyin: ['ㄧㄣ', 'ㄩㄝˋ'] },
  { word: '快樂', zhuyin: ['ㄎㄨㄞˋ', 'ㄌㄜˋ'] },
  { word: '歡樂', zhuyin: ['ㄏㄨㄢ', 'ㄌㄜˋ'] },
  { word: '數理', zhuyin: ['ㄕㄨˋ', 'ㄌㄧˇ'] },
  { word: '數字', zhuyin: ['ㄕㄨˋ', 'ㄗˋ'] },
  { word: '旋轉', zhuyin: ['ㄒㄩㄢˊ', 'ㄓㄨㄢˇ'] },
  { word: '轉圈', zhuyin: ['ㄓㄨㄢˋ', 'ㄑㄩㄢ'] },
  { word: '鞋子', zhuyin: ['ㄒㄧㄝˊ', 'ㄗ˙'] },
  { word: '石子', zhuyin: ['ㄕˊ', 'ㄗˇ'] },
  { word: '車子', zhuyin: ['ㄔㄜ', 'ㄗ˙'] },
  { word: '桌子', zhuyin: ['ㄓㄨㄛ', 'ㄗ˙'] },
  { word: '椅子', zhuyin: ['ㄧˇ', 'ㄗ˙'] },
  { word: '帽子', zhuyin: ['ㄇㄠˋ', 'ㄗ˙'] },
  { word: '小貓', zhuyin: ['ㄒㄧㄠˇ', 'ㄇㄠ'] },
  { word: '幾何', zhuyin: ['ㄐㄧˇ', 'ㄏㄜˊ'] },
  { word: '幾個', zhuyin: ['ㄐㄧˇ', 'ㄍㄜ˙'] },
  { word: '營業中', zhuyin: ['ㄧㄥˊ', 'ㄧㄝˋ', 'ㄓㄨㄥ'] },
  { word: '敞篷車', zhuyin: ['ㄔㄤˇ', 'ㄆㄥˊ', 'ㄔㄜ'] },
  { word: '腳踏車', zhuyin: ['ㄐㄧㄠˇ', 'ㄊㄚˋ', 'ㄔㄜ'] },
  { word: '冰淇淋', zhuyin: ['ㄅㄧㄥ', 'ㄑㄧˊ', 'ㄌㄧㄣˊ'] },
  { word: '草莓', zhuyin: ['ㄘㄠˇ', 'ㄇㄟˊ'] },
  { word: '麻煩', zhuyin: ['ㄇㄚˊ', 'ㄈㄢ˙'] },
  { word: '東西', zhuyin: ['ㄉㄨㄥ', 'ㄒㄧ˙'] },
  { word: '地方', zhuyin: ['ㄉㄧˋ', 'ㄈㄤ'] },
  { word: '地面', zhuyin: ['ㄉㄧˋ', 'ㄇㄧㄢˋ'] },
  { word: '地磚', zhuyin: ['ㄉㄧˋ', 'ㄓㄨㄢ'] },
  { word: '地圖', zhuyin: ['ㄉㄧˋ', 'ㄊㄨˊ'] }
];

/**
 * 將單一注音字串拆分為「聲母/介音/韻母」與「聲調符號」
 * 支援國小標準直式注音排版（聲調在韻母右方，輕聲 ˙ 在最上方）
 */
function formatZhuyinParts(zy) {
  if (!zy) return { body: '', tone: '', isLight: false };
  const isLight = zy.includes('˙');
  let tone = '';
  if (zy.includes('ˊ')) tone = 'ˊ';
  else if (zy.includes('ˇ')) tone = 'ˇ';
  else if (zy.includes('ˋ')) tone = 'ˋ';

  const body = zy.replace(/[ˊˇˋ˙]/g, '');
  return { body, tone, isLight };
}

/**
 * 將中文文字轉為帶有右側直排注音的 HTML 字串
 * @param {string} text 輸入文字
 * @returns {string} HTML string with <span class="zy-word">...</span>
 */
function toBopomofoHTML(text) {
  if (!text) return '';
  const str = String(text);
  const n = str.length;
  const zhuyinArr = new Array(n).fill(null);

  // 1. 先套用詞組覆蓋
  for (const item of PHRASE_OVERRIDES) {
    let idx = str.indexOf(item.word);
    while (idx !== -1) {
      for (let k = 0; k < item.word.length; k++) {
        zhuyinArr[idx + k] = item.zhuyin[k];
      }
      idx = str.indexOf(item.word, idx + 1);
    }
  }

  // 2. 逐字查表並生成直排注音標籤
  let html = '';
  for (let i = 0; i < n; i++) {
    const ch = str[i];
    const zy = zhuyinArr[i] || BOPOMOFO_DICT[ch];
    if (zy) {
      const { body, tone, isLight } = formatZhuyinParts(zy);
      const charsHtml = body.split('').map(c => `<span class="zy-phonetic">${c}</span>`).join('');
      const lightHtml = isLight ? `<span class="zy-light">˙</span>` : '';
      const toneHtml = tone ? `<span class="zy-tone">${tone}</span>` : '';
      html += `<span class="zy-char"><span class="zy-hanzi">${ch}</span><span class="zy-ruby">${lightHtml}<span class="zy-col">${charsHtml}</span>${toneHtml}</span></span>`;
    } else if (ch === '\n') {
      html += '<br/>';
    } else {
      html += `<span class="zy-plain">${ch}</span>`;
    }
  }
  return html;
}

/**
 * 甜美女聲語音輔助 (TTS) + 音效合成系統
 */
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.muted = false;
    this.voices = [];
    this.initTTS();
  }

  initTTS() {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        this.voices = window.speechSynthesis.getVoices();
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * 朗讀中文句子（甜美女聲 TTS）
   */
  speak(text) {
    this.ensureContext();
    this.playChime(660, 0.08);
    if (!('speechSynthesis' in window)) return;

    // 過濾掉表情符號與特殊符號以確保自然發音
    const cleanText = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9，。！？、～~]/g, ' ');
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = 'zh-TW';
    utter.pitch = 1.35; // 甜美可愛女聲語調
    utter.rate = 0.92;  // 適合 8 歲小朋友聽清楚的語速

    // 優先挑選台灣繁體中文女聲 (如 HsiaoChen, Hanhan, Yating, Mei-Jia)
    const zhVoices = this.voices.filter(v => v.lang.includes('zh-TW') || v.lang.includes('zh_TW') || v.lang.includes('zh'));
    const preferred = zhVoices.find(v => /HsiaoChen|Yating|Mei-Jia|Hanhan|Female|Google 國語/i.test(v.name)) || zhVoices[0];
    if (preferred) utter.voice = preferred;

    window.speechSynthesis.speak(utter);
  }

  playChime(freq = 523.25, duration = 0.15, type = 'sine', vol = 0.14) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playCoin() {
    this.playChime(987.77, 0.09, 'triangle', 0.15);
    setTimeout(() => this.playChime(1318.51, 0.22, 'triangle', 0.15), 75);
  }

  playStar() {
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((f, i) => {
      setTimeout(() => this.playChime(f, 0.2, 'sine', 0.12), i * 65);
    });
  }

  playMeow() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.linearRampToValueAtTime(920, now + 0.12);
    osc.frequency.linearRampToValueAtTime(540, now + 0.35);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.37);
  }

  playNote(noteIndex) {
    // 大調音階 Do Re Mi Fa Sol La Ti Do'
    const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50];
    const freq = scale[noteIndex % scale.length];
    this.playChime(freq, 0.32, 'triangle', 0.18);
  }

  playFanfare() {
    const melody = [
      { f: 523.25, t: 0, d: 0.15 },
      { f: 659.25, t: 130, d: 0.15 },
      { f: 783.99, t: 260, d: 0.15 },
      { f: 1046.50, t: 390, d: 0.4 }
    ];
    melody.forEach(n => {
      setTimeout(() => this.playChime(n.f, n.d, 'triangle', 0.16), n.t);
    });
  }

  toggleBGM() {
    this.ensureContext();
    if (this.bgmPlaying) {
      this.bgmPlaying = false;
      if (this.bgmTimer) clearInterval(this.bgmTimer);
      return false;
    } else {
      this.bgmPlaying = true;
      const musicBoxNotes = [
        523.25, 659.25, 783.99, 659.25,
        880.00, 783.99, 659.25, 587.33,
        523.25, 587.33, 659.25, 783.99,
        659.25, 587.33, 523.25, 392.00
      ];
      let step = 0;
      this.bgmTimer = setInterval(() => {
        if (!this.bgmPlaying || this.muted) return;
        const f = musicBoxNotes[step % musicBoxNotes.length];
        this.playChime(f, 0.45, 'sine', 0.045);
        step++;
      }, 420);
      return true;
    }
  }
}

window.Bopomofo = {
  toHTML: toBopomofoHTML,
  DICT: BOPOMOFO_DICT
};
window.Sound = new SoundSystem();
