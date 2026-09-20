// 진도를 localStorage 에 저장한다. 저장소를 쓸 수 없으면 조용히 건너뛴다.
//
// 키:  drill:v1:{book}/{section}
// 값:  { no, at, total, marked, updatedAt }
//   no     다음에 이어서 볼 문장 번호. 한 바퀴를 끝냈으면 null.
//   at     그 문장이 몇 번째인지. 목록 화면에 "12 / 22" 를 보여주려고 같이 적어 둔다.
//   total  마지막으로 연습했을 때의 문장 수.
//   marked 헷갈린다고 표시한 문장 번호들.
// at 과 total 은 사실의 원본이 아니라 그때의 기록이다. TSV 가 바뀌면 잠시 어긋날 수 있고,
// 그 섹션을 다시 열면 최신 값으로 갱신된다. 이어서 볼 위치는 항상 no 로 찾는다.

const PREFIX = "drill:v1:";

const keyOf = (bookId, sectionId) => `${PREFIX}${bookId}/${sectionId}`;

function isRecord(v) {
  return v
    && (typeof v.no === "string" || v.no === null)
    && Number.isInteger(v.at) && v.at >= 0
    && Number.isInteger(v.total) && v.total > 0
    && Array.isArray(v.marked) && v.marked.every(n => typeof n === "string");
}

export function loadProgress(bookId, sectionId) {
  try {
    const raw = localStorage.getItem(keyOf(bookId, sectionId));
    if (!raw) return null;
    // marked 가 없던 옛 기록도 그대로 읽는다.
    const value = { marked: [], ...JSON.parse(raw) };
    return isRecord(value) ? value : null;
  } catch (err) {
    return null;
  }
}

export function saveProgress(bookId, sectionId, { no, at, total, marked }) {
  try {
    const value = { no, at, total, marked, updatedAt: Date.now() };
    if (!isRecord(value)) return;
    localStorage.setItem(keyOf(bookId, sectionId), JSON.stringify(value));
  } catch (err) {
    // 시크릿 모드나 용량 초과. 저장만 못 할 뿐 연습은 그대로 된다.
  }
}
