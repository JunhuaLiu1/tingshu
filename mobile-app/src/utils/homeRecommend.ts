const JUNK_PATTERNS: RegExp[] = [
  /抖音/i,
  /douyin/i,
  /快手/i,
  /短视频/i,
  /热梗/i,
  /网红/i,
  /直播/i,
  /带货/i,
  /口播/i,
  /神曲/i,
  /BGM/i,
];

const CLASSIC_TITLES = new Set<string>([
  "百年孤独",
  "悲惨世界",
  "战争与和平",
  "基督山伯爵",
  "傲慢与偏见",
  "简爱",
  "老人与海",
  "小王子",
  "1984",
  "飘",
  "福尔摩斯探案集",
  "红楼梦",
  "西游记",
  "三国演义",
  "水浒传",
]);

const CLASSIC_KEYWORDS: string[] = [
  "世界名著",
  "名著",
  "经典",
  "外国文学",
  "外国小说",
  "文学",
  "小说",
  "诺贝尔",
  "莎士比亚",
  "海明威",
  "雨果",
  "托尔斯泰",
  "陀思妥耶夫斯基",
  "奥威尔",
  "大仲马",
  "奥斯汀",
  "加缪",
  "黑塞",
  "马尔克斯",
  "村上春树",
];

const normalize = (value?: string) => (value || "").trim();

const isJunk = (title?: string, author?: string) => {
  const t = normalize(title);
  const a = normalize(author);
  return JUNK_PATTERNS.some((re) => re.test(t) || re.test(a));
};

const scoreClassic = (title?: string, author?: string) => {
  const t = normalize(title);
  const a = normalize(author);

  if (!t && !a) return 0;
  if (isJunk(t, a)) return -9999;

  let score = 0;
  if (CLASSIC_TITLES.has(t)) score += 100;

  for (const keyword of CLASSIC_KEYWORDS) {
    if (t.includes(keyword)) score += 8;
    if (a.includes(keyword)) score += 5;
  }

  return score;
};

export const prioritizeForeignAndClassics = <
  T extends { title?: string; author?: string },
>(
  items: T[],
  options?: { limit?: number },
): T[] => {
  if (!Array.isArray(items) || items.length === 0) return [];

  const decorated = items.map((item, index) => ({
    item,
    index,
    score: scoreClassic(item.title, item.author),
  }));

  const filtered = decorated.filter((d) => d.score > -9999);
  const base = filtered.length > 0 ? filtered : decorated;

  base.sort((a, b) => b.score - a.score || a.index - b.index);
  const result = base.map((d) => d.item);

  if (options?.limit && options.limit > 0) return result.slice(0, options.limit);
  return result;
};

