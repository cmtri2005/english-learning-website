import { useState, useEffect, useRef } from 'react';
import { practiceApi, YouTubeVideo } from '@/services/practice';
import { ExternalLink, Play, Loader2, Youtube } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

// Debug: Log practiceApi để kiểm tra
console.log('[VideoRecommendations] practiceApi:', practiceApi);
console.log('[VideoRecommendations] getYouTubeRecommendations:', typeof practiceApi?.getYouTubeRecommendations);

interface VideoRecommendationsProps {
  feedback: string;
  weaknesses: string[];
  skillType: 'speaking' | 'writing';
}

export function VideoRecommendations({ feedback, weaknesses, skillType }: VideoRecommendationsProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Only fetch once
    if (hasFetchedRef.current) return;
    
    if (!feedback && weaknesses.length === 0) {
      console.log('[VideoRecommendations] No feedback or weaknesses, skipping fetch');
      setIsLoading(false);
      return;
    }

    hasFetchedRef.current = true;
    console.log('[VideoRecommendations] Fetching videos...', { feedback: feedback.slice(0, 100), weaknesses, skillType });

    const fetchVideos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await practiceApi.getYouTubeRecommendations(
          feedback,
          weaknesses,
          skillType,
          3
        );
        console.log('[VideoRecommendations] Received videos:', result.videos);
        setVideos(result.videos);
      } catch (err) {
        console.error('[VideoRecommendations] Failed to fetch:', err);
        setError('Không thể tải video gợi ý');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [feedback, weaknesses, skillType]);

  // Always show something during/after evaluation
  // Loading state
  if (isLoading) {
    return (
      <div className="border rounded-lg p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Đang tìm video hướng dẫn phù hợp...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="border rounded-lg p-6">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  // No videos found
  if (!isLoading && videos.length === 0) {
    return null;
  }

  // Don't render anything if no feedback/weaknesses
  if (!feedback && weaknesses.length === 0) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
        <div className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-600" />
          <h3 className="font-medium">Video hướng dẫn</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Các video học tiếng Anh phù hợp với điểm cần cải thiện
        </p>
      </div>

      {/* Video Player (if selected) */}
      {selectedVideo && (
        <div className="bg-black aspect-video">
          <iframe
            src={`${selectedVideo.embed_url}?autoplay=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={selectedVideo.title}
          />
        </div>
      )}

      {/* Video List */}
      <div className="divide-y">
        {videos.map((video) => (
          <div
            key={video.video_id}
            className={`flex gap-4 p-4 transition-colors hover:bg-muted/50 cursor-pointer ${
              selectedVideo?.video_id === video.video_id ? 'bg-muted/30' : ''
            }`}
            onClick={() => setSelectedVideo(selectedVideo?.video_id === video.video_id ? null : video)}
          >
            {/* Thumbnail */}
            <div className="relative flex-shrink-0 w-32 md:w-40">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full aspect-video object-cover rounded"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded opacity-0 hover:opacity-100 transition-opacity">
                <Play className="h-8 w-8 text-white fill-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm line-clamp-2">{video.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{video.channel}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{video.description}</p>
              
              {/* External link */}
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 mt-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(video.url, '_blank');
                }}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Xem trên YouTube
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
