export function getImageSize(
  url: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = (error) => {
      console.error('error', error)
      reject(new Error('Failed to load image'));
    };
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

const cache: { [key: string]: HTMLImageElement } = {}

export function loadImage(
  url: string,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (cache[url]) {
      resolve(cache[url]);
    }
    const img = new Image();
    img.onload = () => {
      cache[url] = img;
      resolve(img);
    };
    img.onerror = (error) => {
      console.error('error', error)
      reject(new Error('Failed to load image'));
    };
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}