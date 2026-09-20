// 진도를 localStorage 에 저장한다. 저장소를 쓸 수 없으면 조용히 건너뛴다.
//
// 키:  drill:v1:{source}/{section}
// 값:  { no, at, total, marked, updatedAt }
//   no     다음에 이어서 볼 문장 번호. 한 바퀴를 끝냈으면 null.
//   at     그 문장이 몇 번째인지. 목록 화면에 "12 / 22" 를 보여주려고 같이 적어 둔다.
//   total  마지막으로 연습했을 때의 문장 수.
//   marked 헷갈린다고 표시한 문장 번호들.
// at 과 total 은 사실의 원본이 아니라 그때의 기록이다. TSV 가 바뀌면 잠시 어긋날 수 있고,
// 그 섹션을 다시 열면 최신 값으로 갱신된다. 이어서 볼 위치는 항상 no 로 찾는다.

const PREFIX = "drill:v1:";

const keyOf = (sourceId, sectionId) => `${PREFIX}${sourceId}/${sectionId}`;

function isRecord(v) {
  return v
    && (typeof v.no === "string" || v.no === null)
    && Number.isInteger(v.at) && v.at >= 0
    && Number.isInteger(v.total) && v.total > 0
    && Array.isArray(v.marked) && v.marked.every(n => typeof n === "string");
}

export function loadProgress(sourceId, sectionId) {
  try {
    const raw = localStorage.getItem(keyOf(sourceId, sectionId));
    if (!raw) return null;
    // marked 가 없던 옛 기록도 그대로 읽는다.
    const value = { marked: [], ...JSON.parse(raw) };
    return isRecord(value) ? value : null;
  } catch (err) {
    return null;
  }
}

// 저장된 모든 섹션의 진도를 최근에 연습한 순으로 돌려준다.
export function listProgress() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(PREFIX)) continue;
      const rest = key.slice(PREFIX.length);
      const slash = rest.indexOf("/");
      if (slash < 1) continue;
      const sourceId = rest.slice(0, slash);
      const sectionId = rest.slice(slash + 1);
      const saved = loadProgress(sourceId, sectionId);
      if (saved) out.push({ sourceId, sectionId, saved });
    }
  } catch (err) {
    return [];
  }
  return out.sort((a, b) => (b.saved.updatedAt || 0) - (a.saved.updatedAt || 0));
}

export function saveProgress(sourceId, sectionId, { no, at, total, marked }) {
  try {
    const value = { no, at, total, marked, updatedAt: Date.now() };
    if (!isRecord(value)) return;
    localStorage.setItem(keyOf(sourceId, sectionId), JSON.stringify(value));
  } catch (err) {
    // 시크릿 모드나 용량 초과. 저장만 못 할 뿐 연습은 그대로 된다.
  }
}
