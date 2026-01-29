export async function loadRules(url = "./bot_rules.json") {
  const data = await fetch(url).then((r) => r.json());
  return data;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalize(s) {
  return (s ?? "").toString().trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanEntityName(name) {
  let t = normalize(name).replace(/[?!.,~]+$/g, "");
  if (!t) return "";
  const particles = ["은", "는", "이", "가", "을", "를", "랑", "하고", "도"];
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of particles) {
      if (t.length > 2 && t.endsWith(p)) {
        t = t.slice(0, -p.length);
        changed = true;
        break;
      }
    }
  }
  return t;
}

function cleanUserName(name) {
  let t = normalize(name).replace(/[?!.,~]+$/g, "");
  if (!t) return "";
  t = t.replace(/(이야|야|입니다|이에요|예요)$/g, "");
  t = cleanEntityName(t);
  return t;
}

function extractLooseName(input) {
  const normalized = normalize(input);
  if (!normalized) return "";
  const cleaned = normalized.replace(/[^\p{L}\p{N}_]+/gu, " ").trim();
  if (!cleaned) return "";
  const parts = cleaned.split(/\s+/);
  if (parts.length !== 1) return "";
  const token = parts[0];
  if (!/^[\uAC00-\uD7A3a-zA-Z0-9_]{2,12}$/.test(token)) return "";
  return cleanUserName(token);
}

function isCallName(input, petName) {
  const base = normalize(petName).replace(/\s+/g, "");
  if (!base) return false;
  const cleaned = normalize(input).replace(/\s+/g, "").replace(/[!?.~]+$/g, "");
  if (!cleaned) return false;
  if (cleaned === base || cleaned === `${base}아` || cleaned === `${base}야`) return true;
  if (!cleaned.startsWith(base)) return false;
  const remainder = cleaned.slice(base.length);
  if (!remainder) return true;
  if (/^(아|야)+$/.test(remainder)) return true;
  const lastChar = base.slice(-1);
  const patterns = [
    `${lastChar}`,
    `${lastChar}${lastChar}`,
    `${lastChar}아`,
    `${lastChar}야`,
    `${lastChar}${lastChar}아`,
    `${lastChar}${lastChar}야`,
  ];
  return patterns.includes(remainder);
}

function extractEntityIntro(input) {
  const t = normalize(input);
  if (!t) return "";
  let m = t.match(
    /([가-힣a-zA-Z0-9_]{2,12})\s*라는\s*(?:친구|사람|동생|형|누나|오빠|별명)?\s*(?:가|이)?\s*(?:있어|있거든|있는데|있음)?/
  );
  if (m) return cleanEntityName(m[1]);
  m = t.match(/친구\s*이름\s*(?:은|:)?\s*([가-힣a-zA-Z0-9_]{2,12})/);
  if (m) return cleanEntityName(m[1]);
  m = t.match(/친구가\s*([가-힣a-zA-Z0-9_]{2,12})(?:이야|야|입니다)?/);
  if (m) return cleanEntityName(m[1]);
  return "";
}

function extractEntityQueryName(input) {
  const t = normalize(input);
  if (!t) return "";
  const queryRe =
    /([가-힣a-zA-Z0-9_]{2,12})(?:은|는|이|가)?\s*(?:누구(?:야|냐|라|라고|였|였지|더라|였더라)?|뭐(?:야|냐)?|어떤|뭔데)(?:\s|[?!.~]|$)/;
  let m = t.match(queryRe);
  if (m) {
    const name = cleanEntityName(m[1]);
    if (name && !isPronounName(name)) return name;
  }

  if (/(누구|뭐|어떤|뭔데)/.test(t)) {
    const parts = t.split(/누구|뭐|어떤|뭔데/);
    const prefix = parts[0] ?? "";
    const tokens = prefix.trim().split(/\s+/);
    const skipTokens = new Set(["은", "는", "이", "가", "을", "를", "랑", "하고", "도"]);
    for (let i = tokens.length - 1; i >= 0; i -= 1) {
      let token = tokens[i].replace(/[^\p{L}\p{N}_]/gu, "");
      if (!token || token.length < 2) continue;
      if (skipTokens.has(token)) continue;
      const name = cleanEntityName(token);
      if (name && !isPronounName(name)) return name;
    }
  }
  return "";
}

function extractEntityDefinition(input, name) {
  const t = normalize(input);
  if (!t) return "";
  const nameRe = new RegExp(`${escapeRegExp(name)}\\s*(?:은|는|이|가|랑|하고|도)?\\s*(.+)`);
  const m = t.match(nameRe);
  if (m && m[1]) return m[1].trim();
  return t;
}

function rememberEntity(ctx, name, desc) {
  if (!ctx.entities) ctx.entities = {};
  const cleaned = cleanEntityName(name);
  if (!cleaned) return;
  ctx.entities[cleaned] = desc;
}

function getEntityDesc(ctx, name) {
  const cleaned = cleanEntityName(name);
  return ctx.entities?.[cleaned] ?? "";
}

function isPronounName(name) {
  const pronounRe = /^(나|너|우리|너희|그|그녀|그놈|그애|걔|이것|저것|그것|이거|저거|그거)$/i;
  const t = cleanEntityName(name);
  if (pronounRe.test(t)) return true;
  const raw = normalize(name).replace(/[?!.,~]+$/g, "");
  const particles = ["은", "는", "이", "가", "을", "를", "랑", "하고", "도"];
  let stripped = raw;
  for (const p of particles) {
    if (raw.endsWith(p) && raw.length > p.length) {
      stripped = raw.slice(0, -p.length);
      break;
    }
  }
  return pronounRe.test(stripped);
}

function isSelfQuery(input) {
  const t = normalize(input);
  return /(내\s*이름|내이름|내가\s*누구|나는\s*누구|나\s*누구야)/.test(t);
}

function looksLikeNameSet(input) {
  const t = normalize(input);
  if (!t) return false;
  if (/(내\s*이름|이름은)/.test(t)) return true;
  return /^나는\s*[가-힣a-zA-Z0-9_]{1,12}(?:이야|야|입니다|이에요|예요)$/.test(t);
}

function extractEntityStatement(input) {
  let t = normalize(input);
  if (!t) return null;
  if (t.includes("누구")) return null;
  if (t.includes("이름")) return null;
  t = t.replace(/^(근데|그리고|아니|사실)\s*/g, "");
  let m = t.match(/^([가-힣a-zA-Z0-9_]{2,12})\s*(?:은|는|이|가)?\s*(.+)$/);
  if (m) {
    const name = cleanEntityName(m[1]);
    const desc = m[2]?.trim();
    if (name && desc && isDefinitionLike(desc)) return { name, desc };
  }
  m = t.match(
    /^([가-힣a-zA-Z0-9_]{2,12})\s*라는\s*(?:친구|사람|동생|형|누나|오빠|별명)\s*은\s*(.+)$/
  );
  if (m) {
    const name = cleanEntityName(m[1]);
    const desc = m[2]?.trim();
    if (name && desc && isDefinitionLike(desc)) return { name, desc };
  }
  return null;
}

function isDefinitionLike(desc) {
  const t = normalize(desc);
  if (!t) return false;
  if (/(이야|야|이다|입니다|이에요|예요)$/.test(t)) return true;
  if (/(친구|사람|동생|형|누나|오빠|엄마|아빠|강아지|고양이|별명)$/.test(t)) return true;
  return false;
}

function formatEntityDesc(desc) {
  const t = normalize(desc);
  if (!t) return "";
  if (isDefinitionLike(t)) return t;
  if (/\s/.test(t)) return t;
  const withCopula = hasJongseong(t) ? "이야" : "야";
  return `${t}${withCopula}`;
}

function normalizeTeachKey(text) {
  return normalize(text)
    .replace(/[?!.,~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTeachPair(input) {
  const t = normalize(input);
  if (!t) return null;
  let m = t.match(/^(.+?)\s*라고\s*하면\s*(.+)$/);
  if (m) {
    const key = normalizeTeachKey(m[1]);
    const value = normalize(m[2]);
    if (!key || !value) return null;
    return { key, value };
  }
  m = t.match(/^(.+?)\s*=\s*(.+)$/);
  if (!m) return null;
  const key = normalizeTeachKey(m[1]);
  const value = normalize(m[2]);
  if (!key || !value) return null;
  return { key, value };
}

function teachPrompt() {
  return "예시로 알려줘: `사용자말 = 답변`";
}

function saveTeachPair(ctx, key, value) {
  if (!ctx.teachPairs) ctx.teachPairs = {};
  ctx.teachPairs[key] = value;
  const entityName = extractEntityQueryName(key);
  if (entityName) {
    const formatted = formatEntityDesc(value);
    rememberEntity(ctx, entityName, formatted);
  }
}

function lookupTeachPair(ctx, input) {
  const key = normalizeTeachKey(input);
  return ctx.teachPairs?.[key] ?? "";
}

function pickRuleReplyById(db, id, ctx, lastText) {
  const rule = Array.isArray(db.rules) ? db.rules.find((r) => r.id === id) : null;
  if (!rule) return "";
  return pickRendered(rule.replies, ctx, lastText);
}

function pickTopicFollowUp(ctx, lastText) {
  const pool = ctx.lastTopicFollowUps;
  if (!Array.isArray(pool) || pool.length === 0) return "";
  const used = new Set(ctx.lastTopicFollowUpsUsed ?? []);
  const options = pool.filter((q) => !used.has(q));
  const pickFrom = options.length ? options : pool;
  const follow = pickRendered(pickFrom, ctx, lastText);
  if (follow) {
    const nextUsed = Array.isArray(ctx.lastTopicFollowUpsUsed) ? ctx.lastTopicFollowUpsUsed : [];
    ctx.lastTopicFollowUpsUsed = Array.from(new Set([...nextUsed, follow]));
  }
  return follow;
}

function hasJongseong(word) {
  const last = word?.[word.length - 1];
  if (!last) return false;
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function withSubject(word) {
  return `${word}${hasJongseong(word) ? "이" : "가"}`;
}

function withTopic(word) {
  return `${word}${hasJongseong(word) ? "은" : "는"}`;
}

function pickNameSetReply(db) {
  const rule = Array.isArray(db.rules) ? db.rules.find((r) => r.id === "name_set") : null;
  const pool = rule?.replies ?? db.meta?.nameOnlyReplies ?? [];
  return pool.length ? pick(pool) : "{name}! 반가워.";
}

function contextOk(rule, ctx) {
  if (!rule.context) return true;
  const { poopMin } = rule.context;
  if (typeof poopMin === "number" && (ctx.poopCount ?? 0) < poopMin) return false;
  const { lastTopic } = rule.context;
  if (lastTopic && ctx.lastTopic !== lastTopic) return false;
  return true;
}

function renderTemplate(text, ctx) {
  const name = ctx.userName ?? "친구";
  const petName = ctx.petName ?? "펫";
  const mood = ctx.mood ?? "neutral";
  const time = ctx.timeOfDay ?? "";
  const timeNow = ctx.nowTime ?? "";
  const dateToday = ctx.todayDate ?? "";
  const weekdayToday = ctx.todayDay ?? "";
  const lastUser = ctx.lastUserMsg ?? "";
  const lastBot = ctx.lastBotMsg ?? "";
  const echo = ctx.echo ?? "";
  return text
    .replaceAll("{name}", name)
    .replaceAll("{pet_name}", petName)
    .replaceAll("{mood}", mood)
    .replaceAll("{time}", time)
    .replaceAll("{time_now}", timeNow)
    .replaceAll("{date_today}", dateToday)
    .replaceAll("{weekday_today}", weekdayToday)
    .replaceAll("{last}", lastUser)
    .replaceAll("{last_user}", lastUser)
    .replaceAll("{last_bot}", lastBot)
    .replaceAll("{echo}", echo);
}

function pickRendered(replies, templateCtx, lastText) {
  if (!Array.isArray(replies) || replies.length === 0) return "";
  const rendered = replies.map((r) => renderTemplate(r, templateCtx)).filter(Boolean);
  if (rendered.length === 0) return "";
  const last = lastText ?? "";
  if (!last) return pick(rendered);
  const options = rendered.filter((r) => r !== last);
  return options.length ? pick(options) : rendered[0];
}

const LAUGH_REPLIES = [
  "ㅋㅋ 나도 웃김!",
  "헤헤 웃겨? 더 얘기해줘.",
  "나도 웃고 있어.",
  "ㅋㅋㅋ",
];
const CALL_NAME_REPLIES = [
  "응?",
  "여기 있어!",
  "불렀어?",
  "{pet_name} 여기!",
  "왜 불렀어?",
];
const SILENCE_REPLIES = [
  "괜찮아. 천천히 해도 돼.",
  "무리하지 말고, 힘들면 나랑 좀 쉬어.",
  "아무 말 안 해도 돼. 여기 있을게.",
];
const PUNCT_REPLIES = [
  "응? 무슨 일 있어?",
  "어떤 게 궁금해?",
  "헷갈리면 좀 더 알려줘.",
  "왜 그래? 말해줘.",
];
const WORD_CHAIN_WORDS = [
  "사과",
  "과자",
  "자전거",
  "거울",
  "울타리",
  "리본",
  "본능",
  "능력",
  "기차",
  "차표",
  "표정",
  "정답",
  "답장",
  "장난감",
  "감자",
  "자두",
  "두부",
  "부엌",
  "억지",
  "지갑",
  "갑옷",
  "옷장",
  "장미",
  "미로",
  "로봇",
  "봇짐",
  "짐승",
  "승리",
  "리듬",
  "듬직",
  "직업",
  "업무",
  "무지개",
  "개구리",
  "리더",
  "더치",
  "치킨",
  "킨더",
  "터미널",
  "널뛰기",
  "기린",
  "린스",
  "스케치북",
  "북극",
  "극장",
  "장갑",
  "갑자기",
  "기차역",
  "역전",
  "전기",
  "기타",
  "타이어",
  "어묵",
  "묵사발",
  "발자국",
  "국물",
  "물고기",
  "표지판",
  "판다",
  "다람쥐",
  "쥐포",
  "포도",
  "도라지",
  "지하철",
  "차례",
  "예절",
  "절반",
  "반말",
  "말미",
  "미역",
  "역장",
  "장미",
];
const TWENTY_ITEMS = [
  {
    name: "사과",
    category: "음식",
    tags: ["음식", "과일", "먹을수있어", "달아", "빨간"],
  },
  {
    name: "강아지",
    category: "동물",
    tags: ["동물", "살아있어", "네발", "짖어", "털"],
  },
  {
    name: "비행기",
    category: "탈것",
    tags: ["탈것", "날아", "금속", "엔진"],
  },
  {
    name: "연필",
    category: "물건",
    tags: ["물건", "문구", "쓰는", "나무", "길어"],
  },
  {
    name: "김치",
    category: "음식",
    tags: ["음식", "매워", "빨간", "발효"],
  },
  {
    name: "책",
    category: "물건",
    tags: ["물건", "종이", "읽어", "글자"],
  },
  {
    name: "고양이",
    category: "동물",
    tags: ["동물", "네발", "냥", "털"],
  },
  {
    name: "커피",
    category: "음료",
    tags: ["음료", "쓴", "카페인", "따뜻"],
  },
  {
    name: "버스",
    category: "탈것",
    tags: ["탈것", "바퀴", "사람많이"],
  },
  {
    name: "우산",
    category: "물건",
    tags: ["물건", "비", "접어", "손잡이"],
  },
];

function isLowContent(input) {
  const t = normalize(input);
  if (!t) return false;
  if (/^(ok|okay|no|yes|y|n)$/i.test(t)) return true;
  if (/^[?!.,~]+$/.test(t)) return true;
  if (/^[ㄱ-ㅎ]+$/.test(t)) return true;
  if (/^(응|네|예|아니|아냐|몰라|글쎄|음|음\.\.\.|ㅇㅇ|ㄴㄴ|ㄱㄱ)$/i.test(t)) return true;
  if (t.length <= 2) return true;
  return false;
}

function isVagueResponse(input) {
  const t = normalize(input);
  if (!t) return false;
  if (/^(그냥|별로|보통|애매|잘\s*모르겠어|모르겠어|딱히|그럭저럭)$/i.test(t)) {
    return true;
  }
  return /(생각\s*없어|특별\s*없어|그때그때|그런\s*편)/i.test(t);
}

function isShortAnswer(input) {
  const t = normalize(input);
  if (!t) return false;
  if (/^\d+$/.test(t)) return true;
  const words = t.split(/\s+/).filter(Boolean);
  return words.length <= 3 && t.length <= 12;
}

function isPureNoAck(input) {
  const t = normalize(input);
  return /^(아니|아냐|ㄴㄴ|그게\s*아니야)$/.test(t);
}

function isPositiveAck(input) {
  const t = normalize(input);
  return /^(응|그래|ㅇㅇ|좋아|좋지|오케이|OK|맞아|ㅇㅋ)$/i.test(t);
}

function isNegativeAck(input) {
  const t = normalize(input);
  return /^(아니|아냐|ㄴㄴ|싫어|별로|그닥|노|NO)$/i.test(t);
}

function isLaughOnly(input) {
  const t = normalize(input);
  if (!t) return false;
  return /^[ㅋㅎ]+$/.test(t);
}

function isSilence(input) {
  const t = normalize(input);
  if (!t) return false;
  return /^(\.{2,}|…+)$/.test(t);
}

function isOnlyPunct(input) {
  const t = normalize(input);
  if (!t) return false;
  return /^[?!.,~]+$/.test(t);
}

function wantsWordChain(input) {
  return /끝말잇기/.test(input);
}

function wantsTwentyQuestions(input) {
  return /(스무\s*고개|20\s*고개)/.test(input);
}

function wantsStopGame(input) {
  return /(그만|중단|끝|종료|그만하자)/.test(input);
}

function extractKoreanWord(input) {
  const m = input.match(/[가-힣]+/g);
  return m && m.length ? m[0] : "";
}

function firstHangulChar(word) {
  if (!word) return "";
  const m = word.match(/[가-힣]/);
  return m ? m[0] : "";
}

function lastHangulChar(word) {
  if (!word) return "";
  const chars = Array.from(word);
  for (let i = chars.length - 1; i >= 0; i -= 1) {
    if (/[가-힣]/.test(chars[i])) return chars[i];
  }
  return "";
}

function buildWordChainIndex() {
  const map = new Map();
  for (const w of WORD_CHAIN_WORDS) {
    const start = firstHangulChar(w);
    if (!start) continue;
    if (!map.has(start)) map.set(start, []);
    map.get(start).push(w);
  }
  return map;
}

const WORD_CHAIN_INDEX = buildWordChainIndex();

function pickWordForStart(startChar, used) {
  const list = WORD_CHAIN_INDEX.get(startChar) ?? [];
  const available = list.filter((w) => !used.has(w));
  if (!available.length) return "";
  return pick(available);
}

function startWordChain(ctx) {
  const used = new Set();
  const startWord = pick(WORD_CHAIN_WORDS);
  used.add(startWord);
  ctx.game = {
    type: "word_chain",
    lastWord: startWord,
    used: Array.from(used),
  };
  const lastChar = lastHangulChar(startWord);
  return `끝말잇기 시작! 내가 먼저: ${startWord}. "${lastChar}"로 시작해줘.`;
}

function handleWordChainTurn(input, ctx) {
  const word = extractKoreanWord(input);
  if (!word) {
    const lastChar = lastHangulChar(ctx.game.lastWord);
    return `한 단어로 말해줘. "${lastChar}"로 시작해줘.`;
  }
  const used = new Set(ctx.game.used ?? []);
  if (used.has(word)) {
    const lastChar = lastHangulChar(ctx.game.lastWord);
    return `이미 쓴 단어야. "${lastChar}"로 다른 단어!`;
  }
  const needStart = lastHangulChar(ctx.game.lastWord);
  const userStart = firstHangulChar(word);
  if (!needStart || !userStart || userStart !== needStart) {
    return `"${needStart}"로 시작해야 해. 다시 말해줄래?`;
  }
  used.add(word);
  ctx.game.lastWord = word;
  ctx.game.used = Array.from(used);
  const nextStart = lastHangulChar(word);
  const botWord = pickWordForStart(nextStart, used);
  if (!botWord) {
    ctx.game = null;
    return `와, "${nextStart}"로 이어갈 단어가 없네. 내가 졌다!`;
  }
  used.add(botWord);
  ctx.game.lastWord = botWord;
  ctx.game.used = Array.from(used);
  const nextChar = lastHangulChar(botWord);
  return `${botWord}! "${nextChar}"로 시작해줘.`;
}

function startTwentyQuestions(ctx) {
  const item = pick(TWENTY_ITEMS);
  ctx.game = {
    type: "twenty_questions",
    item,
    questionsLeft: 20,
  };
  return "스무고개 시작! 예/아니오로만 답해줘. 질문 20번 안에 맞혀봐!";
}

function answerTwentyQuestion(question, item) {
  const q = normalize(question);
  const rules = [
    { re: /동물|살아|생물/, yes: item.category === "동물" || item.tags.includes("동물") },
    { re: /음식|먹|식품/, yes: item.category === "음식" || item.tags.includes("음식") },
    { re: /탈것|타고|차|비행기|버스/, yes: item.category === "탈것" || item.tags.includes("탈것") },
    { re: /물건|도구|물체/, yes: item.category === "물건" || item.tags.includes("물건") },
    { re: /음료|마셔|마실/, yes: item.category === "음료" || item.tags.includes("음료") },
    { re: /금속|쇠/, yes: item.tags.includes("금속") },
    { re: /털/, yes: item.tags.includes("털") },
    { re: /네발|다리/, yes: item.tags.includes("네발") },
    { re: /매운/, yes: item.tags.includes("매워") || item.tags.includes("매운") },
    { re: /달아|단/, yes: item.tags.includes("달아") },
    { re: /따뜻|뜨거/, yes: item.tags.includes("따뜻") },
    { re: /차가|시원/, yes: item.tags.includes("차가운") },
    { re: /빨간|빨강/, yes: item.tags.includes("빨간") },
  ];
  for (const rule of rules) {
    if (rule.re.test(q)) {
      return rule.yes ? "응" : "아니";
    }
  }
  return "글쎄";
}

function extractGuess(input) {
  const normalized = normalize(input);
  if (!normalized) return "";
  const direct = extractKoreanWord(normalized);
  if (/^정답[:\s]?/.test(normalized)) return direct;
  if (/맞지|정답\b/.test(normalized)) return direct;
  return "";
}

function handleTwentyQuestionsTurn(input, ctx) {
  const { item } = ctx.game;
  const guess = extractGuess(input) || extractKoreanWord(input);
  if (guess && guess === item.name) {
    ctx.game = null;
    return `정답! ${item.name} 맞아. 잘했어!`;
  }
  ctx.game.questionsLeft = Math.max(0, (ctx.game.questionsLeft ?? 0) - 1);
  if (ctx.game.questionsLeft === 0) {
    ctx.game = null;
    return `질문 끝! 정답은 ${item.name}였어.`;
  }
  const yesNo = answerTwentyQuestion(input, item);
  if (yesNo === "글쎄") {
    return `그 질문은 잘 모르겠어. 질문 ${ctx.game.questionsLeft}번 남았어.`;
  }
  return `${yesNo}. 질문 ${ctx.game.questionsLeft}번 남았어.`;
}

function shouldStoreUserMsg(input) {
  const t = normalize(input);
  if (!t) return false;
  if (isLowContent(t)) return false;
  if (isSilence(t)) return false;
  return true;
}

function shouldUseEcho(input) {
  const t = normalize(input);
  if (!t) return false;
  if (t.length < 4) return false;
  if (/[?]/.test(t)) return false;
  if (/^[ㄱ-ㅎ]+$/.test(t)) return false;
  return true;
}

function pickLowContentReply(db, ctx) {
  const followUps = db.meta?.followUps ?? [];
  const reply = pickRendered(followUps, ctx, ctx.lastBotMsg);
  if (reply) return reply;
  return pickRendered(db.meta?.fallbackReplies ?? [], ctx, ctx.lastBotMsg) || "음?";
}

function appendFollowUp(text, db, intent = "") {
  if (!db.meta?.followUps?.length) return text;
  if (/[?]$/.test(text)) return text;
  const blocked = new Set([
    "greeting",
    "thanks",
    "bye",
    "no_talk",
    "no_ack",
    "dont_beg",
    "dont_know",
    "no_craving",
    "cant_explain",
    "no_context",
    "meal_check",
    "food_choice",
    "error_report",
    "fun_suggest",
    "what_options",
    "not_food",
    "schedule_query",
    "clarify_what",
    "topic_change",
    "topic_suggest",
    "name_query",
    "praise",
    "praise_request",
    "compliment",
    "love",
    "preference_query",
    "profanity",
    "entity_ask",
    "entity_retry",
    "entity_save",
    "entity_recall",
    "teach_prompt",
    "teach_retry",
    "teach_save",
    "teach_reply",
    "work_story",
    "school_story",
    "hobby_story",
    "meal_plan",
    "sleep_story",
    "family_story",
    "friend_story",
    "relationship_story",
    "travel_story",
    "money_story",
    "travel_budget",
    "breathing",
    "already_said",
    "bot_feedback",
    "work_empty",
    "mood_today",
    "anxious",
    "sad",
    "angry",
    "sleepy",
    "hungry",
    "laugh",
    "time_query",
    "date_query",
    "weekday_query",
    "recall",
    "name_set",
    "name_set_alt",
    "name_set_loose",
    "name_hint",
    "fallback",
    "low_content",
    "silence",
  ]);
  if (blocked.has(intent)) return text;
  if (Math.random() > (db.meta.followUpChance ?? 0.35)) return text;
  const suffix = pick(db.meta.followUps);
  return `${text} ${suffix}`;
}

function appendReaction(text, db) {
  if (!db.meta?.reactions?.length) return text;
  if (Math.random() > (db.meta.reactionChance ?? 0.2)) return text;
  const prefix = pick(db.meta.reactions);
  return `${prefix} ${text}`;
}

function updateContextFromInput(input, ctx) {
  if (shouldStoreUserMsg(input)) {
    ctx.lastUserMsg = input;
  }
}

function updateContextFromRule(rule, groups, ctx) {
  ctx.lastIntent = rule.id;
  if (rule.topic) {
    ctx.lastTopic = rule.topic;
    ctx.lastTopicFollowUps = Array.isArray(rule.followUps) ? rule.followUps : [];
    ctx.lastTopicFollowUpsUsed = [];
    ctx.topicFollowUpCount = 0;
  } else {
    ctx.lastTopic = "";
    ctx.lastTopicFollowUps = [];
    ctx.lastTopicFollowUpsUsed = [];
    ctx.topicFollowUpCount = 0;
  }
  if (rule.id === "no_talk") {
    ctx.noTalkTurns = 2;
    ctx.lastQuestion = "";
  }
  if (rule.id.startsWith("name_set")) {
    const name = groups?.[3] ?? groups?.[2];
    if (name) {
      ctx.userName = cleanUserName(name);
    }
  }
  if (rule.id === "clean") {
    ctx.poopCount = 0;
  }
  if (rule.id === "mood_set" && groups?.[2]) {
    ctx.mood = groups[2];
  }
}

function makeEcho(input) {
  const normalized = normalize(input);
  if (!normalized) return "";
  const max = 18;
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max)}...`;
}

function isQuestionText(text) {
  const t = normalize(text);
  if (!t) return false;
  return /\?$/.test(t);
}

function isRecallUserQuery(input) {
  const t = normalize(input);
  if (!t) return false;
  return /(내가|내\s*말|내\s*대답).*(뭐라고|뭐라|뭐였)/.test(t) || /(방금|아까).*(내가|내\s*말)/.test(t);
}

function isRecallBotQuery(input) {
  const t = normalize(input);
  if (!t) return false;
  return /(너(가|는)|네가|니가|네\s*말).*(뭐라고|뭐라|뭐였)/.test(t) || /(방금|아까).*(너|네가|니가)/.test(t);
}

function buildRecallReply(input, db, ctx, prevUser, prevBot) {
  if (isRecallBotQuery(input)) {
    if (prevBot) {
      const tpl = pickRendered(db.meta?.recallBotReplies ?? [], { ...ctx, lastBotMsg: prevBot }, ctx.lastBotMsg);
      return tpl ? tpl : `응, 내가 "${prevBot}"라고 했지.`;
    }
    const miss = pickRendered(db.meta?.recallMissingReplies ?? [], ctx, ctx.lastBotMsg);
    return miss ? miss : "그건 잘 기억이 안 나. 다시 말해줄래?";
  }
  if (isRecallUserQuery(input)) {
    if (prevUser) {
      const tpl = pickRendered(db.meta?.recallUserReplies ?? [], { ...ctx, lastUserMsg: prevUser }, ctx.lastBotMsg);
      return tpl ? tpl : `맞아, 너는 "${prevUser}"라고 했어.`;
    }
    const miss = pickRendered(db.meta?.recallMissingReplies ?? [], ctx, ctx.lastBotMsg);
    return miss ? miss : "그건 잘 기억이 안 나. 다시 말해줄래?";
  }
  return null;
}

function pickFallback(input, db, ctx) {
  const echo = makeEcho(input);
  const allowEcho = echo && shouldUseEcho(input);
  const templateCtx = { ...ctx, echo: allowEcho ? echo : "" };
  const reflect = db.meta?.fallbackReflectReplies ?? [];
  const basePool = db.meta?.fallbackReplies ?? [];
  const pool = allowEcho && reflect.length ? reflect : basePool;
  const base = pickRendered(pool, templateCtx, ctx.lastBotMsg);
  return base || "음...";
}

export function respond(inputRaw, db, ctx) {
  const input = normalize(inputRaw);
  if (!input) {
    return { text: pick(db.meta.fallbackReplies), intent: "fallback", mood: "neutral" };
  }

  const candidates = [];

  const prevUser = ctx.lastUserMsg;
  const prevBot = ctx.lastBotMsg;
  updateContextFromInput(input, ctx);
  ctx.echo = makeEcho(input);

  if (ctx.petName && isCallName(input, ctx.petName)) {
    const pool = db.meta?.callNameReplies ?? CALL_NAME_REPLIES;
    const text = pickRendered(pool, ctx, prevBot);
    return { text, intent: "call_name", mood: "happy" };
  }

  if (ctx.game && wantsStopGame(input)) {
    ctx.game = null;
    return { text: "알겠어. 게임은 여기서 끝!", intent: "game_stop", mood: "neutral" };
  }

  if (!ctx.game && wantsWordChain(input)) {
    const text = startWordChain(ctx);
    return { text, intent: "word_chain", mood: "happy" };
  }

  if (!ctx.game && wantsTwentyQuestions(input)) {
    const text = startTwentyQuestions(ctx);
    return { text, intent: "twenty_questions", mood: "happy" };
  }

  if (ctx.game) {
    const type = ctx.game.type;
    const text =
      type === "word_chain"
        ? handleWordChainTurn(input, ctx)
        : handleTwentyQuestionsTurn(input, ctx);
    return { text, intent: type, mood: "neutral" };
  }

  const directTeach = parseTeachPair(input);
  if (directTeach && /라고\s*하면/.test(input)) {
    saveTeachPair(ctx, directTeach.key, directTeach.value);
    return {
      text: `알겠어. "${directTeach.key}"는 "${directTeach.value}"로 답할게.`,
      intent: "teach_save",
      mood: "happy",
    };
  }

  if (ctx.pendingTeach) {
    const pair = parseTeachPair(input);
    if (!pair) {
      return { text: teachPrompt(), intent: "teach_retry", mood: "neutral" };
    }
    saveTeachPair(ctx, pair.key, pair.value);
    ctx.pendingTeach = false;
    return { text: `알겠어. "${pair.key}"는 "${pair.value}"로 답할게.`, intent: "teach_save", mood: "happy" };
  }

  if (/가르쳐\s*줘|가르쳐줘|학습/.test(input)) {
    const pair = parseTeachPair(input);
    if (pair) {
      saveTeachPair(ctx, pair.key, pair.value);
      return { text: `알겠어. "${pair.key}"는 "${pair.value}"로 답할게.`, intent: "teach_save", mood: "happy" };
    }
    ctx.pendingTeach = true;
    return { text: teachPrompt(), intent: "teach_prompt", mood: "neutral" };
  }

  const taught = lookupTeachPair(ctx, input);
  if (taught) {
    return { text: taught, intent: "teach_reply", mood: "neutral" };
  }

  const skipEntity = isSelfQuery(input) || looksLikeNameSet(input);
  if (!skipEntity) {
    const statement = extractEntityStatement(input);
    if (statement && !isPronounName(statement.name)) {
      const formatted = formatEntityDesc(statement.desc);
      rememberEntity(ctx, statement.name, formatted);
      return {
        text: `${withTopic(statement.name)} ${formatted}. 기억할게.`,
        intent: "entity_save",
        mood: "happy",
      };
    }

    const introName = extractEntityIntro(input);
    if (introName && !isPronounName(introName)) {
      ctx.pendingEntity = cleanEntityName(introName);
      return { text: `${withSubject(introName)} 누구인데?`, intent: "entity_ask", mood: "neutral" };
    }

    if (ctx.pendingEntity) {
      const pending = ctx.pendingEntity;
      const queryForPending = extractEntityQueryName(input);
      if (queryForPending && queryForPending === pending) {
        return { text: `${withSubject(pending)} 누구인지 알려줘.`, intent: "entity_retry", mood: "neutral" };
      }
      if (isLowContent(input) || isSilence(input) || isOnlyPunct(input)) {
        return { text: `${withSubject(pending)} 누구야?`, intent: "entity_retry", mood: "neutral" };
      }
      const desc = extractEntityDefinition(input, pending);
      if (desc) {
        const formatted = formatEntityDesc(desc);
        rememberEntity(ctx, pending, formatted);
        ctx.pendingEntity = null;
        return {
          text: `${withTopic(pending)} ${formatted}. 기억할게.`,
          intent: "entity_save",
          mood: "happy",
        };
      }
    }

    const queryName = extractEntityQueryName(input);
    if (queryName) {
      const desc = getEntityDesc(ctx, queryName);
      if (desc) {
        return { text: `${withTopic(queryName)} ${desc}.`, intent: "entity_recall", mood: "neutral" };
      }
      ctx.pendingEntity = cleanEntityName(queryName);
      return { text: `${withSubject(queryName)} 누구인데?`, intent: "entity_ask", mood: "neutral" };
    }
  }

  const recallReply = buildRecallReply(input, db, ctx, prevUser, prevBot);
  if (recallReply) {
    const finalText = appendFollowUp(appendReaction(recallReply, db), db, "recall");
    return { text: finalText, intent: "recall", mood: "neutral" };
  }

  for (const rule of db.rules) {
    if (!contextOk(rule, ctx)) continue;

    let matched = false;
    let groups = null;

    if (rule.regex) {
      const re = new RegExp(rule.regex, "i");
      const m = input.match(re);
      if (m) {
        matched = true;
        groups = m;
      }
    }

    if (!matched && Array.isArray(rule.patterns)) {
      for (const p of rule.patterns) {
        if (p && input.includes(p)) {
          matched = true;
          break;
        }
      }
    }

    if (matched) {
      if (rule.id === "no_ack" && (!isPureNoAck(input) || ctx.lastQuestion)) {
        continue;
      }
      if (rule.id === "compliment" && isPositiveAck(input) && ctx.lastQuestion) {
        continue;
      }
      candidates.push({ rule, groups });
    }
  }

  candidates.sort((a, b) => (b.rule.priority ?? 0) - (a.rule.priority ?? 0));

  if (candidates.length === 0) {
    if (!ctx.userName) {
      const looseName = extractLooseName(input);
      if (looseName) {
        ctx.userName = looseName;
        const replyText = renderTemplate(pickNameSetReply(db), ctx);
        const finalText = appendFollowUp(appendReaction(replyText, db), db, "name_set_loose");
        return { text: finalText, intent: "name_set_loose", mood: "happy" };
      }
    }
    if (ctx.noTalkTurns > 0 && (isLowContent(input) || isVagueResponse(input))) {
      const quiet = pickRuleReplyById(db, "no_talk", ctx, ctx.lastBotMsg) || "괜찮아. 여기 있을게.";
      ctx.noTalkTurns = Math.max(0, (ctx.noTalkTurns ?? 0) - 1);
      return { text: quiet, intent: "no_talk_follow", mood: "neutral" };
    }
    if (ctx.lastQuestion && (isPositiveAck(input) || isNegativeAck(input))) {
      const pool = isPositiveAck(input)
        ? db.meta?.positiveFollowUps
        : db.meta?.negativeFollowUps;
      if (Array.isArray(ctx.lastTopicFollowUps) && ctx.lastTopicFollowUps.length > 0) {
        const follow = pickTopicFollowUp(ctx, ctx.lastBotMsg);
        ctx.lastQuestion = follow;
        return { text: follow, intent: "topic_followup", mood: "neutral" };
      }
      if (Array.isArray(pool) && pool.length > 0) {
        const follow = pickRendered(pool, ctx, ctx.lastBotMsg);
        ctx.lastQuestion = follow;
        return { text: follow, intent: "topic_followup", mood: "neutral" };
      }
    }
    if (
      (isLowContent(input) || isVagueResponse(input) || isShortAnswer(input)) &&
      ctx.lastQuestion
    ) {
      if (Array.isArray(ctx.lastTopicFollowUps) && ctx.lastTopicFollowUps.length > 0) {
        if ((ctx.topicFollowUpCount ?? 0) >= 2) {
          const soft = "괜찮아. 말하기 싫으면 다른 얘기 해볼까?";
          ctx.topicFollowUpCount = 0;
          return { text: soft, intent: "topic_pause", mood: "neutral" };
        }
        const follow = pickTopicFollowUp(ctx, ctx.lastBotMsg);
        ctx.topicFollowUpCount = (ctx.topicFollowUpCount ?? 0) + 1;
        ctx.lastQuestion = follow;
        return { text: follow, intent: "topic_followup", mood: "neutral" };
      }
    }
    if (isLowContent(input)) {
      if (isSilence(input)) {
        const quiet = pickRendered(SILENCE_REPLIES, ctx, ctx.lastBotMsg);
        return { text: quiet, intent: "silence", mood: "neutral" };
      }
      if (isOnlyPunct(input)) {
        const punct = pickRendered(PUNCT_REPLIES, ctx, ctx.lastBotMsg);
        return { text: punct, intent: "confused_short", mood: "neutral" };
      }
      if (isLaughOnly(input)) {
        const laugh = pickRendered(LAUGH_REPLIES, ctx, ctx.lastBotMsg);
        return { text: appendReaction(laugh, db), intent: "laugh", mood: "happy" };
      }
      const low = pickLowContentReply(db, ctx);
      return { text: appendReaction(low, db), intent: "low_content", mood: "neutral" };
    }
    if (!ctx.userName && db.meta?.nameOnlyReplies?.length && input.match(/^[\uAC00-\uD7A3a-zA-Z0-9_]{2,12}$/)) {
      const hint = pickRendered(db.meta.nameOnlyReplies, ctx, ctx.lastBotMsg);
      return { text: appendFollowUp(appendReaction(hint, db), db, "name_hint"), intent: "name_hint", mood: "neutral" };
    }
    const fallback = pickFallback(input, db, ctx);
    return { text: appendReaction(fallback, db), intent: "fallback", mood: "neutral" };
  }

  const { rule, groups } = candidates[0];

  if (rule.id === "name_query" && !ctx.userName && db.meta?.nameMissingReplies?.length) {
    const missing = pickRendered(db.meta.nameMissingReplies, ctx, ctx.lastBotMsg);
    return { text: appendFollowUp(appendReaction(missing, db), db, rule.id), intent: rule.id, mood: "neutral" };
  }

  updateContextFromRule(rule, groups, ctx);

  const replyText = pickRendered(rule.replies, ctx, ctx.lastBotMsg);
  const finalText =
    rule.id === "no_talk" ? replyText : appendFollowUp(appendReaction(replyText, db), db, rule.id);
  const mood = rule.mood || "neutral";
  ctx.lastQuestion = isQuestionText(finalText) ? finalText : "";
  return { text: finalText, intent: rule.id, mood };
}
