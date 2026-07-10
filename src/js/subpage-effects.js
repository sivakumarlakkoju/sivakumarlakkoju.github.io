document.addEventListener("DOMContentLoaded", function () {
  var canvas = document.getElementById("ambient-canvas");
  if (!canvas) return;

  createAmbientNetwork(canvas, document.body, {
    fullPage: true,
    magnetic: true,
    magneticTargets: Array.prototype.slice.call(document.querySelectorAll(".nav-link"))
  });
});
