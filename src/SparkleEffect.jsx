import { useEffect } from "react";

export default function SparkleEffect() {
  useEffect(() => {
    const colors = [
      "#FFD700", "#FF69B4", "#00FFFF",
      "#FF4500", "#ADFF2F", "#1E90FF",
      "#FF00FF", "#FFFFFF"
    ];

    const createSparkle = (x, y) => {
      const sparkle = document.createElement("div");

      const size = Math.random() * 6 + 2; // 2px to 8px
      const color = colors[Math.floor(Math.random() * colors.length)];

      sparkle.className = "sparkle";
      sparkle.style.width = size + "px";
      sparkle.style.height = size + "px";
      sparkle.style.left = x + "px";
      sparkle.style.top = y + "px";

      sparkle.style.background = color;
      sparkle.style.boxShadow = `0 0 8px ${color}, 0 0 15px ${color}`;

      // random movement direction
      const moveX = (Math.random() - 0.5) * 50;
      const moveY = (Math.random() - 0.5) * 50;

      sparkle.style.setProperty("--x", moveX + "px");
      sparkle.style.setProperty("--y", moveY + "px");

      document.body.appendChild(sparkle);

      setTimeout(() => {
        sparkle.remove();
      }, 800);
    };

    const handleMouseMove = (e) => {
      // create multiple sparkles per move
      for (let i = 0; i < 6; i++) {
        createSparkle(e.clientX, e.clientY);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return null;
}