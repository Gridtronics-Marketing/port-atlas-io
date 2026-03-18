import { useState, useRef, useEffect } from 'react';
import { X, Download, Maximize2, Volume2, VolumeX, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { TradeTubeContent } from '@/hooks/useTradeTubeContent';
import { cn } from '@/lib/utils';
import { useSignedUrl } from '@/hooks/useSignedUrl';

interface TradeTubeMediaPlayerProps {
  content: TradeTubeContent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordView?: (contentId: string) => void;
}

export function TradeTubeMediaPlayer({
  content,
  open,
  onOpenChange,
  onRecordView,
}: TradeTubeMediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [hasRecordedView, setHasRecordedView] = useState(false);

  const resolvedUrl = useSignedUrl('tradetube-media', content?.file_url || null);
  const mediaRef = content?.media_type === 'video' ? videoRef : audioRef;

  useEffect(() => {
    if (open && content && !hasRecordedView && onRecordView) {
      // Record view after 3 seconds of watching
      const timer = setTimeout(() => {
        onRecordView(content.id);
        setHasRecordedView(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, content, hasRecordedView, onRecordView]);

  useEffect(() => {
    if (!open) {
      setHasRecordedView(false);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [open]);

  const togglePlay = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const media = mediaRef.current;
    if (media) {
      setCurrentTime(media.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    const media = mediaRef.current;
    if (media) {
      setDuration(media.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    const media = mediaRef.current;
    if (media) {
      media.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const media = mediaRef.current;
    if (media) {
      const newVolume = value[0];
      media.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (media) {
      media.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const skip = (seconds: number) => {
    const media = mediaRef.current;
    if (media) {
      media.currentTime = Math.max(0, Math.min(duration, media.currentTime + seconds));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (resolvedUrl) {
      const link = document.createElement('a');
      link.href = resolvedUrl;
      link.download = content?.title || 'download';
      link.click();
    }
  };

  if (!content) return null;

  const isVideo = content.media_type === 'video';
  const isAudio = content.media_type === 'audio' || content.media_type === 'voice_note';
  const isImage = content.media_type === 'image';
  const isDocument = content.media_type === 'document';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">{content.title}</h2>
            {content.description && (
              <p className="text-sm text-muted-foreground truncate">
                {content.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button variant="ghost" size="icon" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Media Content */}
        <div className="relative bg-black">
          {isVideo && (
            <video
              ref={videoRef}
              src={resolvedUrl}
              className="w-full max-h-[60vh] mx-auto"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              onClick={togglePlay}
            />
          )}

          {isAudio && (
            <div className="flex items-center justify-center p-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <Volume2 className="h-16 w-16 text-primary" />
                </div>
                <audio
                  ref={audioRef}
                  src={content.file_url}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                />
              </div>
            </div>
          )}

          {isImage && (
            <img
              src={content.file_url}
              alt={content.title}
              className="w-full max-h-[70vh] object-contain mx-auto"
            />
          )}

          {isDocument && (
            <div className="flex flex-col items-center justify-center p-16 bg-muted">
              <iframe
                src={`${content.file_url}#toolbar=0`}
                className="w-full h-[60vh] border-0"
                title={content.title}
              />
            </div>
          )}
        </div>

        {/* Controls for Video/Audio */}
        {(isVideo || isAudio) && (
          <div className="p-4 space-y-3 border-t bg-background">
            {/* Progress Bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-12">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12 text-right">
                {formatTime(duration)}
              </span>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => skip(-10)}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button 
                  variant="default" 
                  size="icon" 
                  className="h-10 w-10"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => skip(10)}>
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={toggleMute}>
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
