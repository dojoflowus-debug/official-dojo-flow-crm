import { useEffect, useState } from 'react';

interface KaiCaptionsProps {
  message: string;
  isPlaying: boolean;
  onComplete?: () => void;
}

export function KaiCaptions({ message, isPlaying, onComplete }: KaiCaptionsProps) {
  const [currentLines, setCurrentLines] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isPlaying || !message) {
      setIsVisible(false);
      setCurrentLines([]);
      return;
    }

    // Split message into sentences/chunks for caption display
    const sentences = message
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0);

    if (sentences.length === 0) return;

    // Group sentences into 2-line chunks
    const chunks: string[] = [];
    let currentChunk = '';
    
    sentences.forEach((sentence, index) => {
      const testChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
      
      // If adding this sentence would make it too long (>100 chars) or we have 2 sentences, start new chunk
      if ((testChunk.length > 100 && currentChunk) || (currentChunk && currentChunk.split('. ').length >= 2)) {
        chunks.push(currentChunk);
        currentChunk = sentence;
      } else {
        currentChunk = testChunk;
      }
      
      // Push last chunk
      if (index === sentences.length - 1 && currentChunk) {
        chunks.push(currentChunk);
      }
    });

    // Calculate timing based on speech rate (approximately 150 words per minute)
    const wordsPerChunk = chunks.map(chunk => chunk.split(' ').length);
    const timingsMs = wordsPerChunk.map(words => Math.max(2000, (words / 150) * 60 * 1000));

    let chunkIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const showNextChunk = () => {
      if (chunkIndex < chunks.length) {
        setCurrentLines([chunks[chunkIndex]]);
        setIsVisible(true);
        
        chunkIndex++;
        if (chunkIndex < chunks.length) {
          timeoutId = setTimeout(showNextChunk, timingsMs[chunkIndex - 1]);
        } else {
          // All chunks shown, hide captions after last chunk duration
          timeoutId = setTimeout(() => {
            setIsVisible(false);
            setCurrentLines([]);
            onComplete?.();
          }, timingsMs[chunkIndex - 1]);
        }
      }
    };

    // Start showing captions
    showNextChunk();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [message, isPlaying, onComplete]);

  if (!isVisible || currentLines.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-[280px] left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4">
      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-red-500/30 shadow-lg shadow-red-500/20">
        <div className="text-white text-center space-y-2">
          {currentLines.map((line, index) => (
            <p key={index} className="text-sm leading-relaxed animate-in fade-in duration-300">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
