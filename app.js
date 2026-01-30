﻿import { loadRules, respond } from "./bot.js";

import { addMessage, getRecent, clearAll } from "./storage.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

import {

  getMessaging,

  getToken,

  onMessage,

} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";



const canvas = document.getElementById("screen");

const modeLabel = document.getElementById("modeLabel");

const speechBubble = document.getElementById("speech");

const screenDead = document.getElementById("screenDead");

const actionMenuMain = document.getElementById("actionMenuMain");

const actionMenuCare = document.getElementById("actionMenuCare");

const actionBtn1 = document.getElementById("actionBtn1");

const actionBtn2 = document.getElementById("actionBtn2");

const chatPanel = document.getElementById("chatPanel");

const chatLog = document.getElementById("chatLog");

const chatForm = document.getElementById("chatForm");

const chatField = document.getElementById("chatField");

const chatClose = document.getElementById("chatClose");

const chatClear = document.getElementById("chatClear");

const modalOverlay = document.getElementById("modalOverlay");
const modalShell = document.querySelector(".modal");

const modalTitle = document.getElementById("modalTitle");

const modalContent = document.getElementById("modalContent");

const modalSettings = document.getElementById("modalSettings");
const modalAdmin = document.getElementById("modalAdmin");

const modalName = document.getElementById("modalName");

const modalNameLabel = document.getElementById("modalNameLabel");

const modalNameInput = document.getElementById("modalNameInput");

const modalSaveName = document.getElementById("modalSaveName");

const modalClose = document.getElementById("modalClose");
const adminPasswordInput = document.getElementById("adminPasswordInput");
const adminPasswordSubmit = document.getElementById("adminPasswordSubmit");
const adminPasswordError = document.getElementById("adminPasswordError");

const settingBgm = document.getElementById("settingBgm");

const settingSfx = document.getElementById("settingSfx");

const settingsReset = document.getElementById("settingsReset");
const settingsAdmin = document.getElementById("settingsAdmin");

const statePoopBtn = document.getElementById("statePoop");

const stateHungryBtn = document.getElementById("stateHungry");

const stateSickBtn = document.getElementById("stateSick");

const stateSleepyBtn = document.getElementById("stateSleepy");
const stateDirtyBtn = document.getElementById("stateDirty");
const stateAnnoyedBtn = document.getElementById("stateAnnoyed");
const stateDeathBtn = document.getElementById("stateDeath");
const stateNotifyBtn = document.getElementById("stateNotify");
const adminPanel = document.getElementById("adminPanel");
const dpadUp = document.querySelector(".dpad__key--up");

const dpadDown = document.querySelector(".dpad__key--down");

const dpadCenter = document.querySelector(".dpad__key--center");

const sideModuleToggles = document.querySelectorAll(".side-module__toggle");

const sideModules = document.querySelectorAll(".side-module");

const statHunger = document.getElementById("statHunger");

const statHealth = document.getElementById("statHealth");

const statClean = document.getElementById("statClean");

const statHappy = document.getElementById("statHappy");

const statEnergy = document.getElementById("statEnergy");

const statLife = document.getElementById("statLife");

const ctx = canvas.getContext("2d");



const GRID = 128;

const SCALE = 1;

const LOGICAL_GRID = GRID / SCALE;

const SPRITE_SCALE = 3;

const RAW_SPRITE_W = 16;

const RAW_SPRITE_H = 16;

const SPRITE_W = RAW_SPRITE_W * SPRITE_SCALE;

const SPRITE_H = RAW_SPRITE_H * SPRITE_SCALE;

const SPONGE_SCALE = 2;

const SPONGE_W = 12 * SPONGE_SCALE;

const SPONGE_H = 7 * SPONGE_SCALE;

const Y_OFFSET_MIN = -1;

const Y_OFFSET_MAX = 1;

const TICK = 240;

const HAPPY_WASH_TICKS = Math.max(1, Math.round(3000 / TICK));

const VITAL_INTERVAL = 10000;

const SLEEP_DECAY_FACTOR = 0.5;

const SLEEP_ENERGY_GAIN = 3;

const MAX_DAILY_FEEDS = 3;

const FEED_RESET_INTERVAL = 4 * 60 * 60 * 1000;

const HUNGER_DECAY = 0.05;

const PET_HAPPY_GAIN = 2;

const PET_STROKE_THRESHOLD = 10;

const POOP_INTERVAL = 60 * 60 * 1000;

const POOP_CHANCE = 0.5;

const STAT_BUTTON_STEP = 10;

const VITAL_THRESHOLDS = {

  hungry: 30,

  hungryCritical: 12,

  dirty: 25,

  dirtyCritical: 12,

  sleepy: 25,

  sick: 35,

  recoverSick: 60,

};



ctx.imageSmoothingEnabled = false;



const state = {

  mode: "walk",

  frame: 0,

  blink: 0,

  mood: "neutral",

  moodTimer: 0,

  modeTimer: 0,

  idleTimer: 0,

  x: Math.floor((GRID - SPRITE_W) / 2),

  y: Math.floor((GRID - SPRITE_H) / 2),

  vx: 0.35,

  vy: 0.25,

  petTimer: 0,

  petStrokeCount: 0,

  hearts: [],

  feedTimer: 0,

  crumbs: [],

  poops: [],

  hungry: false,

  sick: false,

  sleepy: false,

  dirty: false,

  dirtOpacity: 1,

  pooping: false,

  poopTimer: 0,

  washOverdone: false,

  washing: false,

  washScrub: 0,

  sponge: { x: 0, y: 0 },

  spongeTarget: { x: 0, y: 0 },

  bubbles: [],

  medicineTimer: 0,

  restTimer: 0,

  coughTimer: 0,

  zzzTimer: 0,

  sleeping: false,

  hunger: 100,

  health: 100,

  clean: 100,

  happy: 100,

  energy: 100,

  life: 100,

  feedCount: 0,

  feedDay: "",

  feedWindowStart: 0,

  lastPoopCheck: 0,

  lastVitalTick: 0,

  dead: false,

  deadShown: false,

  lastTick: 0,

};



const walkFrames = [0, 1, 2, 3];

const jumpFrames = [0, 1, 2];

const SPEECH_LINES = [

  "안녕!",

  "오늘 뭐 하고 있었어?",

  "무슨 일이야?",

  "괜찮아?",

  "쉬고 있었어!",

  "기분 좋아!",

  "같이 얘기할래?",

  "오늘은 좀 어때?"

];

const DEATH_MESSAGES = [

  "{user}{이/가}와 함께한 모든 순간이 행복했어. 고마워. 다음에 또 재밌게 놀아줘 :)",

  "빛나는 이름인 {pet}{을/를} 선물해줘서 고마웠어. 또 다른 이에게도 소중한 이름을 지어줘 :)",

  "{user}{아/야}, 보고 싶을 거야. 네가 외롭지 않게 앞에서 기다릴게 :)",

  "우리의 작은 하루들이 반짝였어. 고마워, {user}{아/야}.",

  "{user}{이/가} 불러준 이름 덕분에 따뜻했어. 다음에도 웃게 해줘 :)",

  "이별은 잠깐이야. {user}{아/야}, 다시 만날 때까지 잘 지내.",

];



let speechTimer = 0;

let speechCooldown = 60;

let menuIndex = 0;

let activeMenu = null;

let menuItems = [];

let sleepMenuItem = null;

let chatDB = null;

let chatReady = false;

let chatOpen = false;

let chatViewCleared = false;

let uiLocked = false;

let deathModalActive = false;

let nameModalActive = false;
let adminModalActive = false;

let allowStatePersist = true;

let nameStep = "pet";

const NAME_KEY = "pixel_pet_user_name";

const PET_NAME_KEY = "pixel_pet_pet_name";

const ENTITY_KEY = "pixel_pet_entities";

const TEACH_KEY = "pixel_pet_teach_pairs";

const PET_STATE_KEY = "pixel_pet_state_v1";

let petName = localStorage.getItem(PET_NAME_KEY) || "";

const PET_STATE_SAVE_INTERVAL = 5000;

const MAX_OFFLINE_MS = 12 * 60 * 60 * 1000;

let lastPetStateSaveAt = 0;

let storedEntities = {};

try {

  storedEntities = JSON.parse(localStorage.getItem(ENTITY_KEY) || "{}");

} catch {

  storedEntities = {};

}

let storedTeachPairs = {};

try {

  storedTeachPairs = JSON.parse(localStorage.getItem(TEACH_KEY) || "{}");

} catch {

  storedTeachPairs = {};

}

const chatCtx = {

  userName: localStorage.getItem(NAME_KEY),

  petName,

  poopCount: 0,

  lastIntent: null,

  lastUserMsg: null,

  lastBotMsg: null,

  history: [],

  mood: "neutral",

  timeOfDay: "",

  nowTime: "",

  todayDate: "",

  todayDay: "",

  game: null,

  entities: storedEntities,

  pendingEntity: null,

  teachPairs: storedTeachPairs,

  pendingTeach: false,

  lastTopic: "",

  lastQuestion: "",

  lastTopicFollowUps: [],

  lastTopicFollowUpsUsed: [],

  topicFollowUpCount: 0,

  noTalkTurns: 0,

};



const SETTINGS_KEY_BGM = "pixel_pet_setting_bgm_volume";

const SETTINGS_KEY_SFX = "pixel_pet_setting_sfx_volume";

const DEFAULT_BGM_VOLUME = 0.35;

const DEFAULT_SFX_VOLUME = 0.3;

const settings = {

  bgmVolume: DEFAULT_BGM_VOLUME,

  sfxVolume: DEFAULT_SFX_VOLUME,

};
const ADMIN_PASSWORD = "1994";
let adminUnlocked = false;
const firebaseConfig = {
  apiKey: "AIzaSyCRHJ6J-l73U5ciICENBM_MqTSm-QDK3dA",
  authDomain: "damagochi-6e46d.firebaseapp.com",
  projectId: "damagochi-6e46d",
  storageBucket: "damagochi-6e46d.firebasestorage.app",
  messagingSenderId: "406396759712",
  appId: "1:406396759712:web:ce12b49537988901ef63c5",
  measurementId: "G-R3ZDKEXMPG",
};
const FCM_VAPID_KEY = "BL7dnxAeCMgkNtpQMQ1rXxKLIozegLEyPlCMzSS6oFAGKc_e8ikVKv7SF7H7HWorMPhQU-rT1FTdktYYjwgmiiY";
const PUSH_COOLDOWN_MS = 60 * 60 * 1000;
const PUSH_STATE_INTERVAL_MS = 60 * 1000;
const DEVICE_ID_KEY = "pixel_pet_device_id";

let firebaseApp = null;
let messaging = null;
let fcmToken = localStorage.getItem("pixel_pet_fcm_token") || "";
let pushReady = false;
let firestore = null;
const pushCooldowns = new Map();
let lastPushStateAt = 0;
let deviceId = "";



function parseVolume(value, fallback) {

  if (!value && value !== 0) return fallback;

  if (value === "off") return 0;

  if (value === "on") return fallback;

  const num = Number(value);

  if (!Number.isFinite(num)) return fallback;

  return Math.max(0, Math.min(1, num));

}



settings.bgmVolume = parseVolume(localStorage.getItem(SETTINGS_KEY_BGM), DEFAULT_BGM_VOLUME);

settings.sfxVolume = parseVolume(localStorage.getItem(SETTINGS_KEY_SFX), DEFAULT_SFX_VOLUME);



const audio = {
  bgm: new Audio(encodeURI("./bgm/bgm.mp3")),
  poop: new Audio(encodeURI("./bgm/똥.mp3")),
  shower: new Audio(encodeURI("./bgm/샤워.mp3")),
  happy: new Audio(encodeURI("./bgm/행복.mp3")),
  button: new Audio(encodeURI("./bgm/버튼.mp3")),
  die: new Audio(encodeURI("./bgm/다이.mp3")),
  hungry: new Audio(encodeURI("./bgm/배고픔.mp3")),
  sleepy: new Audio(encodeURI("./bgm/졸림.mp3")),
};



audio.bgm.loop = true;

audio.shower.loop = true;

audio.bgm.volume = settings.bgmVolume;



let audioUnlocked = false;

let lastHappySfx = 0;

let lastButtonSfx = 0;

let lastHungrySfx = 0;

let lastSleepySfx = 0;

const HUNGRY_SFX_INTERVAL = 9000;

const SLEEPY_SFX_INTERVAL = 12000;



function getTodayKey() {

  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;

}



function ensureDailyFeedReset() {

  const today = getTodayKey();

  if (state.feedDay !== today) {

    state.feedDay = today;

    state.feedCount = 0;

  }

}



function ensureFeedWindow(now) {

  if (!state.feedWindowStart || now - state.feedWindowStart >= FEED_RESET_INTERVAL) {

    state.feedWindowStart = now;

    state.feedCount = 0;

  }

}



function playBgm() {

  if (!audioUnlocked) return;

  if (!audio.bgm) return;

  audio.bgm.volume = settings.bgmVolume;

  if (settings.bgmVolume <= 0) {

    audio.bgm.pause();

    return;

  }

  audio.bgm.play().catch(() => null);

}



function playSfx(sound, { restart = true } = {}) {

  if (!audioUnlocked) return;

  if (!sound) return;

  if (settings.sfxVolume <= 0) return;

  try {

    sound.volume = settings.sfxVolume;

    if (restart) {

      sound.pause();

      sound.currentTime = 0;

    }

    sound.play().catch(() => null);

  } catch {

    // ignore

  }

}



function playHappySfx() {

  const now = performance.now();

  if (now - lastHappySfx < 900) return;

  lastHappySfx = now;

  playSfx(audio.happy);

}



function playHungrySfx() {

  const now = performance.now();

  if (now - lastHungrySfx < HUNGRY_SFX_INTERVAL) return;

  lastHungrySfx = now;

  playSfx(audio.hungry);

}



function playSleepySfx() {

  const now = performance.now();

  if (now - lastSleepySfx < SLEEPY_SFX_INTERVAL) return;

  lastSleepySfx = now;

  playSfx(audio.sleepy);

}



function playButtonSfx() {

  const now = performance.now();

  if (now - lastButtonSfx < 120) return;

  lastButtonSfx = now;

  playSfx(audio.button);

}



function startShowerSound() {

  if (!audioUnlocked) return;

  if (!audio.shower) return;

  if (settings.sfxVolume <= 0) return;

  audio.shower.volume = settings.sfxVolume;

  audio.shower.currentTime = 0;

  audio.shower.play().catch(() => null);

}



function stopShowerSound() {

  if (!audio.shower) return;

  audio.shower.pause();

  audio.shower.currentTime = 0;

}



function unlockAudio() {

  if (audioUnlocked) return;

  audioUnlocked = true;

  playBgm();

  if (state.washing) {

    stopShowerSound();

  }

}



function registerAudioUnlock() {
  const handler = () => {
    unlockAudio();
    window.removeEventListener("pointerdown", handler);
    window.removeEventListener("keydown", handler);
  };
  window.addEventListener("pointerdown", handler);
  window.addEventListener("keydown", handler);
}

function createDeviceId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function ensureDeviceId() {
  if (deviceId) return deviceId;
  try {
    deviceId = localStorage.getItem(DEVICE_ID_KEY) || "";
    if (!deviceId) {
      deviceId = createDeviceId();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
  } catch {
    deviceId = createDeviceId();
  }
  return deviceId;
}

function initFirebaseMessaging() {
  if (firebaseApp || !firebaseConfig) {
    return;
  }
  firebaseApp = initializeApp(firebaseConfig);
  messaging = getMessaging(firebaseApp);
}

function initFirestore() {
  if (!firebaseApp || !firebaseConfig) {
    initFirebaseMessaging();
  }
  if (!firebaseApp) return;
  if (!firestore) {
    firestore = getFirestore(firebaseApp);
  }
}

function registerPushToken() {
  if (!fcmToken) return;
  initFirestore();
  if (!firestore) return;
  const device = ensureDeviceId();
  const payload = {
    deviceId: device,
    token: fcmToken,
    petName: petName || "",
    userName: chatCtx.userName || "",
    tokenUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  setDoc(doc(firestore, "devices", device), payload, { merge: true }).catch(() => null);
}

function syncPetStateToServer(force = false) {
  if (!pushReady || !fcmToken) return;
  initFirestore();
  if (!firestore) return;
  const now = Date.now();
  if (!force && now - lastPushStateAt < PUSH_STATE_INTERVAL_MS) return;
  lastPushStateAt = now;
  const device = ensureDeviceId();
  const payload = {
    deviceId: device,
    token: fcmToken,
    petName: petName || "",
    userName: chatCtx.userName || "",
    state: {
      savedAt: now,
      hunger: state.hunger,
      health: state.health,
      clean: state.clean,
      happy: state.happy,
      energy: state.energy,
      life: state.life,
      sleeping: state.sleeping,
      sick: state.sick,
      dead: state.dead,
    },
    updatedAt: serverTimestamp(),
  };
  setDoc(doc(firestore, "devices", device), payload, { merge: true }).catch(() => null);
}

async function initPushNotifications() {
  if (pushReady) return;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
  initFirebaseMessaging();
  ensureDeviceId();
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;
    const reg = await navigator.serviceWorker.ready;
    if (FCM_VAPID_KEY) {
      try {
        fcmToken = await getToken(messaging, {
          vapidKey: FCM_VAPID_KEY,
          serviceWorkerRegistration: reg,
        });
        if (fcmToken) {
          localStorage.setItem("pixel_pet_fcm_token", fcmToken);
          registerPushToken();
        }
      } catch {
        // ignore token errors
      }
    }
    if (messaging) {
      onMessage(messaging, (payload) => {
        const title = payload?.notification?.title || "Pixel Pet";
        const body = payload?.notification?.body || "";
        showLocalNotification(title, body);
      });
    }
    pushReady = true;
  } catch {
    // ignore
  }
}

function canNotify(key) {
  if (!key) return true;
  const now = Date.now();
  const last = pushCooldowns.get(key) || 0;
  if (now - last < PUSH_COOLDOWN_MS) return false;
  pushCooldowns.set(key, now);
  return true;
}

async function showLocalNotification(title, body, key) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (key && !canNotify(key)) return;
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg?.showNotification) {
        reg.showNotification(title, {
          body,
          tag: key || undefined,
          renotify: Boolean(key),
        });
        return;
      }
    }
    new Notification(title, { body });
  } catch {
    // ignore
  }
}

function applySettingsUI() {
  if (settingBgm) settingBgm.value = Math.round(settings.bgmVolume * 100);
  if (settingSfx) settingSfx.value = Math.round(settings.sfxVolume * 100);
}

function setModalWide(enabled) {
  if (!modalShell) return;
  modalShell.classList.toggle("modal--wide", enabled);
}

function setAdminControlsVisible(visible) {
  if (!adminPanel) return;
  adminPanel.hidden = !visible;
}

function setAdminError(message) {
  if (!adminPasswordError) return;
  if (!message) {
    adminPasswordError.textContent = "";
    adminPasswordError.hidden = true;
    return;
  }
  adminPasswordError.textContent = message;
  adminPasswordError.hidden = false;
}

function openAdminModal() {
  if (!modalOverlay || !modalTitle || !modalContent || !modalSettings || !modalName || !modalSaveName || !modalAdmin) {
    return;
  }
  adminModalActive = true;
  setModalWide(false);
  modalTitle.textContent = "관리자 설정";
  modalContent.hidden = true;
  modalSettings.hidden = true;
  modalName.hidden = true;
  modalSaveName.hidden = true;
  modalAdmin.hidden = false;
  if (adminPanel) {
    adminPanel.hidden = true;
  }
  if (modalClose) {
    modalClose.hidden = false;
  }
  setAdminError("");
  if (adminPasswordInput) {
    adminPasswordInput.value = "";
    adminPasswordInput.focus();
  }
  modalOverlay.hidden = false;
}

function openAdminPanelModal() {
  if (!modalOverlay || !modalTitle || !modalContent || !modalSettings || !modalName || !modalSaveName || !adminPanel) {
    return;
  }
  adminModalActive = false;
  setModalWide(false);
  setModalWide(true);
  modalTitle.textContent = "상태 관리";
  modalContent.hidden = true;
  modalSettings.hidden = true;
  modalName.hidden = true;
  modalSaveName.hidden = true;
  if (modalAdmin) {
    modalAdmin.hidden = true;
  }
  adminPanel.hidden = false;
  if (modalClose) {
    modalClose.hidden = false;
  }
  modalOverlay.hidden = false;
}

function closeAdminModal() {
  adminModalActive = false;
  if (modalAdmin) {
    modalAdmin.hidden = true;
  }
  closeModal();
}

function submitAdminPassword() {
  if (!adminPasswordInput) return;
  const input = adminPasswordInput.value.trim();
  if (input === ADMIN_PASSWORD) {
    adminUnlocked = true;
    setAdminControlsVisible(true);
    openAdminPanelModal();
    return;
  }
  setAdminError("비밀번호가 올바르지 않습니다.");
  adminPasswordInput.focus();
}


function closeModal() {

  if (!modalOverlay) return;
  adminModalActive = false;

  modalOverlay.hidden = true;
  setModalWide(false);
  if (adminPanel) {
    adminPanel.hidden = true;
  }

}



function openInfoModal(title, message) {

  if (!modalOverlay || !modalTitle || !modalContent || !modalSettings || !modalName || !modalSaveName) {

    return;

  }
  adminModalActive = false;
  setModalWide(false);

  if (modalOverlay.hidden === false) {

    modalOverlay.hidden = true;

  }

  modalTitle.textContent = title;

  modalContent.textContent = message;

  modalContent.style.whiteSpace = "pre-line";

  modalContent.hidden = false;

  modalSettings.hidden = true;

  modalName.hidden = true;

  modalSaveName.hidden = true;
  if (modalAdmin) {
    modalAdmin.hidden = true;
  }
  if (adminPanel) {
    adminPanel.hidden = true;
  }

  if (modalClose) {

    modalClose.hidden = false;

  }

  modalOverlay.style.zIndex = "10";

  modalOverlay.hidden = false;

}



function openSettingsModal() {

  if (!modalOverlay || !modalTitle || !modalContent || !modalSettings || !modalName || !modalSaveName) {

    return;

  }
  adminModalActive = false;

  modalTitle.textContent = "환경설정";

  modalContent.hidden = true;

  modalSettings.hidden = false;

  modalName.hidden = true;

  modalSaveName.hidden = true;
  if (modalAdmin) {
    modalAdmin.hidden = true;
  }
  if (adminPanel) {
    adminPanel.hidden = true;
  }

  applySettingsUI();

  if (modalClose) {

    modalClose.hidden = false;

  }

  modalOverlay.hidden = false;

}



function setScreenDeadVisible(visible) {

  if (!screenDead) {

    return;

  }

  screenDead.hidden = !visible;

}



function setUiLocked(locked) {

  uiLocked = locked;

  setScreenDeadVisible(locked || state.dead);

  const disabled = Boolean(locked);

  const controls = [

    actionBtn1,

    actionBtn2,

    dpadUp,

    dpadDown,

    dpadCenter,

    statePoopBtn,

    stateHungryBtn,

    stateDirtyBtn,

    stateSleepyBtn,

    stateSickBtn,

    stateAnnoyedBtn,

    stateDeathBtn,

  ];

  controls.forEach((btn) => {

    if (!btn) return;

    btn.disabled = disabled;

    btn.setAttribute("aria-disabled", disabled ? "true" : "false");

  });

  if (disabled) {

    state.lastVitalTick = 0;

    state.lastPoopCheck = 0;

    closeMenu();

    closeChat(true);

  } else {

    state.lastVitalTick = performance.now();

    state.lastPoopCheck = performance.now();

    setScreenDeadVisible(state.dead);

  }

}



function openNameModal() {

  if (!modalOverlay || !modalTitle || !modalContent || !modalSettings || !modalName || !modalSaveName) {

    return;

  }

  nameModalActive = true;

  nameStep = "pet";

  updateNameModalStep();

  modalSettings.hidden = true;

  modalName.hidden = false;

  modalSaveName.hidden = false;

  if (modalClose) {

    modalClose.hidden = true;

  }

  if (modalNameInput) {

    modalNameInput.value = "";

    modalNameInput.focus();

  }

  modalOverlay.hidden = false;

}



function closeNameModal() {

  nameModalActive = false;

  if (modalClose) {

    modalClose.hidden = false;

  }

  closeModal();

}



function updateNameModalStep() {

  if (!modalTitle || !modalContent || !modalNameInput) {

    return;

  }

  modalTitle.textContent =

    nameStep === "pet" ? "이름을 지어주세요." : "당신의 이름을 알려주세요";

  modalContent.textContent = nameStep === "pet" ? "" : "";

  modalContent.hidden = true;

  if (modalNameLabel) {

    modalNameLabel.textContent = "이름";

  }

  modalNameInput.value = "";

  modalNameInput.placeholder = nameStep === "pet" ? "펫이름 입력" : "유저이름 입력";

  modalNameInput.focus();

}



function savePetName() {

  if (!modalNameInput) {

    return;

  }

  const raw = modalNameInput.value.trim();

  const cleaned = raw.replace(/\s+/g, "").slice(0, 12);

  if (!cleaned || !/^[\uAC00-\uD7A3a-zA-Z0-9_]{1,12}$/.test(cleaned)) {

    if (modalContent) {

      modalContent.textContent = "이름을 1~12글자로 입력해줘.";

      modalContent.hidden = false;

    }

    return;

  }

  if (nameStep === "pet") {

    petName = cleaned;

    localStorage.setItem(PET_NAME_KEY, petName);

    chatCtx.petName = petName;
    registerPushToken();

    if (audio.start) {

      playSfx(audio.start);

    }

    nameStep = "user";

    if (modalContent) {

      modalContent.hidden = true;

    }

    updateNameModalStep();

    return;

  }

  chatCtx.userName = cleaned;

  localStorage.setItem(NAME_KEY, cleaned);

  initPushNotifications();
  registerPushToken();

  if (modalContent) {

    modalContent.hidden = true;

  }

  closeNameModal();

  setUiLocked(false);

}



async function performFullReset({ reload = true } = {}) {

  allowStatePersist = false;

  deathModalActive = false;

  nameModalActive = false;

  petName = "";

  chatCtx.petName = "";

  try {

    await clearAll();

  } catch {

    // ignore

  }

  localStorage.removeItem(NAME_KEY);

  localStorage.removeItem(PET_NAME_KEY);

  localStorage.removeItem(ENTITY_KEY);

  localStorage.removeItem(TEACH_KEY);

  localStorage.removeItem(PET_STATE_KEY);

  localStorage.removeItem(SETTINGS_KEY_BGM);

  localStorage.removeItem(SETTINGS_KEY_SFX);

  if (reload) {

    location.reload();

  }

}



function enterDeathState() {

  if (state.dead) {

    return;

  }

  state.dead = true;

  nameModalActive = false;

  deathModalActive = true;

  setUiLocked(true);

  state.mode = "idle";

  state.vx = 0;

  state.vy = 0;

  state.mood = "sad";

  setScreenDeadVisible(true);

  playSfx(audio.die);

  const name = petName || "펫";

  const user = chatCtx.userName || "너";

  const firstLine = formatWithParticles("{pet}{이/가} 하늘에 별이 되었습니다.", {

    user,

    pet: name,

  });

  const message = pick(DEATH_MESSAGES) || "";

  const secondLine = formatWithParticles(message, { user, pet: name });

  openInfoModal("", `${firstLine}\n\n${secondLine}`);

}



function handleSettingsChange() {

  if (settingBgm) {

    const value = Number(settingBgm.value) / 100;

    settings.bgmVolume = Math.max(0, Math.min(1, value));

    localStorage.setItem(SETTINGS_KEY_BGM, String(settings.bgmVolume));

    playBgm();

  }

  if (settingSfx) {

    const value = Number(settingSfx.value) / 100;

    settings.sfxVolume = Math.max(0, Math.min(1, value));

    localStorage.setItem(SETTINGS_KEY_SFX, String(settings.sfxVolume));

  }

}



function resetSettings() {

  settings.bgmVolume = DEFAULT_BGM_VOLUME;

  settings.sfxVolume = DEFAULT_SFX_VOLUME;

  localStorage.setItem(SETTINGS_KEY_BGM, String(settings.bgmVolume));

  localStorage.setItem(SETTINGS_KEY_SFX, String(settings.sfxVolume));

  applySettingsUI();

  playBgm();

}



function sanitizePoops(list) {

  if (!Array.isArray(list)) return [];

  return list

    .map((poop) => {

      const x = Number(poop?.x);

      const y = Number(poop?.y);

      const clean = Number(poop?.clean);

      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

      return {

        x: clamp(Math.round(x), 0, LOGICAL_GRID),

        y: clamp(Math.round(y), 0, LOGICAL_GRID),

        clean: Number.isFinite(clean) ? clamp(Math.round(clean), 0, 3) : 0,

      };

    })

    .filter(Boolean);

}



function persistPetState(force = false) {

  if (!allowStatePersist) {

    return;

  }

  const now = Date.now();

  if (!force && now - lastPetStateSaveAt < PET_STATE_SAVE_INTERVAL) {

    return;

  }

  lastPetStateSaveAt = now;

  const payload = {

    savedAt: now,

    hunger: state.hunger,

    health: state.health,

    clean: state.clean,

    happy: state.happy,

    energy: state.energy,

    life: state.life,

    feedCount: state.feedCount,

    feedDay: state.feedDay,

    feedWindowStart: state.feedWindowStart,

    sleeping: state.sleeping,

    sick: state.sick,

    poops: state.poops,

  };

  try {

    localStorage.setItem(PET_STATE_KEY, JSON.stringify(payload));

  } catch {

    // ignore

  }
  syncPetStateToServer(force);

}



function loadPetState() {

  let raw;

  try {

    raw = JSON.parse(localStorage.getItem(PET_STATE_KEY) || "null");

  } catch {

    raw = null;

  }

  if (!raw || typeof raw !== "object") {

    return false;

  }

  if (Number.isFinite(raw.hunger)) state.hunger = clamp(raw.hunger, 0, 100);

  if (Number.isFinite(raw.health)) state.health = clamp(raw.health, 0, 100);

  if (Number.isFinite(raw.clean)) state.clean = clamp(raw.clean, 0, 100);

  if (Number.isFinite(raw.happy)) state.happy = clamp(raw.happy, 0, 100);

  if (Number.isFinite(raw.energy)) state.energy = clamp(raw.energy, 0, 100);

  if (Number.isFinite(raw.life)) state.life = clamp(raw.life, 0, 100);

  if (Number.isFinite(raw.feedCount)) state.feedCount = Math.max(0, raw.feedCount);

  if (typeof raw.feedDay === "string") state.feedDay = raw.feedDay;

  if (Number.isFinite(raw.feedWindowStart)) state.feedWindowStart = raw.feedWindowStart;

  if (typeof raw.sleeping === "boolean") state.sleeping = raw.sleeping;

  if (typeof raw.sick === "boolean") state.sick = raw.sick;

  if (Array.isArray(raw.poops)) state.poops = sanitizePoops(raw.poops);



  state.mode = state.sleeping ? "idle" : "walk";

  state.mood = "neutral";

  state.moodTimer = 0;

  state.modeTimer = 0;

  state.petTimer = 0;

  state.feedTimer = 0;

  state.medicineTimer = 0;

  state.restTimer = 0;

  state.poopTimer = 0;

  state.pooping = false;

  state.washing = false;

  state.washScrub = 0;

  state.washOverdone = false;

  state.dirtOpacity = 1;

  state.crumbs = [];

  state.hearts = [];

  state.bubbles = [];

  if (Number.isFinite(raw.savedAt)) {

    const elapsed = Math.max(0, Date.now() - raw.savedAt);

    const capped = Math.min(elapsed, MAX_OFFLINE_MS);

    const nowPerf = performance.now();

    state.lastVitalTick = nowPerf - capped;

    state.lastPoopCheck = nowPerf - capped;

  } else {

    state.lastVitalTick = 0;

    state.lastPoopCheck = 0;

  }

  state.lastTick = 0;



  syncVitalFlags();

  return true;

}



function startPooping(duration = 8) {

  if (state.pooping) {

    return;

  }

  state.pooping = true;

  state.poopTimer = duration;

  state.mode = "idle";

  state.modeTimer = 0;

}



function spawnPoop() {

  const baseX = Math.round(state.x);

  const baseY = Math.round(state.y);

  const jitterX = Math.floor((Math.random() - 0.5) * 20);

  const jitterY = Math.floor((Math.random() - 0.5) * 12);

  const poopX = Math.max(

    0,

    Math.min(

      LOGICAL_GRID - POOP_W,

      baseX + Math.floor(SPRITE_W / 2) - Math.floor(POOP_W / 2) + jitterX

    )

  );

  const poopY = Math.max(0, Math.min(LOGICAL_GRID - POOP_H, baseY + SPRITE_H - POOP_H + jitterY));

  state.poops.push({ x: poopX, y: poopY, clean: 0 });

  playSfx(audio.poop);

}



function isProfane(text) {

  return /(?:씨발|시발|ㅅㅂ|병신|ㅄ|좆|좇|지랄|ㅈㄹ|꺼져|개새|새끼|미친|fuck|shit|bitch|asshole|idiot)/i.test(text);

}



function isPraise(text) {

  return /(?:좋아|최고|멋져|멋지다|잘했|잘한다|착하|고마워|감사|사랑|굿|짱)/i.test(text);

}



function showSpeech(text, duration = 18, cooldown = 80) {

  if (!speechBubble) {

    return;

  }

  speechBubble.textContent = text;

  speechBubble.hidden = false;

  speechTimer = duration;

  speechCooldown = cooldown;

}



function clearScreen() {

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.globalAlpha = 1;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0d0d0d";

  ctx.fillRect(0, 0, canvas.width, canvas.height);

}



function pixel(x, y) {

  ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);

}



function block(x, y, size) {

  ctx.fillRect(x, y, size, size);

}



function drawShadow(_size, baseX, baseY) {

  const widthPx = Math.max(12, Math.min(22, SPRITE_W - 8));

  const startX = Math.round(baseX + (SPRITE_W - widthPx) / 2);

  const y = Math.min(GRID - 2, baseY + SPRITE_H - SPRITE_SCALE);

  ctx.fillStyle = "#0d0d0d";

  ctx.fillRect(startX, y, widthPx, SPRITE_SCALE);

}



const CAT_IDLE = [

  "oooooooooooooooo",

  "owwoooooooooowwo",

  "owwoooooooooowwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwoooooooooowwo",

];



const CAT_WALK = [

  "oooooooooooooooo",

  "owwoooooooooowwo",

  "owwoooooooooowwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwooooooooooooo",

];



const CAT_WALK_B = [

  "oooooooooooooooo",

  "owwoooooooooowwo",

  "owwoooooooooowwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "owwwwwwwwwwwwwwo",

  "ooooooooooooowwo",

];







const FACE = {

  eyeLeft: { x: 5, y: 7 },

  eyeRight: { x: 10, y: 7 },

  mouth: { x: 7, y: 11 },

  cheekLeft: { x: 3, y: 9 },

  cheekRight: { x: 13, y: 9 },

};



function drawFace(baseX, baseY, mood, blink) {

  const bx = Math.round(baseX);

  const by = Math.round(baseY);

  const exL = bx + FACE.eyeLeft.x * SPRITE_SCALE;

  const exR = bx + FACE.eyeRight.x * SPRITE_SCALE;

  const ey = by + FACE.eyeLeft.y * SPRITE_SCALE;

  const mx = bx + FACE.mouth.x * SPRITE_SCALE;

  const eatOffset = state.feedTimer > 0 ? (state.frame % 2 === 0 ? 0 : SPRITE_SCALE) : 0;

  const my = by + FACE.mouth.y * SPRITE_SCALE + eatOffset;

  const cxL = bx + FACE.cheekLeft.x * SPRITE_SCALE;

  const cxR = bx + FACE.cheekRight.x * SPRITE_SCALE;

  const cy = by + FACE.cheekLeft.y * SPRITE_SCALE;



  ctx.fillStyle = "#f1a7b6";

  if (mood === "happy") {

    block(cxL, cy, SPRITE_SCALE);

    block(cxR, cy, SPRITE_SCALE);

  }



  ctx.fillStyle = "#0d0d0d";

  const sleepyEyes = mood === "sleepy" || mood === "sad";

  const angryEyes = mood === "angry";

  const hungryEyes = mood === "hungry";

  if (mood === "poop") {

    block(exL - SPRITE_SCALE, ey + SPRITE_SCALE, SPRITE_SCALE);

    block(exL, ey + SPRITE_SCALE, SPRITE_SCALE);

    block(exR, ey + SPRITE_SCALE, SPRITE_SCALE);

    block(exR + SPRITE_SCALE, ey + SPRITE_SCALE, SPRITE_SCALE);

  } else if (!blink && !sleepyEyes) {

    block(exL, ey, SPRITE_SCALE);

    block(exR, ey, SPRITE_SCALE);

    if (angryEyes) {

      block(exL - SPRITE_SCALE, ey, SPRITE_SCALE);

      block(exR + SPRITE_SCALE, ey, SPRITE_SCALE);

    }

    if (hungryEyes) {

      block(exL, ey + SPRITE_SCALE, SPRITE_SCALE);

      block(exR, ey + SPRITE_SCALE, SPRITE_SCALE);

    }

  } else if (sleepyEyes) {

    block(exL - SPRITE_SCALE, ey + SPRITE_SCALE, SPRITE_SCALE);

    block(exL, ey + SPRITE_SCALE, SPRITE_SCALE);

    block(exR, ey + SPRITE_SCALE, SPRITE_SCALE);

    block(exR + SPRITE_SCALE, ey + SPRITE_SCALE, SPRITE_SCALE);

  } else {

    block(exL, ey + SPRITE_SCALE, SPRITE_SCALE);

    block(exR, ey + SPRITE_SCALE, SPRITE_SCALE);

  }



  if (mood === "happy") {

    block(mx, my, SPRITE_SCALE);

    block(mx + SPRITE_SCALE * 2, my, SPRITE_SCALE);

    block(mx + SPRITE_SCALE, my + SPRITE_SCALE, SPRITE_SCALE);

  } else if (mood === "surprised") {

    block(mx, my, SPRITE_SCALE);

    block(mx + SPRITE_SCALE, my, SPRITE_SCALE);

    block(mx, my + SPRITE_SCALE, SPRITE_SCALE);

    block(mx + SPRITE_SCALE, my + SPRITE_SCALE, SPRITE_SCALE);

  } else if (mood === "sad") {

    block(mx, my + SPRITE_SCALE, SPRITE_SCALE);

    block(mx + SPRITE_SCALE * 2, my + SPRITE_SCALE, SPRITE_SCALE);

    block(mx + SPRITE_SCALE, my, SPRITE_SCALE);

  } else if (mood === "angry") {

    block(mx, my, SPRITE_SCALE);

    block(mx + SPRITE_SCALE, my, SPRITE_SCALE);

    block(mx + SPRITE_SCALE * 2, my, SPRITE_SCALE);

  } else if (mood === "poop") {

    block(mx + SPRITE_SCALE, my + SPRITE_SCALE, SPRITE_SCALE);

  } else if (mood === "hungry") {

    block(mx, my, SPRITE_SCALE);

    block(mx + SPRITE_SCALE, my, SPRITE_SCALE);

    block(mx + SPRITE_SCALE * 2, my, SPRITE_SCALE);

    block(mx + SPRITE_SCALE, my + SPRITE_SCALE, SPRITE_SCALE);

  } else if (mood === "sleepy") {

    block(mx, my + SPRITE_SCALE, SPRITE_SCALE);

    block(mx + SPRITE_SCALE, my + SPRITE_SCALE, SPRITE_SCALE);

  } else {

    block(mx, my, SPRITE_SCALE);

  }

}

function drawCat(sprite, xBase, yBase) {

  const baseX = Math.round(xBase);

  const baseY = Math.round(yBase);

  for (let y = 0; y < sprite.length; y += 1) {

    const row = sprite[y];

    for (let x = 0; x < row.length; x += 1) {

      const c = row[x];

      if (c === ".") {

        continue;

      }

      if (c === "o") {

        ctx.fillStyle = "#0d0d0d";

      } else if (c === "w") {

        ctx.fillStyle = "#f6f6f6";

      } else if (c === "e") {

        ctx.fillStyle = "#0d0d0d";

      }

      block(baseX + x * SPRITE_SCALE, baseY + y * SPRITE_SCALE, SPRITE_SCALE);

    }

  }

}





function drawMonster({ yOffset, sprite, blink, shadowScale, mood, xBase, yBase }) {

  const unclampedY = Math.round(yBase + yOffset);

  const maxY = LOGICAL_GRID - SPRITE_H;

  const baseY = Math.max(0, Math.min(maxY, unclampedY));

  drawCat(sprite, xBase, baseY);

  drawFace(xBase, baseY, mood, blink);

  drawShadow(shadowScale, xBase, baseY);

}



function drawFood(x, y) {

  // bigger steak with fat rim + highlights

  ctx.fillStyle = "#8e1517";

  for (let ix = 2; ix <= 13; ix += 1) {

    pixel(x + ix, y + 3);

    pixel(x + ix, y + 4);

  }

  for (let ix = 1; ix <= 14; ix += 1) {

    pixel(x + ix, y + 5);

    pixel(x + ix, y + 6);

  }

  for (let ix = 2; ix <= 13; ix += 1) {

    pixel(x + ix, y + 7);

  }

  ctx.fillStyle = "#b21d1d";

  for (let ix = 3; ix <= 12; ix += 1) {

    pixel(x + ix, y + 4);

    pixel(x + ix, y + 5);

  }

  ctx.fillStyle = "#f4d6b4";

  pixel(x + 1, y + 4);

  pixel(x + 1, y + 5);

  pixel(x + 1, y + 6);

  pixel(x + 2, y + 7);

  pixel(x + 3, y + 8);

  pixel(x + 4, y + 8);

  ctx.fillStyle = "#f38a96";

  pixel(x + 5, y + 4);

  pixel(x + 7, y + 4);

  pixel(x + 6, y + 6);

  pixel(x + 9, y + 6);

}



function drawFoodMedium(x, y) {

  ctx.fillStyle = "#8e1517";

  for (let ix = 1; ix <= 6; ix += 1) {

    pixel(x + ix, y + 2);

    pixel(x + ix, y + 3);

  }

  for (let ix = 0; ix <= 7; ix += 1) {

    pixel(x + ix, y + 4);

  }

  ctx.fillStyle = "#f4d6b4";

  pixel(x + 0, y + 3);

  pixel(x + 1, y + 4);

  ctx.fillStyle = "#f38a96";

  pixel(x + 3, y + 3);

  pixel(x + 5, y + 3);

}



function drawFoodSmall(x, y) {

  ctx.fillStyle = "#8e1517";

  for (let ix = 0; ix <= 4; ix += 1) {

    pixel(x + ix, y + 2);

  }

  for (let ix = 1; ix <= 3; ix += 1) {

    pixel(x + ix, y + 3);

  }

  ctx.fillStyle = "#f4d6b4";

  pixel(x + 0, y + 2);

  ctx.fillStyle = "#f38a96";

  pixel(x + 2, y + 2);

}



function drawFoodLevel(x, y, level) {

  if (level === 0) {

    drawFood(x, y);

  } else if (level === 1) {

    drawFoodMedium(x + 2, y + 1);

  } else {

    drawFoodSmall(x + 4, y + 2);

  }

}



function drawCrumb(x, y) {

  ctx.fillStyle = "#f2d6b3";

  pixel(x, y);

}



function drawHeart(x, y) {

  ctx.fillStyle = "#e34b4b";

  for (let dy = 0; dy < 8; dy += 1) {

    for (let dx = 0; dx < 10; dx += 1) {

      const on =

        (dy === 0 && (dx === 2 || dx === 3 || dx === 6 || dx === 7)) ||

        (dy === 1 && dx >= 1 && dx <= 8) ||

        (dy === 2 && dx >= 1 && dx <= 8) ||

        (dy === 3 && dx >= 2 && dx <= 7) ||

        (dy === 4 && dx >= 3 && dx <= 6) ||

        (dy === 5 && dx >= 4 && dx <= 5);

      if (on) {

        pixel(x + dx, y + dy);

      }

    }

  }

}



const POOP_W = 15;

const POOP_H = 11;



function drawPoop(x, y, level = 0) {

  const rows = [

    ".......o.......",

    "......ooo......",

    ".....obbo......",

    "....obbbbo.....",

    "...obbbbbbo....",

    "..obbbbbbbbo...",

    ".obbbbbbbbbbo..",

    ".obbbbbbbbbbo..",

    "..obbbbbbbbo...",

    "...obbbbbo.....",

    "....ooooo......",

  ];

  const visibleRows = Math.max(0, rows.length - level * 2);

  for (let ry = 0; ry < visibleRows; ry += 1) {

    const row = rows[ry];

    for (let rx = 0; rx < row.length; rx += 1) {

      const c = row[rx];

      if (c === ".") {

        continue;

      }

      ctx.fillStyle = c === "o" ? "#0d0d0d" : "#8b4b2a";

      pixel(x + rx, y + ry);

    }

  }

}



function drawGurgle(x, y, phase) {

  ctx.fillStyle = "#d8b06a";

  const wobble = phase % 3;

  pixel(x + 1 + wobble, y);

  pixel(x + wobble, y + 1);

  pixel(x + 2 + wobble, y + 1);

  pixel(x + 1 + wobble, y + 2);

}



function drawCough(x, y, phase) {

  if (phase % 4 > 2) {

    return;

  }

  ctx.fillStyle = "#b7c5d6";

  pixel(x, y);

  pixel(x + 1, y);

  pixel(x, y + 1);

}



function drawZzz(x, y, phase) {

  ctx.fillStyle = "#a8cbe6";

  const shift = (phase % 3) * SPRITE_SCALE;

  const s = SPRITE_SCALE;

  block(x + shift, y, s);

  block(x + s + shift, y, s);

  block(x + s * 2 + shift, y, s);

  block(x + s * 2 + shift, y + s, s);

  block(x + s + shift, y + s * 2, s);

  block(x + shift, y + s * 3, s);

  block(x + s + shift, y + s * 3, s);

  block(x + s * 2 + shift, y + s * 3, s);

}



function drawSickTint(x, y) {

  ctx.save();

  ctx.globalAlpha = 0.35;

  ctx.fillStyle = "#b85a5a";

  ctx.fillRect(x + 4 * SPRITE_SCALE, y + 4 * SPRITE_SCALE, 8 * SPRITE_SCALE, 3 * SPRITE_SCALE);

  ctx.restore();

}



function drawSweat(x, y, phase) {

  ctx.fillStyle = "#9bd1e5";

  const bob = phase % 2 === 0 ? 0 : 1;

  pixel(x, y + bob);

  pixel(x + 1, y + bob);

  pixel(x, y + 1 + bob);

}



function drawDust(x, y, opacity = 1) {

  ctx.save();

  ctx.globalAlpha = opacity;

  ctx.fillStyle = "#9a9a9a";

  const spots = [

    [2, 3], [3, 3], [2, 4],

    [7, 5], [8, 5], [7, 6],

    [11, 2], [12, 2], [11, 3],

    [4, 10], [5, 10], [4, 11],

    [12, 8], [13, 8], [12, 9],

    [9, 12], [10, 12], [9, 13],

    [1, 7], [2, 7], [1, 8],

    [6, 1], [7, 1], [6, 2],

    [14, 6], [15, 6], [14, 7],

    [3, 14], [4, 14], [3, 15],

    [8, 9], [9, 9], [8, 10],

    [13, 12], [14, 12], [13, 13],

    [15, 14], [14, 15], [15, 15],

    [10, 14], [11, 14], [10, 15],

  ];

  for (const [dx, dy] of spots) {

    block(x + dx * SPRITE_SCALE, y + dy * SPRITE_SCALE, SPRITE_SCALE);

  }

  ctx.restore();

}



function drawSponge(x, y) {

  const rows = [

    "..oooooo....",

    ".owwwwwwo...",

    "owwwwwwwwo..",

    "owwweewwwo..",

    "owwwwwwwwo..",

    ".owwwwwwo...",

    "..oooooo....",

  ];

  for (let ry = 0; ry < rows.length; ry += 1) {

    const row = rows[ry];

    for (let rx = 0; rx < row.length; rx += 1) {

      const c = row[rx];

      if (c === ".") {

        continue;

      }

      if (c === "o") {

        ctx.fillStyle = "#0d0d0d";

      } else if (c === "w") {

        ctx.fillStyle = "#f2c04f";

      } else {

        ctx.fillStyle = "#d89d2c";

      }

      block(x + rx * SPONGE_SCALE, y + ry * SPONGE_SCALE, SPONGE_SCALE);

    }

  }

}



function drawPill(x, y) {

  const rows = [

    "....rrr.....",

    "...rrrrr....",

    "..rrrrrrr...",

    ".rrrrrrrrr..",

    "rrrrrrrrrww",

    "rrrrrrwwwww",

    ".rrrwwwwwww",

    "..rwwwwwwww",

    "...rwwwwwww",

    "....wwwwww.",

    ".....wwww..",

    "......ww...",

  ];

  const height = rows.length;

  for (let ry = 0; ry < rows.length; ry += 1) {

    const row = rows[ry];

    for (let rx = 0; rx < row.length; rx += 1) {

      const c = row[rx];

      if (c === ".") {

        continue;

      }

      const left = rx > 0 ? row[rx - 1] : ".";

      const right = rx < row.length - 1 ? row[rx + 1] : ".";

      const up = ry > 0 ? (rows[ry - 1][rx] ?? ".") : ".";

      const down = ry < height - 1 ? (rows[ry + 1][rx] ?? ".") : ".";

      const isEdge = left === "." || right === "." || up === "." || down === ".";

      if (isEdge) {

        ctx.fillStyle = "#0d0d0d";

      } else if (c === "r") {

        ctx.fillStyle = "#c43636";

      } else {

        ctx.fillStyle = "#f5f5f5";

      }

      pixel(x + rx, y + ry);

    }

  }

}



function drawBubble(x, y) {

  ctx.fillStyle = "#cfeaf7";

  const points = [

    [1, 0], [2, 0], [3, 0],

    [0, 1], [1, 1], [2, 1], [3, 1], [4, 1],

    [0, 2], [1, 2], [2, 2], [3, 2], [4, 2],

    [1, 3], [2, 3], [3, 3],

  ];

  for (const [dx, dy] of points) {

    pixel(x + dx, y + dy);

  }

  ctx.fillStyle = "#f7fbff";

  pixel(x + 1, y + 1);

  pixel(x + 2, y + 1);

}



function drawBlanket(x, y) {

  const topY = y + 11 * SPRITE_SCALE;

  const width = SPRITE_W - SPRITE_SCALE * 2;

  const startX = x + SPRITE_SCALE;

  ctx.fillStyle = "#9bb0c6";

  ctx.fillRect(startX, topY, width, SPRITE_H - (topY - y));

  ctx.fillStyle = "#b9c9da";

  ctx.fillRect(startX, topY, width, SPRITE_SCALE);

  ctx.fillStyle = "#7f93a8";

  for (let i = 0; i < 6; i += 1) {

    block(startX + i * SPRITE_SCALE * 2, topY - SPRITE_SCALE, SPRITE_SCALE, SPRITE_SCALE);

  }

}



function drawFrame() {

  clearScreen();



  const blink = state.blink > 0 && state.mood !== "sleepy";

  let yOffset = 0;

  let sprite = CAT_IDLE;

  let shadowScale = 5;

  if (state.mode === "walk") {

    const phase = walkFrames[state.frame % walkFrames.length] % 2;

    yOffset = state.frame % 2 === 0 ? 0 : 1;

    sprite = phase === 0 ? CAT_WALK : CAT_WALK_B;

    shadowScale = 6;

  } else if (state.mode === "jump") {

    const frame = jumpFrames[state.frame % jumpFrames.length];

    yOffset = frame === 1 ? -1 : 0;

    shadowScale = frame === 1 ? 3 : 5;

  }

  drawMonster({

    yOffset,

    sprite,

    blink,

    shadowScale,

    mood: state.mood,

    xBase: state.x,

    yBase: state.y,

  });



  const baseX = Math.round(state.x);

  const unclampedY = Math.round(state.y + yOffset);

  const maxY = LOGICAL_GRID - SPRITE_H;

  const baseY = Math.max(0, Math.min(maxY, unclampedY));



    if (state.poops.length > 0) {

      for (const poop of state.poops) {

        drawPoop(poop.x, poop.y, poop.clean || 0);

      }

    }

  if (state.hungry) {

    drawGurgle(baseX + 7 * SPRITE_SCALE, baseY + 12 * SPRITE_SCALE, state.frame);

  }

  if (state.sick) {

    drawSickTint(baseX, baseY);

    drawCough(baseX + 11 * SPRITE_SCALE, baseY + 11 * SPRITE_SCALE, state.frame);

  }

  if (state.pooping) {

    drawSweat(baseX + 12 * SPRITE_SCALE, baseY + 5 * SPRITE_SCALE, state.frame);

  }

  if (state.dirty) {

    drawDust(baseX, baseY, state.dirtOpacity);

  }

  if (state.washing) {

    drawSponge(state.sponge.x, state.sponge.y);

  }

  if (state.medicineTimer > 0) {

    const mouthX = baseX + FACE.mouth.x * SPRITE_SCALE;

    const mouthY = baseY + FACE.mouth.y * SPRITE_SCALE;

    const pillLevel = state.medicineTimer > 6 ? 0 : state.medicineTimer > 3 ? 1 : 2;

    const bob = state.frame % 2 === 0 ? 0 : SPRITE_SCALE;

    drawPill(mouthX - 6, mouthY - 10 + pillLevel * 4 + bob);

  }

  if (state.restTimer > 0 || state.sleeping) {

    drawBlanket(baseX, baseY);

    drawZzz(baseX + 9 * SPRITE_SCALE, baseY - 7, state.frame);

  }



  if (state.feedTimer > 0) {

    const foodX = baseX + 10;

    const foodY = baseY + 33;

    const foodLevel = state.feedTimer > 8 ? 0 : state.feedTimer > 4 ? 1 : 2;

    drawFoodLevel(foodX, foodY, foodLevel);

    if (state.feedTimer % 2 === 0) {

      ctx.fillStyle = "#0d0d0d";

      const biteOffset = state.frame % 2 === 0 ? 0 : SPRITE_SCALE;

      pixel(baseX + 4, baseY + 6 + biteOffset);

    }

  }



  for (const crumb of state.crumbs) {

    drawCrumb(Math.round(crumb.x), Math.round(crumb.y));

  }



  for (const heart of state.hearts) {

    drawHeart(Math.round(heart.x), Math.round(heart.y));

  }

  for (const bubble of state.bubbles) {

    drawBubble(Math.round(bubble.x), Math.round(bubble.y));

  }



  if (state.sleeping) {

    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";

    ctx.fillRect(0, 0, canvas.width, canvas.height);

  }

}



function pickMood() {

  if (state.pooping) {

    return "poop";

  }

  if (state.sleeping) {

    return "sleepy";

  }

  if (state.sick || state.sleepy) {

    return "sleepy";

  }

  if (state.hungry) {

    return "hungry";

  }

  if (state.petTimer > 0) {

    return "happy";

  }

  if (state.feedTimer > 0) {

    return "happy";

  }

  if (state.restTimer > 0 || state.sleeping) {

    return "sleepy";

  }

  if (state.mode === "idle") {

    return "sleepy";

  }

  if (state.mode === "jump") {

    return "surprised";

  }

  const roll = Math.random();

  if (roll < 0.55) {

    return "neutral";

  }

  if (roll < 0.7) {

    return "happy";

  }

  if (roll < 0.82) {

    return "surprised";

  }

  if (roll < 0.92) {

    return "sleepy";

  }

  if (roll < 0.97) {

    return "sad";

  }

  return "angry";

}



function advanceMode() {

  if (

    state.feedTimer > 0 ||

    state.washing ||

    state.medicineTimer > 0 ||

    state.restTimer > 0 ||

    state.sleeping ||

    state.pooping

  ) {

    state.mode = "idle";

    modeLabel.textContent = state.mode.toUpperCase();

    return;

  }

  if (state.petTimer > 0) {

    state.mode = "idle";

    modeLabel.textContent = state.mode.toUpperCase();

    return;

  }

  if (state.modeTimer > 0) {

    state.modeTimer -= 1;

    return;

  }



  if (state.mode === "jump") {

    state.mode = "idle";

    state.modeTimer = 8 + Math.floor(Math.random() * 6);

  } else if (state.mode === "idle") {

    state.mode = "walk";

    state.modeTimer = 14 + Math.floor(Math.random() * 10);

  } else if (Math.random() < 0.2) {

    state.mode = "jump";

    state.modeTimer = 4 + Math.floor(Math.random() * 3);

  } else if (Math.random() < 0.35) {

    state.mode = "idle";

    state.modeTimer = 8 + Math.floor(Math.random() * 6);

  } else {

    state.modeTimer = 14 + Math.floor(Math.random() * 10);

  }



  modeLabel.textContent = state.mode.toUpperCase();

}



function advanceMood() {

  if (state.moodTimer > 0) {

    state.moodTimer -= 1;

    return;

  }



  state.mood = pickMood();

  state.moodTimer = 6 + Math.floor(Math.random() * 8);

}



function spawnHeart() {

  if (state.hearts.length > 0) {

    return;

  }

  const baseX = Math.round(state.x) + Math.floor(SPRITE_W / 2) - 5;

  const baseY = Math.round(state.y) - 4;

  state.hearts.push({

    x: baseX + (Math.random() - 0.5) * 2,

    y: Math.max(0, baseY),

    vy: -0.25 - Math.random() * 0.25,

    ttl: 10,

  });

}



function clamp(value, min, max) {

  return Math.max(min, Math.min(max, value));

}



function pick(arr) {

  if (!Array.isArray(arr) || arr.length === 0) return "";

  return arr[Math.floor(Math.random() * arr.length)];

}



function hasJongseongLocal(word) {

  const last = word?.[word.length - 1];

  if (!last) return false;

  const code = last.charCodeAt(0);

  if (code < 0xac00 || code > 0xd7a3) return false;

  return (code - 0xac00) % 28 !== 0;

}



function pickParticle(word, pair) {

  const [first, second] = pair.split("/");

  if (!first || !second) return first || "";

  return hasJongseongLocal(word) ? first : second;

}



function formatWithParticles(template, { user, pet }) {

  return template

    .replace(/\{user\}\{(이\/가|을\/를|아\/야|과\/와)\}/g, (_, pair) => {

      const name = user || "너";

      return `${name}${pickParticle(name, pair)}`;

    })

    .replace(/\{pet\}\{(이\/가|을\/를|아\/야|과\/와)\}/g, (_, pair) => {

      const name = pet || "펫";

      return `${name}${pickParticle(name, pair)}`;

    })

    .replace(/\{user\}/g, user || "너")

    .replace(/\{pet\}/g, pet || "펫");

}



function setStatFill(el, value) {

  if (!el) {

    return;

  }

  const safe = clamp(value, 0, 100);

  el.style.width = `${safe}%`;

}



function syncStatusButtons() {

  if (statePoopBtn) statePoopBtn.classList.toggle("is-active", isStatusActive("poop"));

  if (stateHungryBtn) stateHungryBtn.classList.toggle("is-active", isStatusActive("hungry"));

  if (stateSickBtn) stateSickBtn.classList.toggle("is-active", isStatusActive("sick"));

  if (stateSleepyBtn) stateSleepyBtn.classList.toggle("is-active", isStatusActive("sleepy"));

  if (stateDirtyBtn) stateDirtyBtn.classList.toggle("is-active", isStatusActive("dirty"));

}



function updateSleepUI() {

  const disabled = Boolean(uiLocked || state.dead || state.sleeping);

  const statButtons = [

    statePoopBtn,

    stateHungryBtn,

    stateDirtyBtn,

    stateSleepyBtn,

    stateSickBtn,

    stateAnnoyedBtn,

    stateDeathBtn,

  ];

  statButtons.forEach((btn) => {

    if (!btn) return;

    btn.disabled = disabled;

    btn.setAttribute("aria-disabled", disabled ? "true" : "false");

  });

  if (actionBtn2) {

    actionBtn2.disabled = disabled;

    actionBtn2.setAttribute("aria-disabled", disabled ? "true" : "false");

  }

}



function updateStatUI() {

  setStatFill(statHunger, state.hunger);

  setStatFill(statHealth, state.health);

  setStatFill(statClean, state.clean);

  setStatFill(statHappy, state.happy);

  setStatFill(statEnergy, state.energy);

  setStatFill(statLife, state.life);

  syncStatusButtons();

  updateSleepUI();

}



function updateVitals(timestamp) {

  if (uiLocked) {

    setScreenDeadVisible(true);

    return;

  }

  if (state.dead) {

    if (!state.deadShown && speechBubble) {

      showSpeech("...", 30, 9999);

      state.deadShown = true;

    }

    return;

  }

  ensureDailyFeedReset();

  if (!state.lastVitalTick) {

    state.lastVitalTick = timestamp;

    return;

  }

  const delta = timestamp - state.lastVitalTick;

  if (delta < VITAL_INTERVAL) {

    return;

  }

  const steps = Math.floor(delta / VITAL_INTERVAL);

  state.lastVitalTick += steps * VITAL_INTERVAL;



  for (let i = 0; i < steps; i += 1) {

    const poopPenalty = state.poops.length;

    const decay = state.sleeping ? SLEEP_DECAY_FACTOR : 1;

    state.hunger -= HUNGER_DECAY * decay;

    state.clean -= (1 + poopPenalty) * decay;

    state.happy -= 1 * decay;

    state.energy += state.sleeping ? SLEEP_ENERGY_GAIN : -1;



    if (state.hunger <= VITAL_THRESHOLDS.hungry) state.happy -= 1;

    if (state.clean <= VITAL_THRESHOLDS.dirty) state.happy -= 1;

    if (state.sleepy && !state.sleeping) state.happy -= 1;



    let sickChance = 0.2;

    if (state.happy <= 30) sickChance += 0.1;

    if (state.happy <= 15) sickChance += 0.1;

    if (

      !state.sick &&

      (state.clean <= VITAL_THRESHOLDS.dirtyCritical || state.hunger <= VITAL_THRESHOLDS.hungryCritical) &&

      Math.random() < sickChance

    ) {

      state.sick = true;

    }



    if (state.hunger <= VITAL_THRESHOLDS.hungryCritical) state.health -= 2;

    if (state.clean <= VITAL_THRESHOLDS.dirtyCritical) state.health -= 2;

    if (state.sick) state.health -= 2;

    if (state.energy <= 10 && !state.sleeping) state.health -= 1;



    let critical = 0;

    if (state.hunger <= VITAL_THRESHOLDS.hungryCritical) critical += 1;

    if (state.clean <= VITAL_THRESHOLDS.dirtyCritical) critical += 1;

    if (state.health <= 20) critical += 1;

    if (critical >= 2) state.life -= 4;



  }



  if (!state.lastPoopCheck) {

    state.lastPoopCheck = timestamp;

  } else {

    const elapsed = timestamp - state.lastPoopCheck;

    if (elapsed >= POOP_INTERVAL) {

      const tries = Math.floor(elapsed / POOP_INTERVAL);

      state.lastPoopCheck += tries * POOP_INTERVAL;

      for (let i = 0; i < tries; i += 1) {

        if (!state.pooping && Math.random() < POOP_CHANCE) {

          startPooping(8);

          break;

        }

      }

    }

  }



  state.hunger = clamp(state.hunger, 0, 100);

  state.clean = clamp(state.clean, 0, 100);

  state.happy = clamp(state.happy, 0, 100);

  state.energy = clamp(state.energy, 0, 100);

  state.health = clamp(state.health, 0, 100);

  state.life = clamp(state.life, 0, 100);



  const prevHungry = state.hungry;

  const prevDirty = state.dirty;

  const prevSleepy = state.sleepy;

  const prevSick = state.sick;

  const prevAnnoyed = state.happy <= 25;



  state.hungry = !state.sleeping && state.hunger <= VITAL_THRESHOLDS.hungry;

  state.dirty = state.clean <= VITAL_THRESHOLDS.dirty;

  state.sleepy = !state.sleeping && state.energy <= VITAL_THRESHOLDS.sleepy;

  if (state.health <= VITAL_THRESHOLDS.sick) {

    state.sick = true;

  } else if (state.health >= VITAL_THRESHOLDS.recoverSick) {

    state.sick = false;

  }
  const notifyName = petName || "펫";
  if (state.hungry && !prevHungry) {
    showLocalNotification(notifyName, "나 배고파!", "hungry");
  }
  if (state.dirty && !prevDirty) {
    showLocalNotification(notifyName, "내 몸에서 냄새가 나!", "dirty");
  }
  if (state.sick && !prevSick) {
    showLocalNotification(notifyName, "콜록콜록, 나 몸이 안 좋아.", "sick");
  }
  if (state.sleepy && !prevSleepy) {
    showLocalNotification(notifyName, "하암~ 나 너무 졸려.", "sleepy");
  }
  if (state.happy <= 25 && !prevAnnoyed) {
    showLocalNotification(notifyName, "흥! 치! 뿌!", "annoyed");
  }



  if (!state.dead && speechBubble) {

    if (state.hungry && !prevHungry) {

      showSpeech("배고파...", 18, 80);

      state.mood = "hungry";

      state.moodTimer = 6;

    }

    if (state.dirty && !prevDirty) {

      showSpeech("찝찝해...", 18, 80);

      state.mood = "sad";

      state.moodTimer = 6;

    }

    if (state.sleepy && !prevSleepy) {

      showSpeech("졸려...", 18, 80);

      state.mood = "sleepy";

      state.moodTimer = 6;

    }

    if (state.sick && !prevSick) {

      showSpeech("몸이 안 좋아...", 18, 80);

      state.mood = "sleepy";

      state.moodTimer = 6;

    }

  }



  if (state.hungry && !state.sleeping) {

    playHungrySfx();

  }

  if (state.sleepy && !state.sleeping) {

    playSleepySfx();

  }



  if (state.health <= 0 || state.life <= 0) {

    enterDeathState();

  }

}



function tick(timestamp) {

  if (timestamp - state.lastTick > TICK) {

    state.lastTick = timestamp;

    updateVitals(timestamp);

    updateStatUI();

    if (uiLocked) {

      drawFrame();

      requestAnimationFrame(tick);

      return;

    }

    if (state.dead) {

      drawFrame();

      requestAnimationFrame(tick);

      return;

    }

    state.frame = (state.frame + 1) % 8;

    state.blink = state.blink > 0 ? state.blink - 1 : 0;

    // blink disabled

    if (state.petTimer > 0) {

      state.petTimer -= 1;

    }

    if (state.feedTimer > 0) {

      state.feedTimer -= 1;

      if (state.feedTimer % 2 === 0) {

        state.crumbs.push({

          x: state.x + 12 + (Math.random() - 0.5) * 4,

          y: state.y + 8,

          vy: 0.2 + Math.random() * 0.3,

          ttl: 6,

        });

      }

      if (state.feedTimer === 0 && speechBubble) {

        showSpeech("배부르다", 14, 80);

        state.hungry = false;

      }

    }

    if (state.medicineTimer > 0) {

      state.medicineTimer -= 1;

      if (state.medicineTimer === 0) {

        state.sick = false;

      }

    }

    if (state.restTimer > 0) {

      state.restTimer -= 1;

      if (state.restTimer === 0) {

        state.sleepy = false;

      }

    }

    if (state.poopTimer > 0) {

      state.poopTimer -= 1;

      if (state.poopTimer === 0) {

        spawnPoop();

        state.pooping = false;

        if (!state.sleepy && !state.sick) {

          state.mode = "walk";

          state.modeTimer = 8 + Math.floor(Math.random() * 6);

        }

        state.mood = "neutral";

        state.moodTimer = 4;

      }

    }

    state.crumbs = state.crumbs

      .map((crumb) => ({ ...crumb, y: crumb.y + crumb.vy, ttl: crumb.ttl - 1 }))

      .filter((crumb) => crumb.ttl > 0);

    state.hearts = state.hearts

      .map((heart) => ({ ...heart, y: heart.y + heart.vy, ttl: heart.ttl - 1 }))

      .filter((heart) => heart.ttl > 0 && heart.y >= 0);

    state.bubbles = state.bubbles

      .map((bubble) => ({ ...bubble, y: bubble.y - 0.2, ttl: bubble.ttl - 1 }))

      .filter((bubble) => bubble.ttl > 0);

    if (state.washing) {

      const ease = 1;

      state.sponge.x += (state.spongeTarget.x - state.sponge.x) * ease;

      state.sponge.y += (state.spongeTarget.y - state.sponge.y) * ease;

    }

    advanceMode();

    advanceMood();

    if (speechTimer > 0) {

      speechTimer -= 1;

      if (speechTimer === 0 && speechBubble) {

        speechBubble.hidden = true;

      }

    } else {

      if (speechCooldown > 0) {

        speechCooldown -= 1;

      } else if (Math.random() < 0.2 && speechBubble) {

        const line = SPEECH_LINES[Math.floor(Math.random() * SPEECH_LINES.length)];

        speechBubble.textContent = line;

        speechBubble.hidden = false;

        speechTimer = 18 + Math.floor(Math.random() * 8);

        speechCooldown = 60 + Math.floor(Math.random() * 60);

      }

    }

    if (

      state.mode === "walk" &&

      state.petTimer === 0 &&

      state.feedTimer === 0 &&

      !state.washing &&

      state.medicineTimer === 0 &&

      state.restTimer === 0 &&

      !state.sleeping &&

      !state.sleepy &&

      !state.pooping

    ) {

      const maxX = LOGICAL_GRID - SPRITE_W;

      const minY = Math.max(0, -Y_OFFSET_MIN);

      const maxY = LOGICAL_GRID - SPRITE_H - Y_OFFSET_MAX;

      const accel = state.sick ? 0.05 : 0.12;

      state.vx += (Math.random() - 0.5) * accel;

      state.vy += (Math.random() - 0.5) * accel;

      const speed = Math.hypot(state.vx, state.vy);

      const maxSpeed = state.sick ? 0.35 : 0.8;

      if (speed > maxSpeed) {

        state.vx = (state.vx / speed) * maxSpeed;

        state.vy = (state.vy / speed) * maxSpeed;

      }

      state.x += state.vx;

      state.y += state.vy;

      if (state.x < 0) {

        state.x = 0;

        state.vx = Math.abs(state.vx) + Math.random() * 0.2;

      } else if (state.x > maxX) {

        state.x = maxX;

        state.vx = -Math.abs(state.vx) - Math.random() * 0.2;

      }

      if (state.y < minY) {

        state.y = minY;

        state.vy = Math.abs(state.vy) + Math.random() * 0.2;

      } else if (state.y > maxY) {

        state.y = maxY;

        state.vy = -Math.abs(state.vy) - Math.random() * 0.2;

      }

    }

    chatCtx.poopCount = state.poops.length;

    persistPetState();

  }

  drawFrame();

  requestAnimationFrame(tick);

}



if (petName) {

  loadPetState();

}

drawFrame();

updateStatUI();

setSleepMenuLabel();

applySettingsUI();

registerAudioUnlock();
initSideModules();
setAdminControlsVisible(adminUnlocked);
chatCtx.petName = petName;
initPushNotifications();
registerPushToken();
if (!petName) {
  setUiLocked(true);
  openNameModal();
} else {
  setUiLocked(false);

}

requestAnimationFrame(tick);



window.addEventListener("beforeunload", () => {

  if (!allowStatePersist) {

    return;

  }

  persistPetState(true);
  syncPetStateToServer(true);

});

document.addEventListener("visibilitychange", () => {

  if (document.visibilityState === "hidden") {

    if (!allowStatePersist) {

      return;

    }

    persistPetState(true);
    syncPetStateToServer(true);

  }

});



if (actionMenuMain) {

  actionMenuMain.hidden = true;

}

if (actionMenuCare) {

  actionMenuCare.hidden = true;

}



function setMenuActive(index) {

  if (!menuItems.length) {

    return;

  }

  menuItems.forEach((item, idx) => {

    item.classList.toggle("is-active", idx === index);

  });

}



function setMenuItems(menu) {

  menuItems = menu ? Array.from(menu.querySelectorAll(".action-menu__item")) : [];

  sleepMenuItem = null;

  if (menu === actionMenuCare) {

    sleepMenuItem = menuItems.find((item) => {

      const action = item.getAttribute("data-action") || "";

      const label = item.textContent || "";

      return (

        action === "rest" ||

        action === "sleep" ||

        action === "wake" ||

        label.includes("휴식") ||

        label.includes("재우기") ||

        label.includes("깨우기")

      );

    });

  }

  syncCareMenuForSleep();

}



function openMenu(menu) {

  if (!menu) {

    return;

  }

  if (actionMenuMain) actionMenuMain.hidden = menu !== actionMenuMain;

  if (actionMenuCare) actionMenuCare.hidden = menu !== actionMenuCare;

  activeMenu = menu;

  setMenuItems(menu);

  menuIndex = 0;

  setMenuActive(menuIndex);

  if (activeMenu === actionMenuCare) {

    setSleepMenuLabel();

  }

  syncCareMenuForSleep();

}



function closeMenu() {

  if (actionMenuMain) actionMenuMain.hidden = true;

  if (actionMenuCare) actionMenuCare.hidden = true;

  activeMenu = null;

  menuItems = [];

  sleepMenuItem = null;

}



function initSideModules() {

  sideModuleToggles.forEach((toggle) => {

    const module = toggle.closest(".side-module");

    if (!module) return;

    toggle.addEventListener("click", () => {

      const collapsed = module.classList.toggle("is-collapsed");

      toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");

    });

  });

  if (window.matchMedia("(max-width: 420px)").matches) {

    sideModules.forEach((module) => {

      module.classList.add("is-collapsed");

      const toggle = module.querySelector(".side-module__toggle");

      if (toggle) {

        toggle.setAttribute("aria-expanded", "false");

      }

    });

  }

}



function toggleMenu() {

  if (uiLocked) {

    return;

  }

  if (!actionMenuMain) {

    return;

  }

  if (actionMenuMain.hidden) {

    if (state.sleeping && actionMenuCare) {

      openMenu(actionMenuCare);

    } else {

      openMenu(actionMenuMain);

    }

  } else {

    closeMenu();

  }

}



function bindMenuClick(menu) {

  if (!menu) {

    return;

  }

  menu.addEventListener("click", (event) => {

    const target = event.target;

    if (!(target instanceof HTMLElement)) {

      return;

    }

    const item = target.closest(".action-menu__item");

    if (!item) {

      return;

    }

    const index = menuItems.indexOf(item);

    if (index >= 0) {

      menuIndex = index;

      setMenuActive(menuIndex);

      selectMenu();

    }

  });

}

bindMenuClick(actionMenuMain);

bindMenuClick(actionMenuCare);



function moveMenu(delta) {

  if (!menuItems.length || !activeMenu || activeMenu.hidden) {

    return;

  }

  menuIndex = (menuIndex + delta + menuItems.length) % menuItems.length;

  setMenuActive(menuIndex);

}



function startWash() {

  state.washing = true;

  state.washScrub = 0;

  state.washOverdone = false;

  state.mode = "idle";

  state.mood = "neutral";

  state.dirtOpacity = 1;

  stopShowerSound();

  if (state.dirty) {

    state.dirtOpacity = 1;

  }

  state.spongeTarget = {

    x: Math.max(0, Math.min(LOGICAL_GRID - SPONGE_W, Math.round(state.x) + 8)),

    y: Math.max(0, Math.min(LOGICAL_GRID - SPONGE_H, Math.round(state.y) + 6)),

  };

  state.sponge = { ...state.spongeTarget };

  modeLabel.textContent = state.mode.toUpperCase();

}



function getMenuAction(item) {

  if (!item) {

    return null;

  }

  return item.getAttribute("data-action") || item.textContent?.trim() || null;

}



function setSleepMenuLabel() {

  if (!sleepMenuItem) {

    return;

  }

  if (state.sleeping) {

    sleepMenuItem.textContent = "깨우기";

    sleepMenuItem.setAttribute("data-action", "wake");

  } else {

    sleepMenuItem.textContent = "재우기";

    sleepMenuItem.setAttribute("data-action", "sleep");

  }

}



function syncCareMenuForSleep() {

  if (!menuItems.length || activeMenu !== actionMenuCare) {

    return;

  }

  menuItems.forEach((item) => {

    const action = item.getAttribute("data-action") || "";

    const label = item.textContent || "";

    const isWake = action === "wake" || label.includes("깨우기");

    if (state.sleeping) {

      item.hidden = !isWake;

      item.setAttribute("aria-disabled", isWake ? "false" : "true");

    } else {

      item.hidden = false;

      item.setAttribute("aria-disabled", "false");

    }

  });

}



function handleMenuAction(action) {

  if (!action) {

    return;

  }

  if (uiLocked) {

    return;

  }

  if (state.sleeping && action !== "wake" && action !== "깨우기") {

    if (speechBubble) {

      showSpeech("자고 있어... 깨워줘.", 18, 80);

    }

    return;

  }

  if (state.dead) {

    if (speechBubble) {

      showSpeech("...", 20, 9999);

    }

    return;

  }

  if (state.washing && action !== "\uC528\uAE30\uAE30" && action !== "wash") {

    state.washing = false;

    state.washScrub = 0;

    state.dirtOpacity = 1;

    state.washOverdone = false;

    stopShowerSound();

  }

  ensureDailyFeedReset();

  ensureFeedWindow(performance.now());

  if (action === "\uBC25\uC8FC\uAE30" || action === "feed") {

    if (state.hunger >= 80) {

      showSpeech("아직 배가 많이 안 고파.", 18, 80);

      state.happy = clamp(state.happy - 5, 0, 100);

      state.mood = "sad";

      state.moodTimer = 6;

      updateStatUI();

      return;

    }

    state.feedTimer = 13;

    state.mode = "idle";

    state.mood = "happy";

    state.crumbs = [];

    state.hunger = clamp(state.hunger + 50, 0, 100);

    state.happy = clamp(state.happy + 8, 0, 100);

    state.energy = clamp(state.energy + 5, 0, 100);

    state.life = clamp(state.life + 4, 0, 100);

    state.feedCount += 1;

    modeLabel.textContent = state.mode.toUpperCase();

  } else if (action === "\uC528\uAE30\uAE30" || action === "wash") {

    const overwash = state.clean >= 95 && !state.dirty;

    startWash();

    if (overwash) {

      showSpeech("너무 씻어서 피곤해...", 18, 80);

      state.happy = clamp(state.happy - 4, 0, 100);

      state.mood = "sad";

      state.moodTimer = 6;

      state.washOverdone = true;

    }

  } else if (action === "\uC57D\uBA39\uC774\uAE30" || action === "medicine") {

    state.medicineTimer = 10;

    state.mode = "idle";

    state.mood = "sleepy";

    state.health = clamp(state.health + 50, 0, 100);

    state.life = clamp(state.life + 10, 0, 100);

    state.sick = false;

    modeLabel.textContent = state.mode.toUpperCase();

  } else if (

    action === "\uC7AC\uC6B0\uAE30" ||

    action === "sleep" ||

    action === "\uD734\uC2DD\uD558\uAE30" ||

    action === "rest"

  ) {

    state.sleeping = true;

    state.restTimer = 0;

    state.mode = "idle";

    state.mood = "sleepy";

    state.hungry = false;

    state.sleepy = false;

    state.vx = 0;

    state.vy = 0;

    modeLabel.textContent = "SLEEP";

    setSleepMenuLabel();

    syncCareMenuForSleep();

    updateSleepUI();

  } else if (action === "\uAE68\uC6B0\uAE30" || action === "wake") {

    state.sleeping = false;

    state.mode = "walk";

    state.modeTimer = 8 + Math.floor(Math.random() * 6);

    state.mood = "neutral";

    modeLabel.textContent = state.mode.toUpperCase();

    setSleepMenuLabel();

    syncCareMenuForSleep();

    updateSleepUI();

  } else if (action === "adventure" || action === "\uBAA8\uD5D8") {

    openInfoModal("모험", "준비 중이에요!");

  } else if (action === "shop" || action === "\uC0C1\uC810") {

    openInfoModal("상점", "준비 중이에요!");

  } else if (action === "settings" || action === "\uD658\uACBD\uC124\uC815") {

    openSettingsModal();

  }

  updateStatUI();

}



function selectMenu() {

  if (!menuItems.length || !activeMenu || activeMenu.hidden) {

    return;

  }

  const selectedItem = menuItems[menuIndex];

  if (selectedItem?.getAttribute("aria-disabled") === "true") {

    return;

  }

  const selected = getMenuAction(selectedItem);

  if (selected === "care" || selected === "돌봄") {

    openMenu(actionMenuCare);

    return;

  }

  closeMenu();

  handleMenuAction(selected);

}



async function ensureChatReady() {

  if (chatReady) {

    return;

  }

  try {

    chatDB = await loadRules();

    chatReady = true;

  } catch (err) {

    chatReady = false;

    console.error("Chat init failed", err);

  }

}



function syncChatContextFromHistory(messages) {

  const history = Array.isArray(messages) ? messages : [];

  chatCtx.history = history.slice(-30);

  chatCtx.lastUserMsg = null;

  chatCtx.lastBotMsg = null;

  for (const msg of history) {

    if (msg.role === "user") {

      chatCtx.lastUserMsg = msg.text;

    } else if (msg.role === "bot") {

      chatCtx.lastBotMsg = msg.text;

    }

  }

}



async function refreshChatHistory(render = true) {

  const history = await getRecent(50);

  if (render) {

    renderChatHistory(history);

  }

  syncChatContextFromHistory(history);

}



function renderChatMessage(msg) {

  if (!chatLog) {

    return;

  }

  const bubble = document.createElement("div");

  const role = msg.role === "user" ? "user" : "bot";

  bubble.className = `chat-bubble chat-bubble--${role}`;

  bubble.textContent = msg.text;

  chatLog.appendChild(bubble);

  chatLog.scrollTop = chatLog.scrollHeight;

}



function renderChatHistory(messages) {

  if (!chatLog) {

    return;

  }

  chatLog.innerHTML = "";

  for (const msg of messages) {

    renderChatMessage(msg);

  }

}



function openChat() {

  if (uiLocked) {

    return;

  }

  if (state.sleeping) {

    return;

  }

  if (!chatPanel) {

    return;

  }

  chatOpen = true;

  chatPanel.hidden = false;

  if (activeMenu && !activeMenu.hidden) {

    closeMenu();

  }

  ensureChatReady().then(async () => {

    await refreshChatHistory(!chatViewCleared);

    if (chatViewCleared && chatLog) {

      chatLog.innerHTML = "";

    }

    if (chatField) {

      chatField.focus();

    }

  });

}



function closeChat(reset = false) {

  if (!chatPanel) {

    return;

  }

  chatOpen = false;

  chatPanel.hidden = true;

  if (chatField) {

    chatField.blur();

  }

  if (reset && chatLog) {

    chatLog.innerHTML = "";

  }

  if (reset && chatField) {

    chatField.value = "";

  }

  if (reset) {

    chatViewCleared = true;

  }

}



function toggleChat() {

  if (uiLocked) {

    return;

  }

  if (state.sleeping) {

    return;

  }

  if (!chatPanel) {

    return;

  }

  if (chatOpen) {

    closeChat(true);

  } else {

    openChat();

  }

}



function detectUserMood(text) {

  const t = text.toLowerCase();

  if (t.match(/(짜증|화나|열받|빡쳐|빡침|怒|angry)/)) return "angry";

  if (t.match(/(우울|슬퍼|힘들|지침|속상|공허|sad)/)) return "sad";

  if (t.match(/(졸려|자고|피곤|졸림|잠온|잠와|sleepy)/)) return "sleepy";

  if (t.match(/(배고|허기|먹고|간식|배고파|hungry)/)) return "hungry";

  if (t.match(/(고마워|감사|사랑|좋아|최고|멋져|잘했|happy)/)) return "happy";

  if (t.match(/(그냥|별일|모르겠|애매|무난|neutral)/)) return "neutral";

  return null;

}



function getTimeOfDay() {

  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) return "오전";

  if (hour >= 11 && hour < 17) return "오후";

  if (hour >= 17 && hour < 22) return "저녁";

  return "밤";

}



function formatNowTime() {

  const now = new Date();

  const hours = now.getHours();

  const minutes = now.getMinutes();

  const period = hours < 12 ? "오전" : "오후";

  const hour12 = hours % 12 === 0 ? 12 : hours % 12;

  return `${period} ${hour12}:${minutes.toString().padStart(2, "0")}`;

}



function formatTodayDate() {

  const now = new Date();

  return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;

}



function formatTodayWeekday() {

  const weekdays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

  return weekdays[new Date().getDay()];

}



async function handleClearChat() {

  await clearAll();

  renderChatHistory([]);

  syncChatContextFromHistory([]);

  chatViewCleared = true;

}



async function handleChatSubmit(event) {

  event.preventDefault();

  if (uiLocked) {

    return;

  }

  if (state.sleeping) {

    return;

  }

  if (!chatField) {

    return;

  }

  const text = chatField.value.trim();

  if (!text) {

    return;

  }

  playButtonSfx();

  chatViewCleared = false;

  chatField.value = "";

  await ensureChatReady();

  if (!chatDB) {

    return;

  }

  const prevName = chatCtx.userName;

  const moodGuess = detectUserMood(text);

  if (moodGuess) {

    chatCtx.mood = moodGuess;

  }

  chatCtx.timeOfDay = getTimeOfDay();

  chatCtx.nowTime = formatNowTime();

  chatCtx.todayDate = formatTodayDate();

  chatCtx.todayDay = formatTodayWeekday();

  const userMsg = { role: "user", text };

  renderChatMessage(userMsg);

  addMessage(userMsg).catch(() => null);



  if (isProfane(text)) {

    state.happy = clamp(state.happy - 2, 0, 100);

    state.mood = "sad";

    state.moodTimer = 6;

  }

  if (isPraise(text)) {

    state.happy = clamp(state.happy + 2, 0, 100);

    state.mood = "happy";

    state.moodTimer = 6;

  }

  updateStatUI();



  const reply = respond(text, chatDB, chatCtx);

  const botMsg = { role: "bot", text: reply.text };

  renderChatMessage(botMsg);

  addMessage(botMsg).catch(() => null);

  chatCtx.lastBotMsg = reply.text;

  chatCtx.history.push(userMsg, botMsg);

  if (chatCtx.history.length > 30) {

    chatCtx.history = chatCtx.history.slice(-30);

  }

  if (reply.mood) {

    state.mood = reply.mood;

    state.moodTimer = 10;

  }

  if (chatCtx.userName && chatCtx.userName !== prevName) {

    localStorage.setItem(NAME_KEY, chatCtx.userName);

  }

  if (chatCtx.entities) {

    localStorage.setItem(ENTITY_KEY, JSON.stringify(chatCtx.entities));

  }

  if (chatCtx.teachPairs) {

    localStorage.setItem(TEACH_KEY, JSON.stringify(chatCtx.teachPairs));

  }

}



function isStatusActive(key) {

  if (key === "poop") {

    return Boolean(state.poops.length > 0 || state.pooping);

  }

  return Boolean(state[key]);

}



function syncVitalFlags() {

  state.hunger = clamp(state.hunger, 0, 100);

  state.clean = clamp(state.clean, 0, 100);

  state.happy = clamp(state.happy, 0, 100);

  state.energy = clamp(state.energy, 0, 100);

  state.health = clamp(state.health, 0, 100);

  state.life = clamp(state.life, 0, 100);



  state.hungry = !state.sleeping && state.hunger <= VITAL_THRESHOLDS.hungry;

  state.dirty = state.clean <= VITAL_THRESHOLDS.dirty;

  state.sleepy = !state.sleeping && state.energy <= VITAL_THRESHOLDS.sleepy;

  if (state.health <= VITAL_THRESHOLDS.sick) {

    state.sick = true;

  } else if (state.health >= VITAL_THRESHOLDS.recoverSick) {

    state.sick = false;

  }



  if (state.health <= 0 || state.life <= 0) {

    enterDeathState();

  }

}



function notifyStatusTransitions(prev) {
  const notifyName = petName || "펫";
  const prevAnnoyed = prev?.annoyed ?? false;
  if (state.hungry && !prev?.hungry) {
    showLocalNotification(notifyName, "나 배고파!", "hungry");
  } else if (state.hungry) {
    showLocalNotification(notifyName, "나 배고파!", "hungry");
  }
  if (state.dirty && !prev?.dirty) {
    showLocalNotification(notifyName, "내 몸에서 냄새가 나!", "dirty");
  }
  if (state.sick && !prev?.sick) {
    showLocalNotification(notifyName, "콜록콜록, 나 몸이 안 좋아.", "sick");
  }
  if (state.sleepy && !prev?.sleepy) {
    showLocalNotification(notifyName, "하암~ 나 너무 졸려.", "sleepy");
  }
  if (state.happy <= 25 && !prevAnnoyed) {
    showLocalNotification(notifyName, "흥! 치! 뿌!", "annoyed");
  }
}



function adjustStat(key, delta) {

  if (state.dead) {

    return;

  }

  const prev = {
    hungry: state.hungry,
    dirty: state.dirty,
    sleepy: state.sleepy,
    sick: state.sick,
    annoyed: state.happy <= 25,
  };

  state[key] = clamp(state[key] + delta, 0, 100);

  syncVitalFlags();

  notifyStatusTransitions(prev);

  updateStatUI();

}



function bindStatButton(button, handler) {

  if (!button) {

    return;

  }

  button.addEventListener("click", () => {

    if (state.dead) {

      return;

    }

    playButtonSfx();

    handler();

  });

}



if (actionBtn1 && actionMenuMain) {

  actionBtn1.addEventListener("click", () => {

    playButtonSfx();

    toggleMenu();

  });

}

if (actionBtn2) {

  actionBtn2.addEventListener("click", () => {

    playButtonSfx();

    toggleChat();

  });

}

if (chatClose) {

  chatClose.addEventListener("click", () => {

    playButtonSfx();

    closeChat(true);

  });

}

if (chatClear) {

  chatClear.addEventListener("click", () => {

    playButtonSfx();

    handleClearChat();

  });

}

if (chatForm) {

  chatForm.addEventListener("submit", handleChatSubmit);

}

if (modalClose) {

  modalClose.addEventListener("click", () => {

    playButtonSfx();

    if (deathModalActive) {

      performFullReset();

      return;

    }

    if (nameModalActive) {

      return;

    }
    if (adminModalActive) {
      closeAdminModal();
      return;
    }

    closeModal();

  });

}

if (modalSaveName) {

  modalSaveName.addEventListener("click", () => {

    playButtonSfx();

    savePetName();

  });

}

if (modalNameInput) {

  modalNameInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {

      event.preventDefault();

      savePetName();

    }

  });

}
if (adminPasswordInput) {
  adminPasswordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitAdminPassword();
    }
  });
}

if (modalOverlay) {

  modalOverlay.addEventListener("click", (event) => {

    if (event.target === modalOverlay && !deathModalActive && !nameModalActive && !adminModalActive) {

      closeModal();

    }

  });

}

if (settingBgm) {

  settingBgm.addEventListener("input", handleSettingsChange);

}

if (settingSfx) {

  settingSfx.addEventListener("input", handleSettingsChange);

}

if (settingsReset) {

  settingsReset.addEventListener("click", () => {

    playButtonSfx();

    performFullReset();

  });

}
if (settingsAdmin) {
  settingsAdmin.addEventListener("click", () => {
    playButtonSfx();
    openAdminModal();
  });
}
if (adminPasswordSubmit) {
  adminPasswordSubmit.addEventListener("click", () => {
    playButtonSfx();
    submitAdminPassword();
  });
}





bindStatButton(statePoopBtn, () => {

  spawnPoop();

  state.mood = "poop";

  state.moodTimer = 4;

});

bindStatButton(stateHungryBtn, () => adjustStat("hunger", -STAT_BUTTON_STEP));

bindStatButton(stateDirtyBtn, () => adjustStat("clean", -STAT_BUTTON_STEP));

bindStatButton(stateSleepyBtn, () => adjustStat("energy", -STAT_BUTTON_STEP));
bindStatButton(stateSickBtn, () => adjustStat("health", -STAT_BUTTON_STEP));
bindStatButton(stateAnnoyedBtn, () => adjustStat("happy", -STAT_BUTTON_STEP));
bindStatButton(stateDeathBtn, () => enterDeathState());
bindStatButton(stateNotifyBtn, () => {
  initPushNotifications();
  showLocalNotification("Pixel Pet", "알림 테스트입니다.");
});


if (dpadUp) {

  dpadUp.addEventListener("click", () => {

    playButtonSfx();

    moveMenu(-1);

  });

}



if (dpadDown) {

  dpadDown.addEventListener("click", () => {

    playButtonSfx();

    moveMenu(1);

  });

}



if (dpadCenter) {

  dpadCenter.addEventListener("click", () => {

    playButtonSfx();

    selectMenu();

  });

}



window.addEventListener("keydown", (event) => {

  if (!activeMenu || activeMenu.hidden) {

    return;

  }

  if (event.key === "ArrowUp") {

    event.preventDefault();

    moveMenu(-1);

  } else if (event.key === "ArrowDown") {

    event.preventDefault();

    moveMenu(1);

  } else if (event.key === "Enter" || event.key === " ") {

    event.preventDefault();

    selectMenu();

  }

});



canvas.style.touchAction = "none";

let isPetting = false;

let lastPetTime = 0;

let lastPos = null;

let pointerActive = false;

let draggingPoop = false;

let lastPoopScrub = 0;

let draggingWash = false;

let lastWashScrub = 0;

let activePoopIndex = -1;



function startPetting(event) {

  event.preventDefault();

  if (uiLocked) {

    return;

  }

  if (state.sleeping) {

    if (speechBubble) {

      showSpeech("자고 있어... 깨워줘.", 18, 80);

    }

    return;

  }

  if (state.dead) {

    if (speechBubble) {

      showSpeech("...", 20, 9999);

    }

    return;

  }

  pointerActive = true;

  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;

  const scaleY = canvas.height / rect.height;

  const canvasX = (event.clientX - rect.left) * scaleX;

  const canvasY = (event.clientY - rect.top) * scaleY;

    if (state.washing) {

      draggingWash = true;

      startShowerSound();

      lastPos = { x: event.clientX, y: event.clientY };

    state.spongeTarget = {

      x: Math.max(0, Math.min(LOGICAL_GRID - SPONGE_W, Math.round(canvasX) - SPONGE_W / 2)),

      y: Math.max(0, Math.min(LOGICAL_GRID - SPONGE_H, Math.round(canvasY) - SPONGE_H / 2)),

    };

    state.sponge = { ...state.spongeTarget };

    return;

  }

    if (state.poops.length > 0 && !draggingPoop) {

      for (let i = state.poops.length - 1; i >= 0; i -= 1) {

        const poop = state.poops[i];

        const poopX = canvasX >= poop.x && canvasX <= poop.x + POOP_W;

        const poopY = canvasY >= poop.y && canvasY <= poop.y + POOP_H;

        if (poopX && poopY) {

          draggingPoop = true;

          activePoopIndex = i;

          lastPos = { x: event.clientX, y: event.clientY };

          return;

        }

      }

    }

  const hitX = canvasX >= state.x && canvasX <= state.x + SPRITE_W;

  const hitY = canvasY >= state.y && canvasY <= state.y + SPRITE_H;

  if (!hitX || !hitY) {

    return;

  }

  isPetting = true;

  lastPos = { x: event.clientX, y: event.clientY };

    state.petTimer = 20;

    state.mood = "happy";

    playHappySfx();

    state.petStrokeCount += 1;

    if (state.petStrokeCount >= PET_STROKE_THRESHOLD) {

      state.happy = clamp(state.happy + PET_HAPPY_GAIN, 0, 100);

      state.petStrokeCount = 0;

    }

    state.mode = "idle";

    modeLabel.textContent = state.mode.toUpperCase();

    if (speechBubble) {

      showSpeech("기분 좋아!", 16, 80);

    }

  }



function movePetting(event) {

  if (!isPetting && !draggingPoop && !draggingWash) {

    return;

  }

  event.preventDefault();

  const now = performance.now();

  const dx = event.clientX - lastPos.x;

  const dy = event.clientY - lastPos.y;

  const dist = Math.hypot(dx, dy);

    if (draggingWash) {

      const rect = canvas.getBoundingClientRect();

      const scaleX = canvas.width / rect.width;

      const scaleY = canvas.height / rect.height;

      const canvasX = (event.clientX - rect.left) * scaleX;

      const canvasY = (event.clientY - rect.top) * scaleY;

      state.spongeTarget = {

        x: Math.max(0, Math.min(LOGICAL_GRID - SPONGE_W, Math.round(canvasX) - SPONGE_W / 2)),

        y: Math.max(0, Math.min(LOGICAL_GRID - SPONGE_H, Math.round(canvasY) - SPONGE_H / 2)),

      };

      state.sponge = { ...state.spongeTarget };

      if (dist > 12 && now - lastWashScrub > 160) {

        state.washScrub = Math.min(50, state.washScrub + 1);

        if (state.dirty) {

          state.dirtOpacity = Math.max(0, 1 - state.washScrub / 50);

        }

        state.bubbles.push({

          x: state.sponge.x + Math.random() * SPONGE_W,

          y: state.sponge.y + Math.random() * SPONGE_H,

          ttl: 10,

        });

        lastWashScrub = now;

        lastPos = { x: event.clientX, y: event.clientY };

        if (state.washScrub >= 50) {

          state.dirty = false;

          state.washing = false;

          state.washScrub = 0;

          state.dirtOpacity = 1;

          draggingWash = false;

          stopShowerSound();

          state.clean = clamp(state.clean + 80, 0, 100);

          if (!state.washOverdone) {

            state.happy = clamp(state.happy + 4, 0, 100);

          }

          state.life = clamp(state.life + 3, 0, 100);

          state.washOverdone = false;

          state.mood = "happy";

          state.moodTimer = HAPPY_WASH_TICKS;

          if (speechBubble) {

            showSpeech("개운해, 고마워! :)", 20, 90);

          }

          updateStatUI();

        }

      }

      return;

    }

    if (draggingPoop) {

      const poop = state.poops[activePoopIndex];

      if (!poop) {

        draggingPoop = false;

        activePoopIndex = -1;

        return;

      }

      if (dist > 6 && now - lastPoopScrub > 120) {

        poop.clean = Math.min(3, (poop.clean || 0) + 1);

        lastPoopScrub = now;

        lastPos = { x: event.clientX, y: event.clientY };

        if (poop.clean >= 3) {

          state.poops.splice(activePoopIndex, 1);

          activePoopIndex = -1;

          draggingPoop = false;

        }

      }

      return;

    }

    if (dist > 6 && now - lastPetTime > 80) {

      spawnHeart();

      state.petTimer = 20;

      state.petStrokeCount += 1;

      if (state.petStrokeCount >= PET_STROKE_THRESHOLD) {

        state.happy = clamp(state.happy + PET_HAPPY_GAIN, 0, 100);

        state.petStrokeCount = 0;

      }

      lastPetTime = now;

      lastPos = { x: event.clientX, y: event.clientY };

    }

  }



function stopPetting() {

  isPetting = false;

  lastPos = null;

  pointerActive = false;

  draggingPoop = false;

    draggingWash = false;

    stopShowerSound();

    activePoopIndex = -1;

}



canvas.addEventListener("pointerdown", startPetting);

canvas.addEventListener("pointermove", movePetting);

canvas.addEventListener("pointerup", stopPetting);

canvas.addEventListener("pointerleave", stopPetting);



if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker.register("./sw.js");

  });

}


















