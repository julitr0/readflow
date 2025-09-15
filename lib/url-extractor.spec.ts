import { describe, test, expect } from 'vitest';
import { extractLinksFromEmail } from './url-extractor';

describe('extractLinksFromEmail', () => {
  test('extracts Substack link from HTML anchor', () => {
    const html = `<p>Check out this article: <a href="https://example.substack.com/p/great-article">Read more</a></p>`;
    const urls = extractLinksFromEmail(html);
    
    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe('https://example.substack.com/p/great-article');
  });

  test('extracts plain text Substack URL', () => {
    const html = `Here's a great read: https://newsletter.substack.com/p/interesting-post`;
    const urls = extractLinksFromEmail(html);
    
    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe('https://newsletter.substack.com/p/interesting-post');
  });

  test('extracts multiple newsletter links', () => {
    const html = `
      <a href="https://example.substack.com/p/article1">Article 1</a>
      <a href="https://medium.com/@author/post-123">Article 2</a>
      https://another.beehiiv.com/p/newsletter
    `;
    const urls = extractLinksFromEmail(html);
    
    expect(urls).toHaveLength(3);
    expect(urls).toContain('https://example.substack.com/p/article1');
    expect(urls).toContain('https://medium.com/@author/post-123');
    expect(urls).toContain('https://another.beehiiv.com/p/newsletter');
  });

  test('filters out non-newsletter URLs', () => {
    const html = `
      <a href="https://google.com">Google</a>
      <a href="https://example.substack.com/p/article">Newsletter</a>
      <a href="https://facebook.com">Facebook</a>
    `;
    const urls = extractLinksFromEmail(html);
    
    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe('https://example.substack.com/p/article');
  });

  test('returns empty array when no newsletter links found', () => {
    const html = `<p>This is just regular content without any newsletter links</p>`;
    const urls = extractLinksFromEmail(html);
    
    expect(urls).toHaveLength(0);
  });

  test('handles malformed HTML gracefully', () => {
    const html = `<a href="https://example.substack.com/p/article">Unclosed tag`;
    const urls = extractLinksFromEmail(html);
    
    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe('https://example.substack.com/p/article');
  });

  test('deduplicates identical URLs', () => {
    const html = `
      <a href="https://example.substack.com/p/article">Link 1</a>
      https://example.substack.com/p/article
    `;
    const urls = extractLinksFromEmail(html);
    
    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe('https://example.substack.com/p/article');
  });
});