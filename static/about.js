// about.js

function openAbout() {
  document.getElementById("about-overlay").classList.add("active");
}

function closeAbout() {
  document.getElementById("about-overlay").classList.remove("active");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("about-overlay").addEventListener("click", function(e) {
    if (e.target.id === "about-overlay") closeAbout();
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAbout();
});