// 섹션 선택 화면. 각 섹션은 ?book=&section= 링크라서 이동은 페이지 로드로 처리된다.

import { loadProgress } from "./store.js";

// 한 번도 연습하지 않은 섹션은 저장된 진도가 없어서 아무것도 보여주지 않는다.
function progressLabel(bookId, sectionId) {
  const saved = loadProgress(bookId, sectionId);
  if (!saved) return "";
  const where = saved.no === null ? "한 바퀴 완료" : `${saved.at} / ${saved.total}`;
  return saved.marked.length ? `${where} · 표시 ${saved.marked.length}` : where;
}

export function renderPicker(manifest, { notice } = {}) {
  const root = document.getElementById("picker");
  const noticeEl = document.getElementById("picker-notice");
  const list = document.getElementById("picker-books");

  noticeEl.textContent = notice || "";
  noticeEl.hidden = !notice;

  list.replaceChildren(...manifest.books.map(book => {
    const group = document.createElement("section");
    group.className = "book";

    const heading = document.createElement("h2");
    heading.textContent = book.title;

    const ul = document.createElement("ul");
    ul.className = "sections";
    for (const section of book.sections) {
      const a = document.createElement("a");
      a.href = "?" + new URLSearchParams({ book: book.id, section: section.id });

      const title = document.createElement("span");
      title.textContent = section.title;
      const progress = document.createElement("span");
      progress.className = "progress";
      progress.textContent = progressLabel(book.id, section.id);
      a.append(title, progress);

      const li = document.createElement("li");
      li.append(a);
      ul.append(li);
    }

    group.append(heading, ul);
    return group;
  }));

  root.hidden = false;
}
