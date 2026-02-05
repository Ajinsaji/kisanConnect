/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        forum: ["Forum", "serif"],
      },  
      colors: {
        primary: "#1faa59",     // main green
        primaryDark: "#148746",
        light: "#dcfce7",       // green-100
        secondary: "#ffffff",  // white
      },
    },
  },
  plugins: [],
};
