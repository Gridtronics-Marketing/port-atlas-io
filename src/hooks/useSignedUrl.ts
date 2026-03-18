import { useState, useEffect, useRef } from 'react';
import { getSignedStorageUrl } from '@/lib/storage-utils';

/**
 * Hook to resolve a relative storage path to a signed URL on-the-fly.
 * If the path already starts with "http", it's passed through as-is (backward compat).
 * Returns an empty string while loading.
 */
export function useSignedUrl(bucket: string, path: string | null | undefined): string {
  const [url, setUrl] = useState<string>('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!path) {
      setUrl('');
      return;
    }

    // Already a full URL — pass through
    if (path.startsWith('http')) {
      setUrl(path);
      return;
    }

    let cancelled = false;
    getSignedStorageUrl(bucket, path).then((signed) => {
      if (!cancelled && mountedRef.current) {
        setUrl(signed);
      }
    });

    return () => { cancelled = true; };
  }, [bucket, path]);

  return url;
}

/**
 * Hook to resolve multiple signed URLs at once.
 */
export function useSignedUrls(items: Array<{ bucket: string; path: string | null | undefined }>): string[] {
  const [urls, setUrls] = useState<string[]>(() => items.map(() => ''));

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      items.map(({ bucket, path }) => {
        if (!path) return Promise.resolve('');
        if (path.startsWith('http')) return Promise.resolve(path);
        return getSignedStorageUrl(bucket, path);
      })
    ).then((resolved) => {
      if (!cancelled) setUrls(resolved);
    });

    return () => { cancelled = true; };
  }, [JSON.stringify(items)]);

  return urls;
}
