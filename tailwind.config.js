export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: { colors: { background: "hsl(0 0% 100%)", foreground: "hsl(222.2 47.4% 11.2%)", muted: "hsl(215 20.2% 65.1%)", card: "hsl(210 40% 98%)", }, boxShadow: { smooth: "0 14px 36px rgba(2,6,23,0.10)" }, borderRadius: { xl: "1rem", "2xl": "1.25rem" } } }, plugins: [], }