export function isValidVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    const urlObj = new URL(url);
    
    // YouTube URLs
    if (isYouTubeUrl(urlObj)) return true;
    
    // Vimeo URLs
    if (isVimeoUrl(urlObj)) return true;
    
    // Direct video file URLs
    if (isDirectVideoUrl(urlObj)) return true;
    
    // Dailymotion URLs
    if (isDailymotionUrl(urlObj)) return true;
    
    return false;
  } catch {
    return false;
  }
}

export function getVideoType(url: string): 'youtube' | 'vimeo' | 'dailymotion' | 'direct' | 'unknown' {
  if (!url) return 'unknown';
  
  try {
    const urlObj = new URL(url);
    
    if (isYouTubeUrl(urlObj)) return 'youtube';
    if (isVimeoUrl(urlObj)) return 'vimeo';
    if (isDailymotionUrl(urlObj)) return 'dailymotion';
    if (isDirectVideoUrl(urlObj)) return 'direct';
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

function isYouTubeUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  return (
    hostname === 'youtube.com' ||
    hostname === 'www.youtube.com' ||
    hostname === 'youtu.be' ||
    hostname === 'm.youtube.com'
  );
}

function isVimeoUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  return hostname === 'vimeo.com' || hostname === 'www.vimeo.com';
}

function isDailymotionUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  return hostname === 'dailymotion.com' || hostname === 'www.dailymotion.com';
}

function isDirectVideoUrl(url: URL): boolean {
  const pathname = url.pathname.toLowerCase();
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv'];
  
  return videoExtensions.some(ext => pathname.endsWith(ext));
}

export function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    if (isYouTubeUrl(urlObj)) {
      // Handle youtu.be format
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1);
      }
      
      // Handle youtube.com format
      const searchParams = urlObj.searchParams;
      return searchParams.get('v');
    }
    
    if (isVimeoUrl(urlObj)) {
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      return pathSegments[0] || null;
    }
    
    return null;
  } catch {
    return null;
  }
}

export function normalizeVideoUrl(url: string): string {
  // For now, just return the original URL
  // Could add URL normalization logic here if needed
  return url.trim();
}
