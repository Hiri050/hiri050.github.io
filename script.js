// Tiny JS: theme toggle + footer year
(function () {
  const root = document.documentElement;
  const btn = document.getElementById("themeToggle");
  const year = document.getElementById("year");

  year.textContent = new Date().getFullYear();

  const saved = localStorage.getItem("theme");
  if (saved === "light") root.classList.add("light");

  function setIcon() {
    const isLight = root.classList.contains("light");
    btn.textContent = isLight ? "🌙" : "☀️";
  }
  setIcon();

  btn.addEventListener("click", () => {
    root.classList.toggle("light");
    localStorage.setItem("theme", root.classList.contains("light") ? "light" : "dark");
    setIcon();
  });
})();
