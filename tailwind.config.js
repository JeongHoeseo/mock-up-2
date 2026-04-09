/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 포인트 컬러 (고정)
        'brand-purple': '#7C3AED',
        'brand-purple-light': '#A78BFA',
        // 테마별 배경색은 App.js의 인라인 클래스로 제어합니다.
      },
    },
  },
  plugins: [],
}