// 카카오맵 JS SDK 최소 타입 — 사용하는 표면만 선언한다(전량 any 금지, 전량 선언도 과함)
declare namespace kakao.maps {
  function load(callback: () => void): void;

  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }

  class LatLngBounds {
    getSouthWest(): LatLng;
    getNorthEast(): LatLng;
  }

  interface MapOptions {
    center: LatLng;
    level?: number;
    draggable?: boolean;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    getCenter(): LatLng;
    getBounds(): LatLngBounds;
    setDraggable(draggable: boolean): void;
    setZoomable(zoomable: boolean): void;
    relayout(): void;
  }

  class MarkerImage {
    constructor(
      src: string,
      size: Size,
      options?: { offset?: Point; alt?: string },
    );
  }

  interface MarkerOptions {
    position: LatLng;
    image?: MarkerImage;
    title?: string;
    zIndex?: number;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    setImage(image: MarkerImage): void;
    setZIndex(zIndex: number): void;
  }

  class MarkerClusterer {
    constructor(options: {
      map: Map;
      averageCenter?: boolean;
      minLevel?: number;
      disableClickZoom?: boolean;
    });
    addMarkers(markers: Marker[]): void;
    clear(): void;
  }

  namespace event {
    function addListener(
      target: Map | Marker,
      type: string,
      handler: () => void,
    ): void;
    function removeListener(
      target: Map | Marker,
      type: string,
      handler: () => void,
    ): void;
  }
}

interface Window {
  kakao: typeof kakao;
}
