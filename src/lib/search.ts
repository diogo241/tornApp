const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const searchTerms = (search: string) =>
  normalize(search)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((term) => term !== '');

/**
 * Matches `text` against a free-text search the way the list filters expect:
 * case and accent insensitive, and insensitive to word order, so `jose pereira`
 * finds `José Augusto Silva Pereira`. An empty search matches everything.
 */
export const matchesSearch = (text: string, search: string) => {
  const normalizedText = normalize(text);

  return searchTerms(search).every((term) => normalizedText.includes(term));
};
