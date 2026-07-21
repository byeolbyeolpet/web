/** @type {import("prettier").Config} */
const config = {
  // Tailwind v4는 config JS가 없으므로 클래스 정렬 기준을 CSS 진입점으로 지정한다.
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./src/app/globals.css",
};

export default config;
