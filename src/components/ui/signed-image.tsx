import React from 'react';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SignedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  bucket: string;
  path: string | null | undefined;
  /** If true, show a skeleton placeholder while loading */
  showSkeleton?: boolean;
}

export const SignedImage: React.FC<SignedImageProps> = ({
  bucket,
  path,
  showSkeleton = true,
  className,
  ...imgProps
}) => {
  const url = useSignedUrl(bucket, path);

  if (!url && path && !path.startsWith('http')) {
    if (showSkeleton) {
      return <Skeleton className={cn('w-full h-full', className)} />;
    }
    return null;
  }

  if (!url && !path) return null;

  return <img src={url} className={className} {...imgProps} />;
};
