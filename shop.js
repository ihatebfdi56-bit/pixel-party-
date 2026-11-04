const items = [
  {
    id: "snakeBrake",
    name: "Snake Brake",
    cost: 14,
    game: "Snake",
    description: "Makes Snake a little slower so tight turns are easier to control.",
  },
  {
    id: "snakeDoubleApple",
    name: "Double Apple",
    cost: 17,
    game: "Snake",
    description: "Spawns two apples at once for a faster, juicier run.",
  },
  {
    id: "pongWide",
    name: "Wide Paddle",
    cost: 15,
    game: "Pong",
    description: "Gives your Pong paddle extra reach.",
  },
  {
    id: "pongSlowBall",
    name: "Slow Ball",
    cost: 15,
    game: "Pong",
    description: "Slows the Pong ball a bit so rallies last longer.",
  },
  {
    id: "whgShield",
    name: "Shield",
    cost: 18,
    game: "World's Easiest",
    description: "Absorbs one hazard hit per level and resets you safely to the start.",
  },
  {
    id: "whgSlowEnemies",
    name: "Slow Hazards",
    cost: 20,
    game: "World's Easiest",
    description: "Slows the blue circles so the route is still brutal, but a little fairer.",
  },
  {
    id: "whgSpeedBoost",
    name: "Speed Boost",
    cost: 16,
    game: "World's Easiest",
    description: "Makes the red cube move faster so long routes feel less sticky.",
  },
  {
    id: "whgGoalAssist",
    name: "Goal Assist",
    cost: 17,
    game: "World's Easiest",
    description: "Makes the win pad a little easier to touch.",
  },
  {
    id: "whgTimeBoost",
    name: "Extra Time",
    cost: 13,
    game: "World's Easiest",
    description: "Adds 10 extra seconds to World’s Easiest for one run.",
  },
  {
    id: "thingamasilly",
    name: "Thingamasilly",
    cost: 400,
    game: "Special",
    description: "",
  },
];

const shopGrid = document.getElementById("shopGrid");

function renderShop() {
  shopGrid.innerHTML = "";
  const credits = PixelParty.readCredits();
  const equippedCount = PixelParty.countEquipped();

  for (const item of items) {
    const upgrade = PixelParty.readUpgrades()[item.id] || {};
    const owned = PixelParty.isOwned(item.id);
    const equipped = PixelParty.hasUpgrade(item.id);
    const usesLeft = upgrade.usesRemaining || 0;
    const canEquip = !owned || equipped || equippedCount < 2;
    const affordable = credits >= item.cost;
    const buyLabel = item.id === "thingamasilly" && canEquip ? "Buy & Equip" : canEquip ? "Buy & Equip" : "Buy";
    const card = document.createElement("article");
    card.className = "shop-card";
    card.innerHTML = `
      <div class="shop-card-top">
        <span class="menu-tag">${item.game}</span>
        <strong>${item.name}</strong>
      </div>
      ${item.description ? `<p>${item.description}</p>` : ""}
      ${item.id === "thingamasilly" ? '<div class="shop-special-art"><img src="watermark-cat.png" alt="cat image"></div>' : ""}
      <div class="shop-card-footer">
        <span class="score-pill">${owned ? `${equipped ? "Equipped" : "Unequipped"}${upgrade.permanent ? "" : usesLeft ? ` · ${usesLeft} left` : ""}` : `${item.cost} credits`}</span>
        <button class="button ${owned ? "ghost" : "primary"} ${!owned && !affordable ? "is-affordable-false" : ""}" type="button" ${!owned && !affordable ? "disabled" : ""} ${owned && !equipped && !canEquip ? "disabled" : ""}>
          ${owned ? (equipped ? "Unequip" : canEquip ? "Equip" : "Equip limit reached") : affordable ? buyLabel : `Need ${item.cost - credits} more`}
        </button>
      </div>
      ${!owned && !affordable ? `<p class="needs-more">You need ${item.cost - credits} more credits.</p>` : ""}
    `;

    const button = card.querySelector("button");
    button.addEventListener("click", () => {
      if (PixelParty.isOwned(item.id)) {
        const result = PixelParty.toggleUpgrade(item.id);
        if (!result.ok && result.reason === "limit-reached") {
          renderShop();
          return;
        }
        renderShop();
        return;
      }
      const result = PixelParty.buyUpgrade(item.id, item.cost);
      if (result.ok) {
        if (item.id === "thingamasilly") {
          triggerThingamasillySequence();
        }
        renderShop();
      }
    });

    shopGrid.appendChild(card);
  }
}

function triggerThingamasillySequence() {
  let overlay = document.querySelector(".thingamasilly-screen");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "thingamasilly-screen";
    overlay.innerHTML = "<span>but why?</span>";
    document.body.appendChild(overlay);
  }

  overlay.classList.add("is-visible");
  window.setTimeout(() => {
    overlay.classList.remove("is-visible");
  }, 2000);
  window.setTimeout(() => {
    window.location.href = "index.html";
  }, 2400);
}

document.addEventListener("DOMContentLoaded", renderShop);
document.addEventListener("DOMContentLoaded", () => {
  PixelParty.syncInventoryDisplays();
});
window.addEventListener("pixel-party-updated", renderShop);
