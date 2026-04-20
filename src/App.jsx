import React, { useState, useMemo } from "react";
import { Search, Home, BookOpen, TrendingUp, User } from "lucide-react";
import "./App.css";
import SparkleEffect from "./SparkleEffect";

import pythonImg from "./assets/python.webp";
import javaImg from "./assets/java.gif";
import sqlImg from "./assets/sql.gif";
import reactImg from "./assets/react.gif";
import springbootImg from "./assets/springboot.gif";
import htmlImg from "./assets/html.gif";

const coursesData = [
  { id: 1, name: "Python", class: "python", img: pythonImg },
  { id: 2, name: "HTML", class: "html", img: htmlImg },
  { id: 3, name: "Java", class: "java", img: javaImg },
  { id: 4, name: "SQL", class: "sql", img: sqlImg },
  { id: 5, name: "Spring Boot", class: "spring",img:springbootImg },
  { id: 6, name: "React", class: "react", img: reactImg },
];

export default function App() {
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(null);

  const filteredCourses = useMemo(() => {
    return coursesData.filter((course) =>
      course.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  // 🔥 3D EFFECT
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -(y - centerY) / 12;
    const rotateY = (x - centerX) / 12;

    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
  };

  return (
    <>
      <SparkleEffect />

      <div className="container">

        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-item"><Home /> Home</div>
          <div className="sidebar-item"><BookOpen /> Courses</div>
          <div className="sidebar-item"><TrendingUp /> Trending</div>
          <div className="sidebar-item"><User /> Profile</div>
        </div>

        {/* Main */}
        <div className="main">

          {/* Search */}
          <div className="search-container">
            <div className="search-box">
              <Search className="search-icon" />
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
                className={`card ${course.class}`}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={() => setFocused(course.id)}
              >
                {course.img && (
                  <img src={course.img} alt={course.name} className="card-img" />
                )}

                <h2 className="card-title">{course.name}</h2>

                <div className={`overlay ${focused === course.id ? "active" : ""}`}>
                  ▶ Explore {course.name}
                </div>
              </div>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="empty">🚀 No results found</div>
          )}

        </div>
      </div>
    </>
  );
}