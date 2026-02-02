import { sourceApi } from '../services/api';
import { Book } from '../types';

type RouterLike = {
  push: (args: any) => void;
};

type BookLike = Pick<Book, 'id' | 'title' | 'author' | 'cover_url' | 'coverUrl' | 'cover_proxy_url' | 'coverProxyUrl' | 'source_id' | 'sourceId'> & {
  [key: string]: any;
};

const getCoverForNav = (book: BookLike): string => {
  return book.cover_proxy_url || book.coverProxyUrl || book.cover_url || book.coverUrl || '';
};

const getSourceId = (book: BookLike): string => {
  return String(book.source_id || book.sourceId || '').trim();
};

const getBookId = (book: BookLike): string => {
  return String(book.id ?? '').trim();
};

const tryResolveFromGlobalSearch = async (book: BookLike): Promise<BookLike | null> => {
  const keyword = String(book.title || '').trim();
  if (!keyword) return null;

  const resp = await sourceApi.globalSearch(keyword);
  if (resp.code !== 200) return null;
  const results = resp.data?.results;
  if (!Array.isArray(results) || results.length === 0) return null;

  const targetTitle = String(book.title || '').trim();
  const targetAuthor = String(book.author || '').trim();
  const titleLower = targetTitle.toLowerCase();
  const authorLower = targetAuthor.toLowerCase();

  const best =
    results.find((r: any) => {
      const t = String(r?.title || '').toLowerCase();
      const a = String(r?.author || '').toLowerCase();
      return titleLower && t.includes(titleLower) && (!authorLower || a.includes(authorLower));
    }) || results[0];

  return best as BookLike;
};

export async function openBookInPlayer(router: RouterLike, book: BookLike): Promise<void> {
  if (!book) return;

  let resolved: BookLike = book;
  if (!getSourceId(resolved) || !getBookId(resolved)) {
    try {
      const fromSearch = await tryResolveFromGlobalSearch(book);
      if (fromSearch) resolved = fromSearch;
    } catch {
      // ignore and fallback to original book
    }
  }

  const bookId = getBookId(resolved) || getBookId(book);
  const sourceId = getSourceId(resolved) || getSourceId(book);

  router.push({
    pathname: '/player',
    params: {
      bookId,
      sourceId,
      title: String(resolved.title || book.title || ''),
      author: String(resolved.author || book.author || ''),
      coverUrl: getCoverForNav(resolved) || getCoverForNav(book),
    },
  } as any);
}

