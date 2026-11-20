export function extractMdxText(source: string): string {
  return source
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#*_`>[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
