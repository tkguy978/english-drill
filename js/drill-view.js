// 카드 화면과 완료 화면. session 상태를 그리고, 입력을 session 동작으로 바꾼다.

import {
  createSession, currentRow, isDone, isMarked, restart, startReview, step, stepBack, toggleMark,
} from "./session.js";
import { loadProgress, saveProgress } from "./store.js";

export function renderDrill({ book, section }, rows) {
  const root = document.getElementById("drill");
  const $ = id => document.getElementById(id);
  const el = {
    title: $("drill-title"),
    mode: $("mode"),
    tally: $("tally"),
    fill: $("fill"),
    card: $("card"),
    serial: $("serial"),
    prompt: $("prompt"),
    nudge: $("nudge"),
    answer: $("answer"),
    actions: $("actions"),
    prev: $("prev"),
    mark: $("mark"),
    next: $("next"),
    done: $("done"),
    doneTitle: $("done-title"),
    doneBody: $("done-body"),
    review: $("review"),
    restart: $("restart"),
  };

  const saved = loadProgress(book.id, section.id);
  let state = createSession(rows, {
    startNo: saved ? saved.no : null,
    marked: saved ? saved.marked : [],
  });

  // 전체 한 바퀴에서의 위치. 표시한 것만 도는 동안에는 이 값을 건드리지 않는다.
  let position = null;

  function persist() {
    if (!state.reviewing) {
      const row = currentRow(state);
      position = { no: row ? row.no : null, at: isDone(state) ? rows.length : state.at + 1 };
    }
    if (!position) return;
    saveProgress(book.id, section.id, { ...position, total: rows.length, marked: state.marked });
  }

  function paint() {
    const total = state.rows.length;
    const done = isDone(state);
    const markedCount = state.marked.length;

    el.card.hidden = done;
    el.actions.hidden = done;
    el.done.hidden = !done;
    el.mode.hidden = !state.reviewing;
    el.tally.textContent = `${done ? total : state.at + 1} / ${total}`;
    el.fill.style.width = `${(done ? 1 : state.at / total) * 100}%`;

    if (done) {
      el.doneTitle.textContent = state.reviewing ? "표시한 문장을 다 봤습니다" : "한 바퀴 끝났습니다";
      el.doneBody.textContent = state.reviewing
        ? (markedCount
          ? `아직 ${markedCount}개가 헷갈림으로 표시돼 있습니다.`
          : "표시가 모두 해제됐습니다.")
        : (markedCount
          ? `${total}문장을 모두 봤습니다. 헷갈림으로 표시한 ${markedCount}개가 있습니다.`
          : `${total}문장을 모두 봤습니다.`);
      el.review.hidden = markedCount === 0;
      el.review.textContent = `표시한 ${markedCount}개만 연습`;
      el.restart.textContent = state.reviewing ? "전체 처음부터" : "처음부터";
      return;
    }

    const row = currentRow(state);
    const marked = isMarked(state);
    el.serial.textContent = `#${row.no}`;
    el.prompt.textContent = row.ko;
    el.answer.textContent = row.en;
    el.card.classList.toggle("is-revealed", state.revealed);
    el.card.classList.toggle("is-marked", marked);
    el.mark.setAttribute("aria-pressed", String(marked));
    el.prev.setAttribute("aria-disabled", String(state.at === 0));
    el.next.textContent = !state.revealed ? "정답 보기"
      : state.at === total - 1 ? "마치기"
      : "다음";
  }

  // 카드와 완료 화면이 서로 바뀔 때 포커스가 숨겨진 요소에 남지 않게 옮긴다.
  function update(next) {
    const wasDone = isDone(state);
    state = next;
    paint();
    persist();
    const nowDone = isDone(state);
    if (!wasDone && nowDone) el.doneTitle.focus();
    else if (wasDone && !nowDone) el.card.focus();
  }

  el.card.addEventListener("click", () => update(step(state)));
  el.next.addEventListener("click", () => update(step(state)));
  el.prev.addEventListener("click", () => update(stepBack(state)));
  el.mark.addEventListener("click", () => update(toggleMark(state)));
  el.review.addEventListener("click", () => update(startReview(state)));
  el.restart.addEventListener("click", () => update(restart(state)));

  // 버튼과 링크의 기본 동작은 막지 않는다. Space/Enter 는 포커스가 그런 요소에 없을 때만 가로챈다.
  document.addEventListener("keydown", e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const onControl = e.target.closest("button, a, input, select, textarea");
    if (e.key === "ArrowRight") {
      e.preventDefault();
      update(step(state));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      update(stepBack(state));
    } else if (e.key === "d" || e.key === "D" || e.key === "ㅇ") {
      if (!isDone(state)) update(toggleMark(state));
    } else if ((e.key === " " || e.key === "Enter") && !onControl) {
      e.preventDefault();
      if (!e.repeat) update(step(state));
    }
  });

  document.title = `${section.title} · ${book.title} — 영어 문장 연습`;
  el.title.textContent = `${book.title} · ${section.title}`;
  root.hidden = false;
  paint();
  persist();
  el.card.focus({ preventScroll: true });
}
