import matter from 'gray-matter';

export type ParsedArticle = {
  articleNo: string;
  text: string;
  path: string[];
};

const ARTICLE_RE = /^\*\*(第[一二三四五六七八九十百千零〇两]+条)\*\*[　\s]*(.*)$/;
const H2_RE = /^##\s+(.+)$/;
const H3_RE = /^###\s+(.+)$/;

const DIGITS: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

const UNITS: Record<string, number> = {
  十: 10,
  百: 100,
  千: 1000,
};

export function chineseNumeralToInt(numeral: string): number {
  let section = 0;
  let digit = 0;

  for (const ch of numeral) {
    if (ch in DIGITS) {
      digit = DIGITS[ch];
      continue;
    }

    const unit = UNITS[ch];
    if (unit === undefined) {
      throw new Error(`无法解析中文数字：${numeral}`);
    }
    section += (digit || 1) * unit;
    digit = 0;
  }

  return section + digit;
}

export function parseLawMarkdown(markdown: string): ParsedArticle[] {
  const lines = matter(markdown).content.split(/\r?\n/);
  const articles: ParsedArticle[] = [];
  let path: string[] = [];
  let current: ParsedArticle | undefined;
  let paragraphs: string[] = [];

  const flushParagraph = () => {
    if (!current) {
      paragraphs = [];
      return;
    }
    const text = paragraphs.join('\n').trim();
    if (text) {
      current.text = current.text ? `${current.text}\n\n${text}` : text;
    }
    paragraphs = [];
  };

  for (const raw of lines) {
    const h2 = H2_RE.exec(raw);
    if (h2) {
      flushParagraph();
      path = [h2[1].trim()];
      continue;
    }

    const h3 = H3_RE.exec(raw);
    if (h3) {
      flushParagraph();
      path = path.length ? [path[0], h3[1].trim()] : [h3[1].trim()];
      continue;
    }

    if (raw.startsWith('# ')) {
      flushParagraph();
      continue;
    }

    const article = ARTICLE_RE.exec(raw);
    if (article) {
      flushParagraph();
      current = {
        articleNo: article[1],
        text: article[2].trim(),
        path: [...path],
      };
      articles.push(current);
      continue;
    }

    const line = raw.trim();
    if (!line) {
      flushParagraph();
      continue;
    }

    if (current) {
      paragraphs.push(line);
    }
  }

  flushParagraph();
  return articles;
}
