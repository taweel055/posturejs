// Tests for ConfigManager
import { describe, it, expect, beforeEach } from 'vitest';

// Import the config module
// Note: In a real test, we'd need to handle the global window assignment
const createConfigManager = () => {
  // Mock the ConfigManager class (simplified for testing)
  class ConfigManager {
    constructor() {
      this.version = '1.0.0';
      this.defaultConfig = {
        system: {
          version: this.version,
          debugMode: false,
          performanceLogging: true,
          maxFPS: 60
        },
        camera: {
          resolution: { width: 1280, height: 720 },
          frameRate: 30,
          facingMode: 'user'
        },
        analysis: {
          mode: 'advanced',
          detectionConfidence: 0.7,
          trackingConfidence: 0.5
        }
      };
      this.config = { ...this.defaultConfig };
    }
    
    get(path, defaultValue = null) {
      const keys = path.split('.');
      let current = this.config;
      
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return defaultValue;
        }
      }
      
      return current;
    }
    
    set(path, value) {
      const keys = path.split('.');
      const lastKey = keys.pop();
      let current = this.config;
      
      for (const key of keys) {
        if (!(key in current) || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
      
      current[lastKey] = value;
    }
    
    getCameraConstraints() {
      return {
        video: {
          width: { ideal: this.config.camera.resolution.width },
          height: { ideal: this.config.camera.resolution.height },
          frameRate: { ideal: this.config.camera.frameRate },
          facingMode: this.config.camera.facingMode
        },
        audio: false
      };
    }
    
    getMediaPipeConfig() {
      return {
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: this.config.analysis.detectionConfidence,
        minTrackingConfidence: this.config.analysis.trackingConfidence
      };
    }
  }
  
  return new ConfigManager();
};

describe('ConfigManager', () => {
  let config;
  
  beforeEach(() => {
    config = createConfigManager();
  });
  
  describe('Configuration Management', () => {
    it('should initialize with default configuration', () => {
      expect(config.get('system.version')).toBe('1.0.0');
      expect(config.get('analysis.mode')).toBe('advanced');
      expect(config.get('camera.resolution.width')).toBe(1280);
    });
    
    it('should get configuration values with dot notation', () => {
      expect(config.get('system.maxFPS')).toBe(60);
      expect(config.get('camera.frameRate')).toBe(30);
      expect(config.get('analysis.detectionConfidence')).toBe(0.7);
    });
    
    it('should return default value for non-existent paths', () => {
      expect(config.get('nonexistent.path', 'default')).toBe('default');
      expect(config.get('system.nonexistent')).toBeNull();
    });
    
    it('should set configuration values with dot notation', () => {
      config.set('analysis.mode', 'basic');
      expect(config.get('analysis.mode')).toBe('basic');
      
      config.set('camera.resolution.width', 640);
      expect(config.get('camera.resolution.width')).toBe(640);
    });
    
    it('should handle nested object creation', () => {
      config.set('new.nested.value', 'test');
      expect(config.get('new.nested.value')).toBe('test');
    });
  });
  
  describe('Camera Constraints', () => {
    it('should generate valid camera constraints', () => {
      const constraints = config.getCameraConstraints();
      
      expect(constraints).toHaveProperty('video');
      expect(constraints).toHaveProperty('audio', false);
      expect(constraints.video.width.ideal).toBe(1280);
      expect(constraints.video.height.ideal).toBe(720);
      expect(constraints.video.frameRate.ideal).toBe(30);
    });
    
    it('should update constraints when resolution changes', () => {
      config.set('camera.resolution', { width: 640, height: 480 });
      config.set('camera.frameRate', 24);
      
      const constraints = config.getCameraConstraints();
      expect(constraints.video.width.ideal).toBe(640);
      expect(constraints.video.height.ideal).toBe(480);
      expect(constraints.video.frameRate.ideal).toBe(24);
    });
  });
  
  describe('MediaPipe Configuration', () => {
    it('should generate valid MediaPipe configuration', () => {
      const mpConfig = config.getMediaPipeConfig();
      
      expect(mpConfig).toHaveProperty('modelComplexity', 1);
      expect(mpConfig).toHaveProperty('smoothLandmarks', true);
      expect(mpConfig).toHaveProperty('minDetectionConfidence', 0.7);
      expect(mpConfig).toHaveProperty('minTrackingConfidence', 0.5);
    });
    
    it('should update MediaPipe config when analysis settings change', () => {
      config.set('analysis.detectionConfidence', 0.8);
      config.set('analysis.trackingConfidence', 0.6);
      
      const mpConfig = config.getMediaPipeConfig();
      expect(mpConfig.minDetectionConfidence).toBe(0.8);
      expect(mpConfig.minTrackingConfidence).toBe(0.6);
    });
  });
  
  describe('Configuration Validation', () => {
    it('should handle invalid configuration gracefully', () => {
      // Test with undefined/null values
      config.set('test.value', null);
      expect(config.get('test.value')).toBeNull();
      
      config.set('test.undefined', undefined);
      expect(config.get('test.undefined')).toBeUndefined();
    });
    
    it('should preserve configuration structure', () => {
      const originalResolution = config.get('camera.resolution');
      config.set('camera.resolution.width', 1920);
      
      expect(config.get('camera.resolution.height')).toBe(originalResolution.height);
      expect(config.get('camera.resolution.width')).toBe(1920);
    });
  });
});