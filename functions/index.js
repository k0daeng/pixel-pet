const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

const VITAL_INTERVAL_MS = 10000;
const HUNGER_DECAY = 0.05;
const SLEEP_DECAY_FACTOR = 0.5;
const HUNGER_THRESHOLD = 30;
const PUSH_COOLDOWN_MS = 60 * 60 * 1000;

function clamp(value, min, max) {
  const n = Number.isFinite(value) ? value : 0;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function toNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function normalizeState(state, now) {
  return {
    savedAt: toNumber(state?.savedAt, now),
    hunger: clamp(toNumber(state?.hunger, 100), 0, 100),
    health: clamp(toNumber(state?.health, 100), 0, 100),
    clean: clamp(toNumber(state?.clean, 100), 0, 100),
    happy: clamp(toNumber(state?.happy, 100), 0, 100),
    energy: clamp(toNumber(state?.energy, 100), 0, 100),
    life: clamp(toNumber(state?.life, 100), 0, 100),
    sleeping: Boolean(state?.sleeping),
    sick: Boolean(state?.sick),
    dead: Boolean(state?.dead),
  };
}

function computeHunger(state, now) {
  const savedAt = toNumber(state.savedAt, now);
  if (savedAt >= now) {
    return { hunger: clamp(state.hunger, 0, 100), savedAt };
  }
  const delta = now - savedAt;
  const steps = Math.floor(delta / VITAL_INTERVAL_MS);
  if (steps <= 0) {
    return { hunger: clamp(state.hunger, 0, 100), savedAt };
  }
  const decay = state.sleeping ? SLEEP_DECAY_FACTOR : 1;
  const hunger = clamp(state.hunger - HUNGER_DECAY * decay * steps, 0, 100);
  return { hunger, savedAt: savedAt + steps * VITAL_INTERVAL_MS };
}

function shouldNotify(lastAt, now) {
  if (!lastAt || !Number.isFinite(lastAt)) return true;
  return now - lastAt >= PUSH_COOLDOWN_MS;
}

exports.registerPushToken = onCall(async (request) => {
  const data = request.data || {};
  const token = data.token;
  const deviceId = data.deviceId;
  if (!token || !deviceId) {
    throw new HttpsError("invalid-argument", "token과 deviceId가 필요합니다.");
  }
  const payload = {
    token,
    deviceId,
    petName: data.petName || "",
    userName: data.userName || "",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    tokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await db.collection("devices").doc(deviceId).set(payload, { merge: true });
  return { ok: true };
});

exports.updatePetState = onCall(async (request) => {
  const data = request.data || {};
  const deviceId = data.deviceId;
  if (!deviceId || typeof data.state !== "object") {
    throw new HttpsError("invalid-argument", "deviceId와 state가 필요합니다.");
  }
  const now = Date.now();
  const state = normalizeState(data.state, now);
  await db.collection("devices").doc(deviceId).set(
    {
      state,
      petName: data.petName || "",
      userName: data.userName || "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return { ok: true };
});

exports.sendPetAlerts = onSchedule("every 5 minutes", async () => {
  const snapshot = await db.collection("devices").get();
  const now = Date.now();
  const updates = [];
  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const token = data.token;
    if (!token || !data.state) continue;
    const state = normalizeState(data.state, now);
    if (state.dead) continue;
    const { hunger, savedAt } = computeHunger(state, now);
    const hungry = !state.sleeping && hunger <= HUNGER_THRESHOLD;
    const lastNotified = data.lastNotified || {};
    let sent = false;
    if (hungry && shouldNotify(lastNotified.hungry, now)) {
      const title = data.petName || "펫";
      const body = "나 배고파!";
      try {
        await admin.messaging().send({
          token,
          notification: { title, body },
        });
        sent = true;
      } catch (err) {
        const code = err?.code || "";
        if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") {
          updates.push(doc.ref.set({ token: admin.firestore.FieldValue.delete() }, { merge: true }));
        }
      }
    }
    const nextState = { ...state, hunger, savedAt };
    const update = {
      state: nextState,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (sent) {
      update.lastNotified = { ...lastNotified, hungry: now };
    }
    updates.push(doc.ref.set(update, { merge: true }));
  }
  await Promise.all(updates);
});
