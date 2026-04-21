import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import "./App.css";
import SparkleEffect from "./SparkleEffect";

import pythonImg from "./assets/python.webp";
import javaImg from "./assets/java.gif";
import sqlImg from "./assets/sql.gif";
import reactImg from "./assets/react.gif";
import springbootImg from "./assets/springboot.gif";
import htmlImg from "./assets/html.gif";

const coursesData = [
  { id: 1, name: "Python", img: pythonImg },
  { id: 2, name: "HTML", img: htmlImg },
  { id: 3, name: "Java", img: javaImg },
  { id: 4, name: "SQL", img: sqlImg },
  { id: 5, name: "Spring Boot", img: springbootImg },
  { id: 6, name: "React", img: reactImg },
];

export default function App() {
  const [search, setSearch] = useState("");

  const filteredCourses = useMemo(() => {
    return coursesData.filter((course) =>
      course.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  // 🔥 3D effect
 const handleMouseMove = (e) => {
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  // 🔥 stronger tilt
  const rotateX = -(y - centerY) / 10;
  const rotateY = (x - centerX) / 10;

  card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
};

const handleMouseLeave = (e) => {
  const card = e.currentTarget;

  // 🔥 smooth reset
  card.style.transition = "transform 0.4s ease";
  card.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
};
  return (
    <>
      <SparkleEffect />

      <div className="container">
        <div className="main">

          {/* Title */}
          <h1 className="section-title">Tech Courses</h1>

          {/* Search */}
          <div className="search-container">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Grid */}
          <div className="grid">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="card"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                {/* Image */}
                <img src={course.img} alt={course.name} className="card-img" />

                {/* Content */}
                <div className="card-content">
                  <div className="card-title">{course.name} Course</div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty */}
          {filteredCourses.length === 0 && (
            <div className="empty">🚀 No results found</div>
          )}

        </div>
      </div>
    </>
  );
}