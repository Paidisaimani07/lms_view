import React, { useMemo } from "react";
import { X, ClipboardList, CheckCircle, AlertCircle, HelpCircle, BarChart3 } from "lucide-react";

export default function Result({ courseId, courseName, onClose }) {
  const data = useMemo(() => {
    const interactionKey = `scorm_interactions_${courseId}`;
    const rawData = localStorage.getItem(interactionKey);
    if (!rawData) return null;
    return JSON.parse(rawData);
  }, [courseId]);

  const stats = useMemo(() => {
    if (!data) return null;

    const interactions = [];
    let score = data["cmi.core.score.raw"] || data["cmi.score.raw"] || 0;
    const maxScore = data["cmi.core.score.max"] || data["cmi.score.max"] || 100;
    const status = data["cmi.core.lesson_status"] || data["cmi.success_status"] || "incomplete";

    // Parse interactions
    // Articulate sends interactions as cmi.interactions.0.id, cmi.interactions.0.learner_response, etc.
    const keys = Object.keys(data).filter(k => k.startsWith("cmi.interactions."));
    const interactionIndices = new Set();
    keys.forEach(k => {
      const match = k.match(/cmi\.interactions\.(\d+)\./);
      if (match) interactionIndices.add(match[1]);
    });

    interactionIndices.forEach(index => {
      interactions.push({
        id: data[`cmi.interactions.${index}.id`],
        type: data[`cmi.interactions.${index}.type`],
        response: data[`cmi.interactions.${index}.learner_response`],
        result: data[`cmi.interactions.${index}.result`],
        timestamp: data[`cmi.interactions.${index}.timestamp`]
      });
    });

    return {
      score,
      maxScore,
      status,
      interactions: interactions.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1))
    };
  }, [data]);

  if (!stats) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <div style={headerStyle}>
            <h2 style={titleStyle}><ClipboardList style={{ marginRight: 10 }} /> Result: {courseName}</h2>
            <button onClick={onClose} style={closeBtn}><X size={20} /></button>
          </div>
          <div style={emptyStyle}>
            <HelpCircle size={48} color="#94a3b8" />
            <p>No result data found for this course yet.</p>
            <p style={{ fontSize: "0.8rem", color: "#64748b" }}>Complete some quizzes in the course to see your progress here.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}><ClipboardList style={{ marginRight: 10 }} /> Result: {courseName}</h2>
          <button onClick={onClose} style={closeBtn}><X size={20} /></button>
        </div>

        <div style={contentStyle}>
          {/* Summary Cards */}
          <div style={statsGridStyle}>
            <div style={statCardStyle}>
              <BarChart3 size={20} color="#3b82f6" />
              <div style={statLabelStyle}>Score</div>
              <div style={statValueStyle}>{stats.score} / {stats.maxScore}</div>
            </div>
            <div style={{ ...statCardStyle, borderColor: stats.status === "passed" ? "#10b981" : "#f59e0b" }}>
              {stats.status === "passed" ? <CheckCircle size={20} color="#10b981" /> : <AlertCircle size={20} color="#f59e0b" />}
              <div style={statLabelStyle}>Status</div>
              <div style={{ ...statValueStyle, color: stats.status === "passed" ? "#10b981" : "#f59e0b", textTransform: "capitalize" }}>{stats.status}</div>
            </div>
          </div>

          <h3 style={sectionTitleStyle}>Interaction Log</h3>
          <div style={logContainerStyle}>
            {stats.interactions.length > 0 ? (
              stats.interactions.map((item, i) => (
                <div key={i} style={logItemStyle}>
                  <div style={logHeaderStyle}>
                    <span style={typeBadgeStyle}>{item.type}</span>
                    <span style={timeStyle}>{item.timestamp}</span>
                  </div>
                  <div style={questionIdStyle}>Question ID: {item.id}</div>
                  <div style={responseRowStyle}>
                    <div style={responseLabelStyle}>User Response:</div>
                    <div style={responseValueStyle}>{item.response || "(empty)"}</div>
                  </div>
                  <div style={resultRowStyle}>
                    <div style={responseLabelStyle}>Result:</div>
                    <div style={{ 
                      ...responseValueStyle, 
                      color: item.result === "correct" ? "#10b981" : item.result === "wrong" ? "#ef4444" : "#f59e0b",
                      fontWeight: "bold"
                    }}>{item.result || "N/A"}</div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>No individual interactions recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(2, 6, 23, 0.85)",
  backdropFilter: "blur(8px)",
  zIndex: 10000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const modalStyle = {
  background: "#ffffff",
  width: "100%",
  maxWidth: "700px",
  maxHeight: "85vh",
  borderRadius: "20px",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
  overflow: "hidden",
  animation: "modalFadeIn 0.3s ease-out",
};

const headerStyle = {
  padding: "20px 24px",
  borderBottom: "1px solid #e2e8f0",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  background: "#f8fafc",
};

const titleStyle = {
  margin: 0,
  fontSize: "1.25rem",
  fontWeight: "700",
  color: "#1e293b",
  display: "flex",
  alignItems: "center",
};

const closeBtn = {
  border: "none",
  background: "none",
  color: "#64748b",
  cursor: "pointer",
  padding: "8px",
  borderRadius: "8px",
  transition: "all 0.2s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  ":hover": {
    background: "#e2e8f0",
    color: "#0f172a",
  }
};

const contentStyle = {
  padding: "24px",
  overflowY: "auto",
  background: "#fff",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
  marginBottom: "24px",
};

const statCardStyle = {
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
};

const statLabelStyle = {
  fontSize: "0.75rem",
  color: "#64748b",
  fontWeight: "600",
  textTransform: "uppercase",
  marginTop: "8px",
};

const statValueStyle = {
  fontSize: "1.25rem",
  fontWeight: "700",
  color: "#0f172a",
};

const sectionTitleStyle = {
  fontSize: "1rem",
  fontWeight: "700",
  color: "#1e293b",
  marginBottom: "12px",
  borderBottom: "2px solid #3b82f6",
  paddingBottom: "4px",
  display: "inline-block",
};

const logContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const logItemStyle = {
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  background: "#fff",
  transition: "transform 0.2s",
};

const logHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "8px",
};

const typeBadgeStyle = {
  fontSize: "0.65rem",
  fontWeight: "700",
  textTransform: "uppercase",
  padding: "2px 8px",
  background: "#e0f2fe",
  color: "#0369a1",
  borderRadius: "100px",
};

const timeStyle = {
  fontSize: "0.7rem",
  color: "#94a3b8",
};

const questionIdStyle = {
  fontSize: "0.85rem",
  fontWeight: "600",
  color: "#334155",
  marginBottom: "12px",
};

const responseRowStyle = {
  display: "flex",
  gap: "8px",
  fontSize: "0.85rem",
  marginBottom: "4px",
};

const resultRowStyle = {
  display: "flex",
  gap: "8px",
  fontSize: "0.85rem",
};

const responseLabelStyle = {
  color: "#64748b",
  minWidth: "100px",
};

const responseValueStyle = {
  color: "#1e293b",
  fontWeight: "500",
  flex: 1,
};

const emptyStyle = {
  padding: "60px 40px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  gap: "12px",
};
