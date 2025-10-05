let _cvReady: Promise<void> | null = null;

declare global {
  interface Window {
    cv: any;
  }
}

export function ensureOpenCV(wasmUrl?: string, opencvJsUrl?: string) {
  if (_cvReady) return _cvReady;

  _cvReady = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.async = true;
    script.src =
      opencvJsUrl ??
      'https://docs.opencv.org/4.9.0/opencv.js'; 
    (window as any).Module = {

      onRuntimeInitialized() {
        resolve();
      },
    };

    script.onerror = (e) => reject(new Error('Failed to load opencv.js'));
    document.body.appendChild(script);
  });

  return _cvReady;
}
