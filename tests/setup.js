// Global test setup for ProPostureFitness
import { vi } from 'vitest';

// Mock MediaPipe APIs
global.Pose = vi.fn(() => ({
  setOptions: vi.fn(),
  onResults: vi.fn(),
  send: vi.fn().mockResolvedValue({}),
  close: vi.fn()
}));

global.Camera = vi.fn(() => ({
  start: vi.fn(),
  stop: vi.fn()
}));

global.drawConnectors = vi.fn();
global.drawLandmarks = vi.fn();

// Mock WebRTC APIs
Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getVideoTracks: () => [{
        stop: vi.fn(),
        getSettings: () => ({
          width: 1280,
          height: 720,
          frameRate: 30
        }),
        getCapabilities: () => ({
          width: { min: 320, max: 1920 },
          height: { min: 240, max: 1080 },
          frameRate: { min: 1, max: 60 }
        })
      }],
      getTracks: () => [{
        stop: vi.fn()
      }]
    }),
    enumerateDevices: vi.fn().mockResolvedValue([
      {
        deviceId: 'camera1',
        kind: 'videoinput',
        label: 'Test Camera'
      }
    ])
  }
});

// Mock Canvas APIs
global.HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
  if (contextType === '2d') {
    return {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(1280 * 720 * 4),
        width: 1280,
        height: 720
      })),
      putImageData: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      transform: vi.fn(),
      setTransform: vi.fn(),
      resetTransform: vi.fn(),
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    };
  } else if (contextType === 'webgl' || contextType === 'webgl2') {
    return {
      createShader: vi.fn(),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      createProgram: vi.fn(),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      useProgram: vi.fn(),
      getShaderParameter: vi.fn(() => true),
      getProgramParameter: vi.fn(() => true),
      getShaderInfoLog: vi.fn(() => ''),
      getProgramInfoLog: vi.fn(() => ''),
      deleteShader: vi.fn(),
      deleteProgram: vi.fn(),
      VERTEX_SHADER: 35633,
      FRAGMENT_SHADER: 35632,
      COMPILE_STATUS: 35713,
      LINK_STATUS: 35714
    };
  }
  return null;
});

// Mock Web APIs
global.ImageData = global.ImageData || class ImageData {
  constructor(data, width, height) {
    this.data = data || new Uint8ClampedArray(width * height * 4);
    this.width = width || 100;
    this.height = height || 100;
  }
};

global.OffscreenCanvas = global.OffscreenCanvas || class OffscreenCanvas {
  constructor(width, height) {
    this.width = width || 100;
    this.height = height || 100;
  }
  
  getContext(type) {
    return global.HTMLCanvasElement.prototype.getContext(type);
  }
  
  transferToImageBitmap() {
    return {};
  }
};

// Mock Performance API
global.performance = global.performance || {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 50, // 50MB
    totalJSHeapSize: 1024 * 1024 * 100, // 100MB
    jsHeapSizeLimit: 1024 * 1024 * 500 // 500MB
  }
};

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn(id => clearTimeout(id));

// Mock localStorage
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

// Mock sessionStorage
global.sessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

// Mock fetch API
global.fetch = vi.fn(() => 
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
  })
);

// Mock URL API
global.URL = global.URL || class URL {
  constructor(url) {
    this.href = url;
    this.origin = 'http://localhost:3000';
    this.protocol = 'http:';
    this.hostname = 'localhost';
    this.port = '3000';
    this.pathname = '/';
    this.search = '';
    this.hash = '';
  }
  
  static createObjectURL() {
    return 'blob:http://localhost:3000/test';
  }
  
  static revokeObjectURL() {}
};

// Mock File and FileReader APIs
global.File = global.File || class File {
  constructor(bits, name, options = {}) {
    this.name = name;
    this.size = bits.reduce((acc, bit) => acc + bit.length, 0);
    this.type = options.type || '';
    this.lastModified = Date.now();
  }
};

global.FileReader = global.FileReader || class FileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
  }
  
  readAsDataURL() {
    setTimeout(() => {
      this.readyState = 2;
      this.result = 'data:image/jpeg;base64,test';
      this.onload?.();
    }, 0);
  }
  
  readAsArrayBuffer() {
    setTimeout(() => {
      this.readyState = 2;
      this.result = new ArrayBuffer(0);
      this.onload?.();
    }, 0);
  }
};

// Mock console for testing
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

// Setup DOM
document.body.innerHTML = `
  <div id="app">
    <video id="videoElement"></video>
    <canvas id="outputCanvas"></canvas>
    <div id="statusOverlay"></div>
    <div id="fpsDisplay">0</div>
    <div id="scoreDisplay">--</div>
    <div id="postureStatus">Ready</div>
    <button id="startBtn">Start</button>
    <button id="stopBtn">Stop</button>
    <button id="screenshotBtn">Screenshot</button>
  </div>
`;

// Global test utilities
global.testUtils = {
  createMockImageData: (width = 100, height = 100) => {
    return new ImageData(
      new Uint8ClampedArray(width * height * 4),
      width,
      height
    );
  },
  
  createMockVideoElement: () => ({
    videoWidth: 1280,
    videoHeight: 720,
    play: vi.fn(),
    pause: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }),
  
  createMockAnalysisResult: (score = 85) => ({
    score,
    status: 'Good',
    mode: 'advanced',
    processingTime: 25,
    detailedMetrics: {
      headAlignment: 85,
      shoulderLevel: 90,
      forwardHead: 80
    },
    landmarks: null
  }),
  
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms))
};

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});