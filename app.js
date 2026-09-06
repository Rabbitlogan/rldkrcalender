/* ===== 상태 ===== */
const state = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  selectedDate: null,
};

const STORAGE_KEY = "calendarAppNotes";

/* ===== DOM 요소 ===== */
const monthYearEl = document.getElementById("monthYear");
const daysGridEl = document.getElementById("daysGrid");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");
const selectedDateLabel = document.getElementById("selectedDateLabel");
const noteInput = document.getElementById("noteInput");
const saveBtn = document.getElementById("saveNote");
const clearBtn = document.getElementById("clearNote");

/* ===== 헬퍼 ===== */
function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveNotes(notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    /* 저장 실패 시 조용히 무시 */
  }
}

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDateLabel(year, month, day) {
  const d = new Date(year, month, day);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

/* ===== 렌더링 ===== */
function render() {
  const notes = loadNotes();
  const firstDay = new Date(state.year, state.month, 1).getDay();
  const daysInMonth = new Date(state.year, state.month + 1, 0).getDate();
  const daysInPrev = new Date(state.year, state.month, 0).getDate();
  const today = new Date();

  monthYearEl.textContent = new Date(state.year, state.month).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  const cells = [];

  // 이전 달 빈 칸
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, other: true });
  }

  // 현재 달
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, other: false });
  }

  // 다음 달 빈 칸 (7의 배수로 맞춤)
  while (cells.length % 7 !== 0) {
    const nextDay = cells.length - daysInMonth - firstDay + 1;
    cells.push({ day: nextDay, other: true });
  }

  daysGridEl.innerHTML = cells
    .map(
      ({ day, other }, idx) => {
        const year = other
          ? day > daysInPrev - firstDay + 1
            ? state.year
            : state.year - 1
          : state.year;
        const month = other
          ? day > daysInPrev - firstDay + 1
            ? state.month + 1
            : state.month - 1
          : state.month;

        const realMonth = month < 0 ? 11 : month > 11 ? 0 : month;
        const realYear = month < 0 ? state.year - 1 : month > 11 ? state.year + 1 : state.year;

        const key = dateKey(realYear, realMonth, day);
        const isToday =
          realYear === today.getFullYear() &&
          realMonth === today.getMonth() &&
          day === today.getDate();
        const isSelected =
          state.selectedDate &&
          state.selectedDate.key === key;

        const hasNote = notes[key] && notes[key].trim().length > 0;

        return `
          <div
            class="day-cell${other ? " other-month" : ""}${isToday ? " today" : ""}${isSelected ? " selected" : ""}"
            role="button"
            tabindex="${other ? "-1" : "0"}"
            aria-label="${other ? "다른 달" : formatDateLabel(realYear, realMonth, day)}${hasNote ? " (메모 있음)" : ""}"
            data-key="${key}"
          >
            <span class="day-number">${day}</span>
            ${hasNote ? '<span class="note-indicator" aria-hidden="true"></span>' : ""}
          </div>
        `;
      },
    )
    .join("");

  // 선택한 날짜 표시 갱신
  if (state.selectedDate) {
    selectedDateLabel.textContent = formatDateLabel(
      state.selectedDate.year,
      state.selectedDate.month,
      state.selectedDate.day,
    );
    noteInput.value = notes[state.selectedDate.key] || "";
  } else {
    selectedDateLabel.textContent = "날짜를 선택하세요";
    noteInput.value = "";
  }
}

/* ===== 이벤트 ===== */
daysGridEl.addEventListener("click", (e) => {
  const cell = e.target.closest(".day-cell");
  if (!cell || cell.classList.contains("other-month")) return;

  const key = cell.dataset.key;
  const [y, m, d] = key.split("-").map(Number);
  state.selectedDate = { year: y, month: m - 1, day: d, key };
  render();
  noteInput.focus();
});

daysGridEl.addEventListener("keydown", (e) => {
  const cell = e.target.closest(".day-cell");
  if (!cell || cell.classList.contains("other-month")) return;

  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    cell.click();
  }
});

prevBtn.addEventListener("click", () => {
  state.month -= 1;
  if (state.month < 0) {
    state.month = 11;
    state.year -= 1;
  }
  state.selectedDate = null;
  render();
});

nextBtn.addEventListener("click", () => {
  state.month += 1;
  if (state.month > 11) {
    state.month = 0;
    state.year += 1;
  }
  state.selectedDate = null;
  render();
});

saveBtn.addEventListener("click", () => {
  if (!state.selectedDate) return;
  const notes = loadNotes();
  notes[state.selectedDate.key] = noteInput.value.trim();
  saveNotes(notes);
  render();
});

clearBtn.addEventListener("click", () => {
  if (!state.selectedDate) return;
  const notes = loadNotes();
  delete notes[state.selectedDate.key];
  saveNotes(notes);
  noteInput.value = "";
  render();
});

/* ===== 초기화 ===== */
render();

// 선택 날짜가 없으면 오늘을 선택 상태로 만들기
(function selectTodayIfNone() {
  if (!state.selectedDate) {
    const today = new Date();
    state.selectedDate = {
      year: today.getFullYear(),
      month: today.getMonth(),
      day: today.getDate(),
      key: dateKey(today.getFullYear(), today.getMonth(), today.getDate()),
    };
    render();
  }
})();
