// 카드 화면과 완료 화면. session 상태를 그리고, 입력을 session 동작으로 바꾼다.

import {
  createSession, currentRow, exitReview, isDone, isMarked, restart, startReview, step, stepBack,
  toggleMark,
} from "./session.js";
import { loadProgress, saveProgress } from "./store.js";

export function renderDrill({ book, section }, rows) {
  const root = document.getElementById("drill");
  const $ = id => document.getElementById(id);
  const el = {
    title: $("drill-title"),
    chip: $("chip"),
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

  // 칩 하나가 두 역할을 한다. 전체를 돌 때는 헷갈림 묶음으로 들어가는 문이고,
  // 그 묶음 안에서는 눌린 상태로 보이면서 전체로 나가는 길이 된다.
  function paintChip(markedCount) {
    el.chip.hidden = !state.reviewing && markedCount === 0;
    if (el.chip.hidden) return;
    el.chip.textContent = state.reviewing ? "헷갈린 문장만" : `헷갈림 ${markedCount}`;
    el.chip.setAttribute("aria-pressed", String(state.reviewing));
    el.chip.title = state.reviewing ? "전체 문장으로 돌아가기" : "헷갈린 문장만 연습하기";
  }

  // 헷갈림 묶음을 끝낸 뒤에는 보던 자리로 돌아갈 수 있다.
  function canResumeFull() {
    return state.reviewing && !!position && position.no !== null;
  }

  function paint() {
    const total = state.rows.length;
    const done = isDone(state);
    const markedCount = state.marked.length;

    el.card.hidden = done;
    el.actions.hidden = done;
    el.done.hidden = !done;
    paintChip(markedCount);
    el.tally.textContent = `${done ? total : state.at + 1} / ${total}`;
    el.fill.style.width = `${(done ? 1 : state.at / total) * 100}%`;

    if (done) {
      el.doneTitle.textContent = state.reviewing ? "헷갈린 문장을 다 봤습니다" : "한 바퀴 끝났습니다";
      el.doneBody.textContent = state.reviewing
        ? (markedCount
          ? `아직 ${markedCount}문장이 헷갈림으로 남아 있습니다.`
          : "헷갈림 표시가 모두 해제됐습니다.")
        : (markedCount
          ? `${total}문장을 모두 봤습니다. 헷갈린다고 표시한 문장이 ${markedCount}개 있습니다.`
          : `${total}문장을 모두 봤습니다.`);
      el.review.hidden = markedCount === 0;
      el.review.textContent = `헷갈린 ${markedCount}문장 연습`;
      el.restart.textContent = canResumeFull() ? `전체 이어서 (${position.at} / ${rows.length})`
        : state.reviewing ? "전체 처음부터"
        : "처음부터";
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
  el.chip.addEventListener("click", () => {
    update(state.reviewing ? exitReview(state, position ? position.no : null) : startReview(state));
  });
  el.restart.addEventListener("click", () => {
    update(canResumeFull() ? exitReview(state, position.no) : restart(state));
  });

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
