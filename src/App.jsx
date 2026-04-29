import React, { useState, useMemo, useEffect, useCallback } from "react";
import "./App.css";
import SparkleEffect from "./SparkleEffect";
import WorkingScormPlayer from "./components/WorkingScormPlayer";
import Result from "./components/Result";
import { Search, CheckCircle, RotateCcw, ClipboardList, Play } from "lucide-react";

import pythonImg from "./assets/python.webp";
import javaImg from "./assets/java.gif";
import sqlImg from "./assets/sql.gif";
import reactImg from "./assets/react.gif";
import springbootImg from "./assets/springboot.gif";
import htmlImg from "./assets/html.gif";

const coursesData = [
  {
    id: 1,
    name: "Python",
    img: pythonImg,
    url: "/goals_trigger_1/story.html" // Local modified course
  },
  { id: 2, name: "HTML", img: htmlImg, url: "/csspart2_topic4/index_lms.html" },
  { id: 3, name: "Java", img: javaImg },
  { id: 4, name: "SQL", img: sqlImg },
  { id: 5, name: "Spring Boot", img: springbootImg },
  { id: 6, name: "React", img: reactImg }
];

export default function App() {
  const [search, setSearch] = useState("");
  const [progressMap, setProgressMap] = useState({});
  const [scormPlayerOpen, setScormPlayerOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const filteredCourses = useMemo(() => {
    return coursesData.filter((course) =>
      course.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  // Load progress
  useEffect(() => {
    const stored = localStorage.getItem("lms_progress");
    if (stored) setProgressMap(JSON.parse(stored));
  }, []);

  // Save progress
  const saveProgress = useCallback((courseId, progress) => {
    setProgressMap((prev) => {
      if (prev[courseId]?.progress === progress.progress && prev[courseId]?.lastSlide === progress.lastSlide) return prev;
      const updated = { ...prev, [courseId]: progress };
      localStorage.setItem("lms_progress", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Reset progress
  const resetProgress = useCallback((courseId) => {
    setProgressMap((prev) => {
      const updated = { ...prev };
      delete updated[courseId];
      localStorage.setItem("lms_progress", JSON.stringify(updated));
      return updated;
    });
    
    // Clear SCORM specific storage
    localStorage.removeItem(`scorm_interactions_${courseId}`);
    localStorage.removeItem(`articulate_course_${courseId}_progress`);
  }, []);

  const handleCourseClick = useCallback((course) => {
    console.log(`🚀 Clicked Course: ${course.name} (ID: ${course.id})`);
    if (course.url) {
      const progressData = progressMap[course.id];
      let finalUrl = course.url;
      
      // Ensure we append lastSlide for resume functionality
      if (progressData && typeof progressData === 'object' && progressData.lastSlide) {
        const separator = finalUrl.includes('?') ? '&' : '?';
        finalUrl += `${separator}lastSlide=${progressData.lastSlide}`;
        console.log(`🎯 Resuming at slide: ${progressData.lastSlide}`);
      }
      
      // Use a timestamp to force React to see this as a "new" course selection
      // if the same course is clicked again after closing.
      setSelectedCourse({ ...course, url: finalUrl, _ts: Date.now() });
      setScormPlayerOpen(true);
    } else {
      console.warn(`⚠️ Course ${course.name} has no URL configured.`);
    }
  }, [progressMap]);

  const handleClose = useCallback(() => {
    console.log("🔒 Closing Player");
    setScormPlayerOpen(false);
    setResultOpen(false);
    setSelectedCourse(null);
  }, []);

  const handleResultClick = useCallback((e, course) => {
    e.stopPropagation();
    setSelectedCourse(course);
    setResultOpen(true);
  }, []);

  return (
    <>
      <SparkleEffect />

      <div className="container">
        <div className="main">
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
            {filteredCourses.map((course) => {
              const progressData = progressMap[course.id];
              const progress = (typeof progressData === 'object' ? progressData.progress : progressData) || 0;

              return (
                <div
                  key={course.id}
                  className="card"
                  onClick={() => handleCourseClick(course)}
                >
                  <img
                    src={course.img}
                    alt={course.name}
                    className="card-img"
                  />

                  <div className="card-content">
                    <div className="card-title">
                      {course.name} Course
                    </div>

                    {/* Progress */}
                    <div className="progress-section">
                      <div className="progress-info">
                        <span className="progress-text">
                          {progress}%
                        </span>

                        {progress === 100 && (
                          <CheckCircle
                            size={16}
                            className="completed-icon"
                            color="#10b981"
                          />
                        )}
                      </div>

                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="button-group" style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                        <button
                          className="continue-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCourseClick(course);
                          }}
                        >
                          <Play size={14} fill="currentColor" /> Continue
                        </button>

                        <button
                          className="reset-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            resetProgress(course.id);
                          }}
                        >
                          <RotateCcw size={14} /> Reset
                        </button>

                        <button
                          className="result-btn"
                          onClick={(e) => handleResultClick(e, course)}
                        >
                          <ClipboardList size={14} /> Result
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCourses.length === 0 && (
            <div className="empty">🚀 No results found</div>
          )}
        </div>
      </div>

      {/* SCORM Player */}
      {scormPlayerOpen && selectedCourse && (
        <WorkingScormPlayer
          courseId={selectedCourse.id}
          courseName={selectedCourse.name}
          url={selectedCourse.url}
          onProgressUpdate={saveProgress}
          onClose={handleClose}
        />
      )}


      {/* Result View */}
      {resultOpen && selectedCourse && (
        <Result
          courseId={selectedCourse.id}
          courseName={selectedCourse.name}
          onClose={handleClose}
        />
      )}
    </>
  );
}