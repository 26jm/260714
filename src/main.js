import "./style.css";
import { createClient } from "@supabase/supabase-js";

const app = document.querySelector("#app");

app.innerHTML = `
  <main class="app" id="appShell">
    <section class="hero">
      <div class="eyebrow"><span class="dot"></span> 실시간 추첨기</div>
      <h1>로또 추첨기</h1>
      <p class="sub">버튼을 누르면 1부터 45까지에서 중복 없이 6개를 뽑고, 보너스 번호 1개를 함께 보여줍니다. 추첨 결과는 Supabase 데이터베이스에 저장됩니다.</p>
    </section>

    <section class="content">
      <div class="numbers-wrap">
        <p class="label">당첨 번호 6개</p>
        <section class="numbers" id="numbers" aria-live="polite" aria-label="당첨 번호"></section>
        <div class="bonus-line">
          <div class="bonus-text">보너스 번호</div>
          <div class="bonus-slot" id="bonusSlot"></div>
        </div>
      </div>

      <div class="controls">
        <div class="button-row">
          <button class="button-primary" id="drawBtn" type="button">새로 뽑기</button>
          <button class="button-secondary" id="resetBtn" type="button">기록 초기화</button>
        </div>
        <div class="hint" id="statusText">매번 새 번호를 생성합니다.</div>
      </div>

      <div class="history">
        <h2>최근 추첨</h2>
        <ul id="history"></ul>
        <div class="summary" id="summary">아직 추첨되지 않았습니다.</div>
      </div>
    </section>
  </main>
`;

const appShell = document.getElementById("appShell");
const numbersEl = document.getElementById("numbers");
const bonusSlotEl = document.getElementById("bonusSlot");
const historyEl = document.getElementById("history");
const summaryEl = document.getElementById("summary");
const statusTextEl = document.getElementById("statusText");
const drawBtn = document.getElementById("drawBtn");
const resetBtn = document.getElementById("resetBtn");
const history = [];

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

function drawLottery() {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  const picked = [];

  while (picked.length < 7) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }

  return {
    main: picked.slice(0, 6).sort((a, b) => a - b),
    bonus: picked[6],
  };
}

function createBall(num, type, delay) {
  const ball = document.createElement("div");
  ball.className = `ball ${type}`;
  ball.textContent = num;
  ball.style.animationDelay = `${delay}ms`;
  return ball;
}

function renderNumbers(main, bonus) {
  numbersEl.innerHTML = "";
  bonusSlotEl.innerHTML = "";

  main.forEach((num, index) => {
    numbersEl.appendChild(createBall(num, "primary", index * 90));
  });

  bonusSlotEl.appendChild(createBall(bonus, "bonus", 620));
}

function renderHistory() {
  historyEl.innerHTML = "";
  history.slice(0, 5).forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}회차: ${item.main.join(", ")} + 보너스 ${item.bonus}`;
    historyEl.appendChild(li);
  });
}

function animateApp() {
  appShell.classList.remove("flash");
  void appShell.offsetWidth;
  appShell.classList.add("flash");
}

async function saveDraw(result) {
  if (!supabase) {
    statusTextEl.textContent = "Supabase 연결 정보가 없어 저장하지 않았습니다.";
    return;
  }

  const { error } = await supabase.from("lottery_draws").insert([
    {
      numbers: result.main,
      bonus_number: result.bonus,
    },
  ]);

  if (error) {
    console.error("Supabase save error:", error);
    statusTextEl.textContent = "저장은 실패했지만 추첨은 완료되었습니다.";
    return;
  }

  statusTextEl.textContent = "추첨 결과를 데이터베이스에 저장했습니다.";
}

drawBtn.addEventListener("click", async () => {
  const result = drawLottery();
  history.unshift(result);
  renderNumbers(result.main, result.bonus);
  renderHistory();
  summaryEl.textContent = `이번 추첨 결과: ${result.main.join(", ")} | 보너스 ${result.bonus}`;
  animateApp();
  await saveDraw(result);
});

resetBtn.addEventListener("click", () => {
  history.length = 0;
  renderHistory();
  summaryEl.textContent = "기록이 초기화되었습니다.";
  statusTextEl.textContent = "매번 새 번호를 생성합니다.";
  animateApp();
});

const initial = drawLottery();
renderNumbers(initial.main, initial.bonus);
renderHistory();
summaryEl.textContent = `초기 표시: ${initial.main.join(", ")} | 보너스 ${initial.bonus}`;
