import { saveLevelCompletion } from "./scripts/firebase-ready.js";

const cardPool = [
  { emoji: "🐶", name: "강아지", color: "#ff8fa3" },
  { emoji: "🐱", name: "고양이", color: "#ffd166" },
  { emoji: "🐰", name: "토끼", color: "#b8a4ff" },
  { emoji: "🦊", name: "여우", color: "#ff715b" },
  { emoji: "🐼", name: "판다", color: "#72d6bd" },
  { emoji: "🐸", name: "개구리", color: "#8fd14f" },
  { emoji: "🌻", name: "해바라기", color: "#ffd166" },
  { emoji: "🌷", name: "튤립", color: "#ff8fa3" },
  { emoji: "🌵", name: "선인장", color: "#72d6bd" },
  { emoji: "🍄", name: "버섯", color: "#ff715b" },
  { emoji: "🌳", name: "나무", color: "#8fd14f" },
  { emoji: "🍀", name: "네잎클로버", color: "#72d6bd" },
  { emoji: "🎈", name: "풍선", color: "#ff8fa3" },
  { emoji: "🧸", name: "곰인형", color: "#b8a4ff" },
  { emoji: "🚗", name: "자동차", color: "#7bdff2" },
  { emoji: "🎨", name: "팔레트", color: "#ffd166" },
  { emoji: "⚽", name: "축구공", color: "#72d6bd" },
  { emoji: "📚", name: "책", color: "#b8a4ff" },
  { emoji: "🍎", name: "사과", color: "#ff715b" },
  { emoji: "🍓", name: "딸기", color: "#ff8fa3" },
  { emoji: "🍋", name: "레몬", color: "#ffd166" },
  { emoji: "🥕", name: "당근", color: "#ff715b" },
  { emoji: "⭐", name: "별", color: "#b8a4ff" },
  { emoji: "🌈", name: "무지개", color: "#7bdff2" },
  { emoji: "☁️", name: "구름", color: "#72d6bd" },
  { emoji: "🎁", name: "선물", color: "#ff8fa3" },
];

const levels = [
  { level: 1, pairs: 3, columns: 3, timeLimit: 20 },
  { level: 2, pairs: 4, columns: 4, timeLimit: 25 },
  { level: 3, pairs: 5, columns: 5, timeLimit: 35 },
  { level: 4, pairs: 6, columns: 4, timeLimit: 45 },
  { level: 5, pairs: 8, columns: 4, timeLimit: 60 },
  { level: 6, pairs: 10, columns: 5, timeLimit: 75 },
  { level: 7, pairs: 12, columns: 6, timeLimit: 90 },
  { level: 8, pairs: 14, columns: 7, timeLimit: 110 },
  { level: 9, pairs: 16, columns: 8, timeLimit: 130 },
  { level: 10, pairs: 18, columns: 6, timeLimit: 150 },
];

const board = document.querySelector("#board");
const levelTabs = document.querySelector("#levelTabs");
const levelLabel = document.querySelector("#levelLabel");
const cardCountLabel = document.querySelector("#cardCountLabel");
const moveLabel = document.querySelector("#moveLabel");
const timeLabel = document.querySelector("#timeLabel");
const restartButton = document.querySelector("#restartButton");
const shuffleButton = document.querySelector("#shuffleButton");
const resultModal = document.querySelector("#resultModal");
const modalBadge = document.querySelector("#modalBadge");
const modalTitle = document.querySelector("#modalTitle");
const modalMessage = document.querySelector("#modalMessage");
const nextButton = document.querySelector("#nextButton");
const closeModalButton = document.querySelector("#closeModalButton");

let currentLevelIndex = 0;
let cards = [];
let flipped = [];
let matchedIndexes = new Set();
let matchedPairs = 0;
let moves = 0;
let elapsedSeconds = 0;
let timeRemaining = 0;
let timerId = null;
let isLocked = false;
let roundStatus = "playing";
let modalMode = "success";
let clearedLevels = new Set(JSON.parse(localStorage.getItem("clearedLevels") || "[]"));

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const remainingSeconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function startTimer() {
  if (timerId) return;

  timerId = window.setInterval(() => {
    elapsedSeconds += 1;
    timeRemaining = Math.max(0, timeRemaining - 1);
    timeLabel.textContent = formatTime(timeRemaining);
    updateTimeWarning();

    if (timeRemaining === 0) {
      handleTimeUp();
    }
  }, 1000);
}

function stopTimer() {
  window.clearInterval(timerId);
  timerId = null;
}

function buildLevelTabs() {
  levelTabs.innerHTML = "";

  levels.forEach(({ level }, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "level-tab";
    button.textContent = level;
    button.setAttribute("aria-label", `${level}단계`);
    button.addEventListener("click", () => startLevel(index));
    levelTabs.append(button);
  });
}

function updateLevelTabs() {
  [...levelTabs.children].forEach((button, index) => {
    button.classList.toggle("is-active", index === currentLevelIndex);
    button.classList.toggle("is-cleared", clearedLevels.has(index));
  });
}

function makeCards(level) {
  const pickedCards = shuffle(cardPool).slice(0, level.pairs);

  return shuffle(
    pickedCards.flatMap((card, pairIndex) => [
      { ...card, pairKey: `${pairIndex}-a`, matchKey: card.name },
      { ...card, pairKey: `${pairIndex}-b`, matchKey: card.name },
    ])
  );
}

function renderBoard() {
  const level = levels[currentLevelIndex];
  const columns = getColumnCount(level);
  const boardWidth = Math.min(980, Math.max(360, columns * 116));

  board.style.setProperty("--columns", columns);
  board.style.setProperty("--board-width", `${boardWidth}px`);
  board.classList.toggle("is-time-up", roundStatus === "lost");
  board.innerHTML = "";

  cards.forEach((card, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "card";
    button.classList.toggle("is-flipped", flipped.includes(index));
    button.classList.toggle("is-matched", matchedIndexes.has(index));
    button.style.setProperty("--card-color", card.color);
    button.dataset.index = index;
    button.setAttribute("aria-label", matchedIndexes.has(index) || flipped.includes(index) ? `${card.name} 카드` : "뒤집힌 카드");
    button.innerHTML = `
      <span class="card-inner">
        <span class="card-face card-back" aria-hidden="true"></span>
        <span class="card-face card-front">
          <span class="card-emoji" aria-hidden="true">${card.emoji}</span>
          <span class="card-name">${card.name}</span>
        </span>
      </span>
    `;
    button.addEventListener("click", () => flipCard(index));
    board.append(button);
  });
}

function getColumnCount(level) {
  const maximumColumns = Math.min(level.columns, level.pairs * 2);

  if (window.matchMedia("(max-width: 560px)").matches) {
    return Math.min(maximumColumns, 4);
  }

  if (window.matchMedia("(max-width: 820px)").matches) {
    return Math.min(maximumColumns, 5);
  }

  return maximumColumns;
}

function resetRound() {
  stopTimer();
  const level = levels[currentLevelIndex];
  flipped = [];
  matchedIndexes = new Set();
  matchedPairs = 0;
  moves = 0;
  elapsedSeconds = 0;
  timeRemaining = level.timeLimit;
  isLocked = false;
  roundStatus = "playing";
  moveLabel.textContent = "0";
  timeLabel.textContent = formatTime(timeRemaining);
  updateTimeWarning();
  board.classList.remove("is-time-up");
}

function startLevel(index) {
  currentLevelIndex = index;
  const level = levels[currentLevelIndex];

  resetRound();
  cards = makeCards(level);
  levelLabel.textContent = `${level.level} / 10`;
  cardCountLabel.textContent = `${level.pairs * 2}장`;
  updateLevelTabs();
  renderBoard();
  closeModal();
}

function flipCard(index) {
  if (roundStatus !== "playing" || isLocked || flipped.includes(index)) return;

  const cardButton = board.children[index];
  if (cardButton.classList.contains("is-matched")) return;

  startTimer();
  cardButton.classList.add("is-flipped");
  cardButton.setAttribute("aria-label", `${cards[index].name} 카드`);
  flipped.push(index);

  if (flipped.length === 2) {
    moves += 1;
    moveLabel.textContent = moves;
    checkMatch();
  }
}

function checkMatch() {
  const [firstIndex, secondIndex] = flipped;
  const firstCard = cards[firstIndex];
  const secondCard = cards[secondIndex];

  if (firstCard.matchKey === secondCard.matchKey) {
    board.children[firstIndex].classList.add("is-matched");
    board.children[secondIndex].classList.add("is-matched");
    matchedIndexes.add(firstIndex);
    matchedIndexes.add(secondIndex);
    matchedPairs += 1;
    flipped = [];
    checkLevelClear();
    return;
  }

  isLocked = true;

  window.setTimeout(() => {
    if (roundStatus !== "playing") return;

    board.children[firstIndex].classList.remove("is-flipped");
    board.children[secondIndex].classList.remove("is-flipped");
    board.children[firstIndex].setAttribute("aria-label", "뒤집힌 카드");
    board.children[secondIndex].setAttribute("aria-label", "뒤집힌 카드");
    flipped = [];
    isLocked = false;
  }, 720);
}

async function checkLevelClear() {
  const level = levels[currentLevelIndex];

  if (matchedPairs !== level.pairs) return;

  stopTimer();
  roundStatus = "won";
  clearedLevels.add(currentLevelIndex);
  localStorage.setItem("clearedLevels", JSON.stringify([...clearedLevels]));
  updateLevelTabs();

  await saveLevelCompletion({
    level: level.level,
    cards: level.pairs * 2,
    moves,
    seconds: elapsedSeconds,
    completedAt: new Date().toISOString(),
  });

  openSuccessModal();
}

function handleTimeUp() {
  if (roundStatus !== "playing") return;

  stopTimer();
  roundStatus = "lost";
  isLocked = true;
  flipped = [];
  board.classList.add("is-time-up");
  openFailureModal();
}

function updateTimeWarning() {
  const timeStat = timeLabel.closest(".stat");
  const level = levels[currentLevelIndex];
  const isWarning = timeRemaining <= Math.max(8, Math.ceil(level.timeLimit * 0.18));
  timeStat.classList.toggle("is-warning", isWarning);
}

function openSuccessModal() {
  const isFinalLevel = currentLevelIndex === levels.length - 1;
  modalMode = "success";

  modalBadge.textContent = isFinalLevel ? "★" : "✓";
  modalTitle.textContent = isFinalLevel ? "축하해요!" : `${currentLevelIndex + 1}단계 성공!`;
  modalMessage.textContent = isFinalLevel
    ? "10단계를 모두 성공했어요. 기억력이 짱 좋아요!"
    : "반짝반짝 잘 외웠어요. 다음 단계도 해낼 수 있어요!";
  nextButton.textContent = isFinalLevel ? "1단계부터 다시" : "다음 단계";
  resultModal.classList.add("is-open");
}

function openFailureModal() {
  modalMode = "failure";
  modalBadge.textContent = "!";
  modalTitle.textContent = "시간 초과!";
  modalMessage.textContent = "아쉬워요. 이번에는 시간이 다 되었어요. 같은 단계에 다시 도전해볼까요?";
  nextButton.textContent = "다시 도전";
  resultModal.classList.add("is-open");
}

function closeModal() {
  resultModal.classList.remove("is-open");
}

restartButton.addEventListener("click", () => startLevel(currentLevelIndex));
shuffleButton.addEventListener("click", () => startLevel(currentLevelIndex));

nextButton.addEventListener("click", () => {
  if (modalMode === "failure") {
    startLevel(currentLevelIndex);
    return;
  }

  const nextIndex = currentLevelIndex === levels.length - 1 ? 0 : currentLevelIndex + 1;
  startLevel(nextIndex);
});

closeModalButton.addEventListener("click", closeModal);

resultModal.addEventListener("click", (event) => {
  if (event.target === resultModal) closeModal();
});

buildLevelTabs();
startLevel(0);

window.addEventListener("resize", () => {
  renderBoard();
});
