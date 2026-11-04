(function () {
  const CREDIT_KEY = "pixel-party-credits";
  const UPGRADE_KEY = "pixel-party-upgrades";

  const defaults = {
    snakeBrake: false,
    snakeDoubleApple: false,
    pongWide: false,
    pongSlowBall: false,
    whgShield: false,
    whgSlowEnemies: false,
    whgSpeedBoost: false,
    whgGoalAssist: false,
    whgTimeBoost: false,
    thingamasilly: false,
  };
  const usageLimits = {
    snakeBrake: 3,
    snakeDoubleApple: 3,
    pongWide: 3,
    pongSlowBall: 3,
    whgShield: 3,
    whgSlowEnemies: 3,
    whgSpeedBoost: 3,
    whgGoalAssist: 3,
    whgTimeBoost: 1,
  };
  const permanentUpgrades = new Set(["thingamasilly"]);
  const labels = {
    snakeBrake: "Snake Brake",
    snakeDoubleApple: "Double Apple",
    pongWide: "Wide Paddle",
    pongSlowBall: "Slow Ball",
    whgShield: "Shield",
    whgSlowEnemies: "Slow Hazards",
    whgSpeedBoost: "Speed Boost",
    whgGoalAssist: "Goal Assist",
    whgTimeBoost: "Extra Time",
    thingamasilly: "Thingamasilly",
  };

  function readCredits() {
    return Number(localStorage.getItem(CREDIT_KEY) || 0);
  }

  function writeCredits(value) {
    const clamped = Math.max(0, Math.min(400, Math.floor(value)));
    localStorage.setItem(CREDIT_KEY, String(clamped));
    syncCreditDisplays();
  }

  function addCredits(amount = 1) {
    writeCredits(readCredits() + amount);
    return readCredits();
  }

  function readUpgrades() {
    try {
      const raw = JSON.parse(localStorage.getItem(UPGRADE_KEY) || "{}");
      const normalized = { ...defaults };
      for (const id of Object.keys(normalized)) {
        const value = raw[id];
        const isPermanent = permanentUpgrades.has(id);
        if (value === true) {
          normalized[id] = {
            owned: true,
            equipped: true,
            usesRemaining: isPermanent ? null : (usageLimits[id] || 3),
            permanent: isPermanent,
          };
        } else if (value && typeof value === "object") {
          const owned = !!value.owned;
          const permanent = isPermanent || !!value.permanent;
          const remaining = permanent
            ? null
            : Number.isFinite(value.usesRemaining)
              ? Math.max(0, Math.floor(value.usesRemaining))
              : owned
                ? (usageLimits[id] || 3)
                : 0;
          normalized[id] = {
            owned: permanent ? owned : owned && remaining > 0,
            equipped: permanent
              ? owned && (value.equipped === undefined ? !!value.owned : !!value.equipped)
              : owned && remaining > 0 && (value.equipped === undefined ? !!value.owned : !!value.equipped),
            usesRemaining: permanent ? null : (owned && remaining > 0 ? remaining : 0),
            permanent,
          };
        }
        if (!normalized[id].owned || (!normalized[id].permanent && normalized[id].usesRemaining <= 0)) {
          normalized[id].owned = false;
          normalized[id].equipped = false;
          normalized[id].usesRemaining = normalized[id].permanent ? null : 0;
        }
      }
      return normalized;
    } catch {
      return { ...defaults };
    }
  }

  function writeUpgrades(upgrades) {
    localStorage.setItem(UPGRADE_KEY, JSON.stringify({ ...defaults, ...upgrades }));
    syncUpgradeDisplays();
  }

  function hasUpgrade(id) {
    return !!readUpgrades()[id]?.equipped;
  }

  function isOwned(id) {
    return !!readUpgrades()[id]?.owned;
  }

  function countEquipped(upgrades = readUpgrades()) {
    return Object.keys(upgrades).filter((id) => upgrades[id]?.owned && upgrades[id]?.equipped).length;
  }

  function canEquipMore(upgrades = readUpgrades()) {
    return countEquipped(upgrades) < 2;
  }

  function toggleUpgrade(id) {
    const upgrades = readUpgrades();
    if (!upgrades[id]?.owned) {
      return { ok: false, reason: "not-owned" };
    }
    if (!upgrades[id].equipped && !canEquipMore(upgrades)) {
      return { ok: false, reason: "limit-reached" };
    }
    upgrades[id].equipped = !upgrades[id].equipped;
    writeUpgrades(upgrades);
    syncInventoryDisplays();
    window.dispatchEvent(new CustomEvent("pixel-party-updated", { detail: { type: "toggle", id } }));
    return { ok: true, equipped: upgrades[id].equipped };
  }

  function buyUpgrade(id, cost) {
    const upgrades = readUpgrades();
    if (upgrades[id]?.owned) {
      if (!upgrades[id].equipped && !canEquipMore(upgrades)) {
        writeUpgrades(upgrades);
        syncInventoryDisplays();
        return { ok: true, owned: true, equipped: false, reason: "limit-reached" };
      }
      upgrades[id].equipped = true;
      writeUpgrades(upgrades);
      syncInventoryDisplays();
      window.dispatchEvent(new CustomEvent("pixel-party-updated", { detail: { type: "equip", id } }));
      return { ok: true, owned: true, equipped: true };
    }
    if (readCredits() < cost) {
      return { ok: false, reason: "not-enough" };
    }
    const permanent = permanentUpgrades.has(id);
    const canEquip = canEquipMore(upgrades);
    upgrades[id] = {
      owned: true,
      equipped: canEquip,
      usesRemaining: permanent ? null : (usageLimits[id] || 3),
      permanent,
    };
    writeUpgrades(upgrades);
    writeCredits(readCredits() - cost);
    syncInventoryDisplays();
    window.dispatchEvent(new CustomEvent("pixel-party-updated", { detail: { type: "upgrade", id } }));
    return { ok: true, owned: true, equipped: canEquip };
  }

  function consumeUpgrade(id) {
    const upgrades = readUpgrades();
    const current = upgrades[id];
    if (!current?.owned || !current.equipped || current.permanent || current.usesRemaining <= 0) {
      return { ok: false, remaining: 0 };
    }

    current.usesRemaining -= 1;
    if (current.usesRemaining <= 0) {
      current.usesRemaining = 0;
      current.owned = false;
      current.equipped = false;
    }

    writeUpgrades(upgrades);
    syncInventoryDisplays();
    window.dispatchEvent(new CustomEvent("pixel-party-updated", { detail: { type: "consume", id, remaining: current.usesRemaining } }));
    return { ok: true, remaining: current.usesRemaining };
  }

  function syncCreditDisplays() {
    document.querySelectorAll("[data-credit-count]").forEach((el) => {
      el.textContent = String(readCredits());
    });
  }

  function syncUpgradeDisplays() {
    document.querySelectorAll("[data-upgrade-state]").forEach((el) => {
      const id = el.getAttribute("data-upgrade-state");
      const upgrade = readUpgrades()[id];
      if (!upgrade?.owned) {
        el.textContent = "Locked";
        return;
      }
      const suffix = upgrade.permanent ? "" : (upgrade.usesRemaining > 0 ? ` (${upgrade.usesRemaining} left)` : "");
      el.textContent = `${upgrade.equipped ? "Equipped" : "Unequipped"}${suffix}`;
    });
  }

  function syncInventoryDisplays() {
    const upgrades = readUpgrades();
    const owned = Object.keys(upgrades).filter((id) => upgrades[id]?.owned);
    document.querySelectorAll("[data-inventory-list]").forEach((list) => {
      list.innerHTML = "";
      owned.forEach((id) => {
        const item = document.createElement("li");
        const status = upgrades[id].equipped ? "Equipped" : "Unequipped";
        if (upgrades[id].permanent) {
          item.textContent = `${labels[id] || id} (${status})`;
        } else {
          const uses = upgrades[id].usesRemaining ?? 0;
          item.textContent = `${labels[id] || id} (${status}, ${uses} use${uses === 1 ? "" : "s"} left)`;
        }
        list.appendChild(item);
      });
      list.hidden = owned.length === 0;
    });
    document.querySelectorAll("[data-inventory-empty]").forEach((empty) => {
      empty.hidden = owned.length > 0;
    });
  }

  let thingamasillyInterval = null;

  function clearThingamasillyEffect() {
    if (thingamasillyInterval) {
      clearInterval(thingamasillyInterval);
      thingamasillyInterval = null;
    }
    document.querySelectorAll(".thingamasilly-fly").forEach((node) => node.remove());
  }

  function spawnThingamasillyCat() {
    const img = document.createElement("img");
    img.src = "watermark-cat.png";
    img.alt = "Thingamasilly cat";
    img.className = "thingamasilly-fly";
    const top = Math.max(20, Math.min(window.innerHeight - 140, 60 + Math.random() * (window.innerHeight * 0.55)));
    img.style.top = `${top}px`;
    img.style.left = "-140px";
    img.style.width = "110px";
    img.style.height = "110px";
    document.body.appendChild(img);
    requestAnimationFrame(() => {
      img.classList.add("is-visible");
    });
    window.setTimeout(() => {
      img.remove();
    }, 3200);
  }

  function syncThingamasillyEffect() {
    clearThingamasillyEffect();
    if (!hasUpgrade("thingamasilly")) {
      return;
    }
    spawnThingamasillyCat();
    thingamasillyInterval = window.setInterval(spawnThingamasillyCat, 5000);
  }

  window.PixelParty = {
    addCredits,
    buyUpgrade,
    consumeUpgrade,
    toggleUpgrade,
    hasUpgrade,
    isOwned,
    countEquipped,
    readCredits,
    readUpgrades,
    syncCreditDisplays,
    syncUpgradeDisplays,
    syncInventoryDisplays,
  };

  document.addEventListener("DOMContentLoaded", () => {
    syncCreditDisplays();
    syncUpgradeDisplays();
    syncInventoryDisplays();
    syncThingamasillyEffect();
  });

  window.addEventListener("pixel-party-updated", syncThingamasillyEffect);
})();
