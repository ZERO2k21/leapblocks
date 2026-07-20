import React from "react";

export default function CategoryButton({ category, isActive, onClick }) {
    if (!category) return null;
    return (
        <button
            onClick={onClick}
            title={category.name}
            style={{
                width: "54px",
                height: "54px",
                borderRadius: "50%",
                background: isActive ? category.color : "white",
                border: isActive ? "2px solid rgba(0,0,0,0.15)" : `2px solid ${category.color}`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isActive ? "white" : category.color,
                transition: "all 0.15s ease",
                outline: "none",
                padding: 0,
                flexShrink: 0,
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
        >
            <div style={{ transform: isActive ? "scale(1.2)" : "scale(1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {category.icon}
            </div>
        </button>
    );
}
