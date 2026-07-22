import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // 스토어 등록 식별자. 게시 후에는 변경할 수 없다.
  appId: "com.byeolbyeolpet.app",
  appName: "별별펫",

  // next build(output: "export") 산출물. 이 폴더가 통째로 앱에 담긴다.
  // next.config.ts 의 trailingSlash: true 덕에 /map -> /map/index.html 매칭이 안정적이다.
  webDir: "out",
};

export default config;
