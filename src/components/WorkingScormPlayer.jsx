import React, { useState, useEffect, useCallback } from "react";
import { X, Trophy, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";

const WorkingScormPlayer = ({ courseId, courseName, url, onClose, onProgressUpdate }) => {
  const [progress, setProgress] = useState(0);
  const [visitedCount, setVisitedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Use refs to avoid dependency loops in SCORM API effects
  const visitedRef = React.useRef(0);
  const totalRef = React.useRef(0);
  const onProgressUpdateRef = React.useRef(onProgressUpdate);

  useEffect(() => {
    onProgressUpdateRef.current = onProgressUpdate;
  }, [onProgressUpdate]);

  // Stable progress update function
  const updateProgressState = useCallback((visited, total) => {
    if (total > 0) {
      const p = Math.min(Math.round((visited / total) * 100), 100);
      
      // Update refs immediately
      visitedRef.current = visited;
      totalRef.current = total;

      // Update state for UI
      setProgress(p);
      setVisitedCount(visited);
      setTotalCount(total);
      setLastUpdate(Date.now());

      if (onProgressUpdateRef.current) {
        onProgressUpdateRef.current(courseId, { progress: p, lastSlide: visited });
      }
      return p;
    }
    return 0;
  }, [courseId]);

  // 1. STABLE SCORM API Bridge Implementation
  useEffect(() => {
    const interactionKey = `scorm_interactions_${courseId}`;
    console.log("🛠️ Initializing Stable SCORM API for course:", courseId);

    // Populate initial state from storage
    const currentInteractions = JSON.parse(localStorage.getItem(interactionKey) || "{}");
    if (!currentInteractions["cmi.core.lesson_location"]) {
      const globalData = localStorage.getItem("lms_progress");
      if (globalData) {
        try {
          const progressMap = JSON.parse(globalData);
          const courseData = progressMap[courseId];
          if (courseData?.lastSlide) {
            currentInteractions["cmi.core.lesson_location"] = String(courseData.lastSlide);
            localStorage.setItem(interactionKey, JSON.stringify(currentInteractions));
            console.log("♻️ Pre-populated location:", courseData.lastSlide);
          }
        } catch (e) {}
      }
    }

    const handleScormData = (key, value) => {
      console.log(`📊 API SET: ${key} = ${value}`);
      const interactions = JSON.parse(localStorage.getItem(interactionKey) || "{}");
      interactions[key] = value;
      localStorage.setItem(interactionKey, JSON.stringify(interactions));

      if (key === "cmi.core.lesson_location" || key === "cmi.location") {
        const current = parseInt(value);
        if (!isNaN(current)) {
          updateProgressState(current, totalRef.current || 24);
        }
      }
    };

    window.API = {
      LMSInitialize: () => { console.log("SCORM: LMSInitialize"); return "true"; },
      LMSFinish: () => "true",
      LMSGetValue: (key) => {
        const interactions = JSON.parse(localStorage.getItem(interactionKey) || "{}");
        if (key === "cmi.core.student_name") return "Learner";
        if (key === "cmi.core.student_id") return "L001";
        if (key === "cmi.core.lesson_mode") return "normal";
        if (key === "cmi.core.credit") return "credit";
        if (key === "cmi.core.entry") return interactions["cmi.core.lesson_location"] ? "resume" : "ab-initio";
        if (key === "cmi.core.lesson_status") return interactions["cmi.core.lesson_status"] || "incomplete";
        
        const val = interactions[key] || "";
        console.log(`📊 API GET: ${key} = ${val}`);
        return val;
      },
      LMSSetValue: (key, value) => { handleScormData(key, value); return "true"; },
      LMSGetLastError: () => "0",
      LMSGetErrorString: () => "No error",
      LMSGetDiagnostic: () => "All good",
      LMSCommit: () => "true"
    };

    window.API_1484_11 = {
      Initialize: () => "true",
      Terminate: () => "true",
      GetValue: (key) => {
        const interactions = JSON.parse(localStorage.getItem(interactionKey) || "{}");
        if (key === "cmi.learner_name") return "Learner";
        if (key === "cmi.mode") return "normal";
        if (key === "cmi.credit") return "credit";
        return interactions[key] || "";
      },
      SetValue: (key, value) => { handleScormData(key, value); return "true"; },
      Commit: () => "true",
      GetLastError: () => "0",
      GetErrorString: () => "No error",
      GetDiagnostic: () => "No diagnostic"
    };

    return () => {
      console.log("🧹 Cleaning up SCORM API");
      delete window.API;
      delete window.API_1484_11;
    }; 
  }, [courseId, updateProgressState]); // totalCount removed from dependencies!

  // 2. Main Progress Logic & Message Listener
  useEffect(() => {
    const loadInitialProgress = () => {
      const globalData = localStorage.getItem("lms_progress");
      if (globalData) {
        try {
          const progressMap = JSON.parse(globalData);
          if (progressMap[courseId]) {
            const pData = progressMap[courseId];
            const p = typeof pData === 'object' ? pData.progress : pData;
            const ls = typeof pData === 'object' ? pData.lastSlide : 0;
            setProgress(p || 0);
            if (ls) {
              setVisitedCount(ls);
              visitedRef.current = ls;
            }
          }
        } catch (e) {}
      }
    };

    const handleMessage = (event) => {
      const data = event.data;
      if (!data) return;

      if (data.type === "SCORM_PROGRESS") {
        // If we get progress, the content is definitely loaded
        setIsLoaded(true);
        
        const current = data.current || 0;
        const total = data.total || 100;
        updateProgressState(current, total);
        
        const interactionKey = `scorm_interactions_${courseId}`;
        const interactions = JSON.parse(localStorage.getItem(interactionKey) || "{}");
        interactions["cmi.core.lesson_location"] = String(current);
        interactions["cmi.location"] = String(current);
        localStorage.setItem(interactionKey, JSON.stringify(interactions));
      }
      else if (data.type === "progress" && typeof data.value === 'number') {
        setIsLoaded(true);
        updateProgressState(Math.round(data.value), totalRef.current || 100);
      }
    };

    window.addEventListener("message", handleMessage);
    loadInitialProgress();
    
    return () => window.removeEventListener("message", handleMessage);
  }, [courseId, updateProgressState]); 

  useEffect(() => {
    // Increased timeout for heavier courses
    const timer = setTimeout(() => setIsLoaded(true), 12000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={overlayStyle}>
      <div style={headerStyle}>
        <div style={infoStyle}>
          <div style={titleRowStyle}>
            {progress === 100 ? (
              <div style={successBadgeStyle}><Trophy size={16} /><span>Completed!</span></div>
            ) : (
              <div style={learningBadgeStyle}><BookOpen size={16} /><span>{courseName || "Course"} Skills</span></div>
            )}
            <h3 style={titleStyle}>{progress}% Complete</h3>
          </div>
          <span style={countStyle}>
            <CheckCircle2 size={12} style={{ marginRight: 4 }} />
            {visitedCount} / {totalCount || 24} slides
          </span>
        </div>
        
        <div style={progressContainerOuterStyle}>
          <div style={progressContainerStyle}>
            <div style={{ ...progressFillStyle, width: `${progress}%` }}>
              {progress > 5 && <div style={progressShineStyle} />}
            </div>
          </div>
          <div style={subTextStyle}>Progress tracks automatically as you view slides</div>
        </div>

        <button onClick={onClose} style={closeBtn}>
          <X size={18} />
          <span>Exit Course</span>
        </button>
      </div>

      <div style={iframeContainer}>
        <div style={iframeWrapperStyle}>
          <iframe
            src={url}
            width="100%"
            height="100%"
            title="SCORM content"
            onLoad={() => { console.log("✅ Main Iframe Loaded"); setIsLoaded(true); }}
            style={{ border: "none", background: "#fff", opacity: isLoaded ? 1 : 0, transition: 'opacity 0.6s' }}
          />
          {!isLoaded && <div style={loaderOverlayStyle}><div className="spinner" /></div>}
        </div>
      </div>
      
      <div style={{ ...debugBarStyle, opacity: (Date.now() - lastUpdate < 3000) ? 1 : 0 }}>
        <AlertCircle size={10} />
        <span>SCORM SYNC: Slide {visitedCount} detected</span>
      </div>
    </div>
  );
};



// --- STYLES ---

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "#020617", 
  zIndex: 9999,
  display: "flex",
  flexDirection: "column",
};

const headerStyle = {
  padding: "12px 32px",
  background: "rgba(15, 23, 42, 0.8)",
  backdropFilter: "blur(20px)",
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "40px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
};

const titleRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "4px"
};

const successBadgeStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "4px 10px",
  background: "rgba(16, 185, 129, 0.15)",
  color: "#10b981",
  borderRadius: "100px",
  fontSize: "0.75rem",
  fontWeight: "600",
  border: "1px solid rgba(16, 185, 129, 0.2)"
};

const learningBadgeStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "4px 10px",
  background: "rgba(59, 130, 246, 0.15)",
  color: "#3b82f6",
  borderRadius: "100px",
  fontSize: "0.75rem",
  fontWeight: "600",
  border: "1px solid rgba(59, 130, 246, 0.2)"
};

const infoStyle = {
  display: "flex",
  flexDirection: "column",
  minWidth: "250px"
};

const titleStyle = {
  margin: 0,
  color: "#f8fafc",
  fontSize: "1.1rem",
  fontWeight: "700",
  letterSpacing: "-0.02em"
};

const countStyle = {
  color: "#94a3b8",
  fontSize: "0.8rem",
  fontWeight: "500",
  display: "flex",
  alignItems: "center"
};

const progressContainerOuterStyle = {
  flex: 1,
  maxWidth: "600px"
};

const progressContainerStyle = {
  height: "10px",
  background: "#1e293b",
  borderRadius: "100px",
  overflow: "hidden",
  position: "relative",
  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)"
};

const progressFillStyle = {
  height: "100%",
  background: "linear-gradient(90deg, #3b82f6 0%, #2dd4bf 100%)",
  transition: "width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)", 
  borderRadius: "100px",
  position: "relative"
};

const progressShineStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
  animation: "shine 2s infinite"
};

const subTextStyle = {
  marginTop: "6px",
  fontSize: "0.75rem",
  color: "#64748b",
  textAlign: "center"
};

const iframeContainer = {
  flex: 1,
  padding: "20px 32px 32px 32px",
  display: "flex",
  background: "#020617"
};

const iframeWrapperStyle = {
  width: "100%",
  maxWidth: "1280px",
  height: "100%",
  flex: 1,
  margin: "0 auto",
  background: "#fff",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
  position: "relative"
};

const loaderOverlayStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "#0f172a",
  color: "#fff",
  gap: "20px"
};

const closeBtn = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 20px",
  background: "rgba(239, 68, 68, 0.1)",
  color: "#ef4444",
  border: "1px solid rgba(239, 68, 68, 0.2)",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "0.9rem",
  transition: "all 0.3s ease"
};

const debugBarStyle = {
  position: "fixed",
  bottom: "12px",
  right: "12px",
  background: "rgba(15, 23, 42, 0.9)",
  color: "#3b82f6",
  padding: "6px 12px",
  borderRadius: "6px",
  fontSize: "0.7rem",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  border: "1px solid rgba(59, 130, 246, 0.3)",
  pointerEvents: "none",
  transition: "opacity 0.5s ease",
  zIndex: 10001
};

export default WorkingScormPlayer;