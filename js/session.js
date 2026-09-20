// 한 섹션을 순회하는 연습 상태. DOM 과 저장소는 모른다.
// 상태는 불변 객체로 다루고, 모든 동작은 새 상태를 돌려준다.
//
//   all       섹션의 전체 문장
//   rows      지금 돌고 있는 목록. 전체이거나, 헷갈린다고 표시한 것만 모은 것이다.
//   marked    헷갈린다고 표시한 문장 번호들
//   reviewing rows 가 표시한 것만 모은 목록이면 true

// startNo 가 있으면 그 번호의 문장부터 시작한다. 그 번호가 사라졌으면 처음부터.
export function createSession(all, { startNo = null, marked = [] } = {}) {
  const found = startNo === null ? -1 : all.findIndex(r => r.no === startNo);
  return {
    all,
    rows: all,
    at: Math.max(found, 0),
    revealed: false,
    marked: marked.filter(no => all.some(r => r.no === no)),
    reviewing: false,
  };
}

export function isDone(s) {
  return s.at >= s.rows.length;
}

export function currentRow(s) {
  return isDone(s) ? null : s.rows[s.at];
}

// 정답이 가려져 있으면 보여 주고, 이미 보이면 다음 문장으로 넘어간다.
export function step(s) {
  if (isDone(s)) return s;
  if (!s.revealed) return { ...s, revealed: true };
  return { ...s, at: s.at + 1, revealed: false };
}

export function stepBack(s) {
  if (s.at === 0) return s;
  return { ...s, at: s.at - 1, revealed: false };
}

export function isMarked(s) {
  const row = currentRow(s);
  return !!row && s.marked.includes(row.no);
}

export function toggleMark(s) {
  const row = currentRow(s);
  if (!row) return s;
  const marked = s.marked.includes(row.no)
    ? s.marked.filter(no => no !== row.no)
    : [...s.marked, row.no];
  return { ...s, marked };
}

export function markedRows(s) {
  return s.all.filter(r => s.marked.includes(r.no));
}

// 표시한 문장만 모아 한 바퀴 더. 표시가 하나도 없으면 아무 일도 하지 않는다.
export function startReview(s) {
  const rows = markedRows(s);
  if (!rows.length) return s;
  return { ...s, rows, at: 0, revealed: false, reviewing: true };
}

// 표시는 남겨 두고 전체를 처음부터.
export function restart(s) {
  return { ...s, rows: s.all, at: 0, revealed: false, reviewing: false };
}
