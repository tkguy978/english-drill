// manifest.json 과 섹션 TSV 를 불러온다. 상태는 갖지 않는다.

const DATA_DIR = new URL("../data/", import.meta.url);

async function fetchText(name) {
  const res = await fetch(new URL(name, DATA_DIR));
  if (!res.ok) throw new Error(`${name} 을(를) 불러오지 못했습니다 (HTTP ${res.status})`);
  return res.text();
}

// 책 > 그룹(에피소드) > 섹션(장면) 세 단계다.
function assertManifest(m) {
  const ok = m && Array.isArray(m.books) && m.books.every(b =>
    b && b.id && b.title && Array.isArray(b.groups) && b.groups.every(gr =>
      gr && gr.id && gr.title && Array.isArray(gr.sections) && gr.sections.every(s =>
        s && s.id && s.title && s.file)));
  if (!ok) throw new Error("manifest.json 형식이 올바르지 않습니다");
  return m;
}

export async function loadManifest() {
  return assertManifest(JSON.parse(await fetchText("manifest.json")));
}

export function findSection(manifest, bookId, sectionId) {
  const book = manifest.books.find(b => b.id === bookId);
  if (!book) return null;
  for (const group of book.groups) {
    const section = group.sections.find(s => s.id === sectionId);
    if (section) return { book, group, section };
  }
  return null;
}

// 헤더 없음, 탭 구분, 열 순서: 번호 / 책 / 섹션 / 한글 / 영어
export function parseTsv(text) {
  const rows = [];
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    const cells = line.split("\t").map(c => c.trim());
    if (cells.length !== 5 || !cells[3] || !cells[4]) {
      console.warn(`TSV ${i + 1}번째 줄을 건너뜁니다:`, line);
      return;
    }
    const [no, book, section, ko, en] = cells;
    rows.push({ no, book, section, ko, en });
  });
  return rows;
}

export async function loadSection(book, section) {
  const rows = parseTsv(await fetchText(section.file))
    .filter(r => r.book === book.id && r.section === section.id);
  if (!rows.length) throw new Error(`${section.file} 에 ${book.id}/${section.id} 문장이 없습니다`);
  return rows;
}
