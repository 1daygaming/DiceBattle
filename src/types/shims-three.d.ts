declare module 'three' {
  export * from 'three/src/Three';
}

// Ambient declarations for THREE to make TypeScript happy
declare namespace THREE {
  class Vector3 {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    set(x: number, y: number, z: number): this;
  }

  class Euler {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number, order?: string);
    set(x: number, y: number, z: number, order?: string): this;
  }

  class Mesh {
    position: Vector3;
    rotation: Euler;
    constructor(geometry?: any, material?: any);
  }

  class Scene {
    add(object: any): this;
    remove(object: any): this;
    background: any;
  }

  class PerspectiveCamera {
    fov: number;
    aspect: number;
    near: number;
    far: number;
    position: Vector3;
    constructor(fov?: number, aspect?: number, near?: number, far?: number);
    updateProjectionMatrix(): void;
    lookAt(x: number | Vector3, y?: number, z?: number): void;
  }

  class WebGLRenderer {
    domElement: HTMLCanvasElement;
    shadowMap: {
      enabled: boolean;
      type: any;
    };
    constructor(parameters?: any);
    setSize(width: number, height: number): void;
    setPixelRatio(value: number): void;
    render(scene: Scene, camera: PerspectiveCamera): void;
  }

  class Color {
    constructor(color: number | string);
  }

  class Light {
    position: Vector3;
    castShadow: boolean;
  }

  class AmbientLight extends Light {
    constructor(color?: number | string, intensity?: number);
  }

  class DirectionalLight extends Light {
    shadow: {
      mapSize: {
        width: number;
        height: number;
      };
      camera: {
        near: number;
        far: number;
        left: number;
        right: number;
        top: number;
        bottom: number;
      };
    };
    constructor(color?: number | string, intensity?: number);
  }

  class AxesHelper {
    constructor(size?: number);
  }

  class GridHelper {
    constructor(size?: number, divisions?: number);
  }

  class SphereGeometry {
    constructor(radius?: number, widthSegments?: number, heightSegments?: number);
  }

  class MeshBasicMaterial {
    constructor(parameters?: any);
  }

  class PointsMaterial {
    constructor(parameters?: any);
    size: number;
    transparent: boolean;
    opacity: number;
    blending: number;
    sizeAttenuation: boolean;
  }

  class BufferGeometry {
    setAttribute(name: string, attribute: BufferAttribute): BufferGeometry;
  }

  class BufferAttribute {
    constructor(array: ArrayLike<number>, itemSize: number);
    needsUpdate: boolean;
  }

  class Points {
    constructor(geometry?: BufferGeometry, material?: PointsMaterial);
    geometry: BufferGeometry;
    material: PointsMaterial;
  }

  const AdditiveBlending: number;
  const PCFSoftShadowMap: number;
}
