/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useEffect, useId, useRef, useState } from "react";

const MENU_COLOR = "#855CD6";
const TOOLTIP_COLOR = "#222";
const BUTTON_SHADOW = "0 10px 22px rgba(91, 63, 168, 0.28), 0 4px 10px rgba(15, 23, 42, 0.14)";
const CLOSE_DELAY_MS = 1000;

function MainAddIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 40 40" style={{ width: 24, height: 24, fill: "currentColor" }}>
            <path d="M22.8 29.4c-1.4 0-2.9 0-4.3 0-.5 0-.9 0-.9.6s.4.7.9.7c1.6 0 3.2 0 4.7 0 .7 0 .9.3.9.9 0 .5-.1 1 0 1.5.1 1.5-.4 2.2-1.9 2.7-2.9 1-5.9 1-8.9-.1-1.6-.6-2.1-1.5-2.1-3.1v-5.4c0-2.3 1.2-3.5 3.6-3.5 2.2 0 4.5 0 6.7-.1 2.2-.1 3.5-1.4 3.7-3.6.1-.9 0-1.8 0-2.7 0-.5.2-.7.7-.7h.1c3-.1 3.9.5 4.7 3.3.6 2.3.7 4.6-.2 6.9-.4.9-.8 1.6-1.4 2-.5.3-1 .5-2.4.6-1.3.1-2.6.2-4.2.1Zm-.1 3.9c0-.7-.5-1.3-1.3-1.3-.7 0-1.3.5-1.3 1.2 0 .7.6 1.4 1.3 1.4.7.1 1.3-.6 1.3-1.3Z" />
            <path d="M12.4 16.7c1.4 0 2.9 0 4.3 0 .5 0 .9 0 .9-.6s-.4-.7-.9-.7c-1.6 0-3.2 0-4.7 0-.7 0-.9-.3-.9-.9 0-.5.1-1 0-1.5-.1-1.5.4-2.2 1.9-2.7 2.9-1 5.9-1 8.9.1 1.6.6 2.1 1.5 2.1 3.1v5.4c0 2.3-1.2 3.5-3.6 3.5-2.2 0-4.5 0-6.7.1-2.2.1-3.5 1.4-3.7 3.6-.1.9 0 1.8 0 2.7 0 .5-.2.7-.7.7h-.1c-3 .1-3.9-.5-4.7-3.3-.6-2.3-.7-4.6.2-6.9.4-.9.8-1.6 1.4-2 .5-.3 1-.5 2.4-.6 1-.1 2.4-.1 4-.1Zm.1-4c0 .7.5 1.3 1.3 1.3.7 0 1.3-.5 1.3-1.2 0-.7-.6-1.4-1.3-1.4-.7 0-1.3.6-1.3 1.3Z" />
            <path d="M30.5 14.9c-1.3 0-2.2-.9-2.2-2.2V5.5c0-1.1.9-2 2.2-2 1.1 0 2 .9 2 2v7.2c0 1.3-.9 2.2-2 2.2Z" />
            <path d="M24.8 9.2c0-1.1.9-2 2-2H34c1.1 0 2 .9 2 2s-.9 2-2 2h-7.2c-1.1 0-2-.9-2-2Z" />
        </svg>
    );
}

function PythonFileIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 40 40" style={{ width: 18, height: 18, fill: "currentColor" }}>
            <path d="M33.1 31.3c-.2 2.7-2.3 4.7-5 4.7H11.8c-2.8 0-5-2.1-5-5V9c0-2.9 2.2-5 5.1-5h11.7c1.2 0 2.2.4 3 1.3 1.7 1.7 3.4 3.4 5.2 5.2.9.9 1.3 1.9 1.3 3.1v13.4c0 .3 0 .7 0 1ZM24 6.5h-1c-3.6 0-7.2 0-10.9 0-1.9 0-2.9 1-2.9 2.9v21.3c0 1.9 1 2.9 2.9 2.9h15.4c2.1 0 3.1-.9 3.1-3V14c0-.3-.1-.6-.1-1h-2.7c-2.3 0-3.8-1.5-3.9-3.9 0-.9.1-1.7.1-2.6Z" />
            <path d="M20 14.1c1.1 0 2 .9 2 2v2h2c1.1 0 2 .9 2 2s-.9 2-2 2h-2v2c0 1.1-.9 2-2 2s-2-.9-2-2v-2h-2c-1.1 0-2-.9-2-2s.9-2 2-2h2v-2c0-1.1.9-2 2-2Z" />
        </svg>
    );
}

function ImageFileIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 40 40" style={{ width: 18, height: 18, fill: "currentColor" }}>
            <path d="M31.6 27 26.5 22c-.7-.7-2-.7-2.9-.1l-6.3 4.9c-1 .7-2.3.6-3.1-.4l-.6-.7c-.7-.9-2.3-1-3.1-.4l-4.7 3.7v.1c0 1.7 1.4 3 3.3 3h18.3c2.3 0 4.3-1.7 4.3-3.9V27ZM27.3 33.4H9c-2.7 0-4.9-2-4.9-4.6 0-.4.3-1 .6-1.3l4.7-3.7c1.7-1.1 4.1-.9 5.3.7l.6.7c.1.1.6.4 1 .1l6.3-4.9c1.6-1.1 3.7-1 5 .3l5.1 5c.3.3.4.7.4 1.1v1c0 3.2-2.5 5.6-5.8 5.6Z" />
            <path d="M27.9 34.1H9.3c-2.9 0-5.3-2.4-5.3-5.3V14c0-2.9 2.4-5.3 5.3-5.3h14.9c.9 0 1.6.7 1.6 1.6 0 .9-.7 1.6-1.6 1.6H9.3c-1.1 0-2.1 1-2.1 2.1v14.9c0 1.1 1 2.1 2.1 2.1h18.6c1.1 0 2.1-1 2.1-2.1V17.7c0-.9.7-1.6 1.6-1.6s1.6.7 1.6 1.6v11.1c0 2.9-2.4 5.3-5.3 5.3Z" />
            <path d="M31.7 14.7c-1 0-1.7-.7-1.7-1.7V7.4c0-.9.7-1.6 1.7-1.6.9 0 1.6.7 1.6 1.6V13c0 1-.7 1.7-1.6 1.7Z" />
            <path d="M27.3 10.3c0-.9.7-1.6 1.6-1.6h5.6c.9 0 1.6.7 1.6 1.6 0 .9-.7 1.6-1.6 1.6h-5.6c-.9 0-1.6-.8-1.6-1.6Z" />
        </svg>
    );
}

function TextFileIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 40 40" style={{ width: 18, height: 18, fill: "currentColor" }}>
            <path d="M27.9 34.1H9.3c-2.9 0-5.3-2.4-5.3-5.3V14c0-2.9 2.4-5.3 5.3-5.3h14.9c.9 0 1.6.7 1.6 1.6 0 .9-.7 1.6-1.6 1.6H9.3c-1.1 0-2.1 1-2.1 2.1v14.9c0 1.1 1 2.1 2.1 2.1h18.6c1.1 0 2.1-1 2.1-2.1V17.7c0-.9.7-1.6 1.6-1.6.9 0 1.6.7 1.6 1.6v11.1c0 2.9-2.4 5.3-5.3 5.3Z" />
            <path d="M31.7 14.7c-1 0-1.7-.7-1.7-1.7V7.4c0-.9.7-1.6 1.7-1.6.9 0 1.6.7 1.6 1.6V13c0 1-.7 1.7-1.6 1.7Z" />
            <path d="M27.3 10.3c0-.9.7-1.6 1.6-1.6h5.6c.9 0 1.6.7 1.6 1.6 0 .9-.7 1.6-1.6 1.6h-5.6c-.9 0-1.6-.8-1.6-1.6Z" />
            <path d="M17.6 21.5c.9-1.8 1.8-3.6 2.8-5.5.4-.9.1-1.6-.8-1.9-1-.3-1.9 0-2.4.9-1.9 3.6-3.7 7.3-5.5 10.9-.4.9-.1 1.6.8 1.9.9.3 1.9-.1 2.3-1 .9-1.8 1.8-3.6 2.8-5.3Z" />
            <path d="M20.4 21.5c-.9-1.8-1.8-3.6-2.8-5.5-.4-.9-.1-1.6.8-1.9 1-.3 1.9 0 2.4.9 1.9 3.6 3.7 7.3 5.5 10.9.4.9.1 1.6-.8 1.9-.9.3-1.9-.1-2.3-1-.9-1.8-1.8-3.6-2.8-5.3Z" />
            <path d="M18.9 24.5h-3.3c-.9 0-1.4-.6-1.4-1.3 0-.8.6-1.3 1.5-1.3h6.7c.9 0 1.4.5 1.4 1.3 0 .8-.6 1.3-1.4 1.3H18.9Z" />
        </svg>
    );
}

function CsvFileIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 40 40" style={{ width: 18, height: 18, fill: "currentColor" }}>
            <path d="M27.9 34.1H9.3c-2.9 0-5.3-2.4-5.3-5.3V14c0-2.9 2.4-5.3 5.3-5.3h14.9c.9 0 1.6.7 1.6 1.6 0 .9-.7 1.6-1.6 1.6H9.3c-1.1 0-2.1 1-2.1 2.1v14.9c0 1.1 1 2.1 2.1 2.1h18.6c1.1 0 2.1-1 2.1-2.1V17.7c0-.9.7-1.6 1.6-1.6.9 0 1.6.7 1.6 1.6v11.1c0 2.9-2.4 5.3-5.3 5.3Z" />
            <path d="M31.7 14.7c-1 0-1.7-.7-1.7-1.7V7.4c0-.9.7-1.6 1.7-1.6.9 0 1.6.7 1.6 1.6V13c0 1-.7 1.7-1.6 1.7Z" />
            <path d="M27.3 10.3c0-.9.7-1.6 1.6-1.6h5.6c.9 0 1.6.7 1.6 1.6 0 .9-.7 1.6-1.6 1.6h-5.6c-.9 0-1.6-.8-1.6-1.6Z" />
            <path d="M14.5 18.7c.7-1.3 1.3-2.6 2-3.9.3-.6.1-1.2-.6-1.4-.7-.2-1.4 0-1.7.7-1.3 2.6-2.7 5.2-4 7.9-.3.6-.1 1.2.6 1.4.7.2 1.3-.1 1.7-.7.7-1.4 1.3-2.7 2-4Z" />
            <path d="M16.5 18.7c-.7-1.3-1.3-2.6-2-3.9-.3-.6-.1-1.2.6-1.4.7-.2 1.4 0 1.7.7 1.3 2.6 2.7 5.2 4 7.9.3.6.1 1.2-.6 1.4-.7.2-1.3-.1-1.7-.7-.6-1.4-1.3-2.7-2-4Z" />
            <path d="M15.4 20.8H13c-.6 0-1-.4-1-.9 0-.6.4-.9 1-.9h4.8c.6 0 1 .4 1 .9 0 .6-.4.9-1 .9h-2.4Z" />
            <path d="M17.1 25.6h3.2c.3 0 .6.3.6.6v2.5c0 .3-.3.6-.6.6h-3.2c-.3 0-.6-.3-.6-.6v-2.5c0-.4.2-.6.6-.6Z" />
            <path d="M10.8 25.6H14c.3 0 .6.3.6.6v2.5c0 .3-.3.6-.6.6h-3.2c-.3 0-.6-.3-.6-.6v-2.5c0-.4.3-.6.6-.6Z" />
            <path d="M23.4 19.6h3.2c.3 0 .6.3.6.6v2.5c0 .3-.3.6-.6.6h-3.2c-.3 0-.6-.3-.6-.6v-2.5c0-.3.3-.6.6-.6Z" />
            <path d="M23.4 13.6h3.2c.3 0 .6.3.6.6v2.5c0 .3-.3.6-.6.6h-3.2c-.3 0-.6-.3-.6-.6v-2.5c0-.3.3-.6.6-.6Z" />
            <path d="M23.4 25.6h3.2c.3 0 .6.3.6.6v2.5c0 .3-.3.6-.6.6h-3.2c-.3 0-.6-.3-.6-.6v-2.5c0-.4.3-.6.6-.6Z" />
        </svg>
    );
}

function SessionActionIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 40 40" style={{ width: 24, height: 24, fill: "currentColor" }}>
            <path d="M11 10.2c0-1.2 1-2.2 2.2-2.2h4.1c1.2 0 2.2 1 2.2 2.2v4.1c0 1.2-1 2.2-2.2 2.2h-4.1c-1.2 0-2.2-1-2.2-2.2v-4.1Zm0 15.5c0-1.2 1-2.2 2.2-2.2h4.1c1.2 0 2.2 1 2.2 2.2v4.1c0 1.2-1 2.2-2.2 2.2h-4.1c-1.2 0-2.2-1-2.2-2.2v-4.1Zm9.6-11.7c0-1.1.9-2 2-2h6.4c1.1 0 2 .9 2 2s-.9 2-2 2h-6.4c-1.1 0-2-.9-2-2Zm0 11.7c0-1.1.9-2 2-2h6.4c1.1 0 2 .9 2 2s-.9 2-2 2h-6.4c-1.1 0-2-.9-2-2Z" />
        </svg>
    );
}

function PipPackageIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 40 40" style={{ width: 18, height: 18, fill: "currentColor" }}>
            <path d="M28.3 35.2H11.7c-3 0-5.4-2.4-5.4-5.4V14.7c0-2.1 1.2-3.9 3.1-4.8l8.3-3.7c1.5-.7 3.2-.7 4.7 0l8.3 3.7c1.9.9 3.1 2.7 3.1 4.8v15.1c0 3-2.5 5.4-5.5 5.4Zm-8.3-26c-.4 0-.7.1-1 .2l-8.3 3.7c-.7.3-1.1 1-1.1 1.7v15.1c0 1.2.9 2.1 2.1 2.1h16.6c1.2 0 2.1-.9 2.1-2.1V14.7c0-.7-.4-1.4-1.1-1.7L21 9.4c-.3-.1-.6-.2-1-.2Z" />
            <path d="M20 28.5c-1 0-1.7-.7-1.7-1.7v-8.2c0-1 .7-1.7 1.7-1.7.9 0 1.6.7 1.6 1.7v8.2c0 1-.7 1.7-1.6 1.7Z" />
            <path d="M15.5 22.9c0-.9.7-1.6 1.6-1.6h5.8c.9 0 1.6.7 1.6 1.6 0 1-.7 1.7-1.6 1.7h-5.8c-.9 0-1.6-.7-1.6-1.7Z" />
        </svg>
    );
}

function ExtensionIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 40 40" style={{ width: 18, height: 18, fill: "currentColor" }}>
            <path d="M24.8 35h-9.6c-2.3 0-4.2-1.9-4.2-4.2v-4.3c0-.8.6-1.4 1.4-1.4h2c1.3 0 2.3-1 2.3-2.3s-1-2.3-2.3-2.3h-2c-.8 0-1.4-.6-1.4-1.4v-4c0-2.3 1.9-4.2 4.2-4.2h4.5c.8 0 1.4.6 1.4 1.4v2c0 1.3 1 2.3 2.3 2.3s2.3-1 2.3-2.3v-2c0-.8.6-1.4 1.4-1.4h4c2.3 0 4.2 1.9 4.2 4.2v9.6c0 2.3-1.9 4.2-4.2 4.2h-4.3c-.8 0-1.4-.6-1.4-1.4v-2c0-1.3-1-2.3-2.3-2.3s-2.3 1-2.3 2.3v2c0 .8-.6 1.4-1.4 1.4Zm-10.6-7.1v2.9c0 .5.4.9.9.9H23v-.8c0-3.1 2.5-5.6 5.6-5.6s5.6 2.5 5.6 5.6v.8h.9c.5 0 .9-.4.9-.9v-9.6c0-.5-.4-.9-.9-.9h-2.6v.6c0 3.1-2.5 5.6-5.6 5.6s-5.6-2.5-5.6-5.6v-.6h-3.1c-.5 0-.9.4-.9.9v2.6h.6c3.1 0 5.6 2.5 5.6 5.6s-2.5 5.6-5.6 5.6h-.6Z" />
        </svg>
    );
}

function Tooltip({ label, visible, placement = "right", style }) {
    if (!visible) {
        return null;
    }

    const isLeft = placement === "left";

    return (
        <div
            style={{
                position: "absolute",
                [isLeft ? "right" : "left"]: "calc(100% + 10px)",
                top: "50%",
                transform: "translateY(-50%)",
                background: TOOLTIP_COLOR,
                color: "#fff",
                borderRadius: 6,
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 600,
                whiteSpace: "nowrap",
                boxShadow: "0 8px 18px rgba(0,0,0,0.22)",
                pointerEvents: "none",
                zIndex: 20,
                ...style,
            }}
        >
            <span
                style={{
                    position: "absolute",
                    top: "50%",
                    width: 0,
                    height: 0,
                    marginTop: -5,
                    ...(isLeft
                        ? {
                              right: -6,
                              borderTop: "5px solid transparent",
                              borderBottom: "5px solid transparent",
                              borderLeft: `6px solid ${TOOLTIP_COLOR}`,
                          }
                        : {
                              left: -6,
                              borderTop: "5px solid transparent",
                              borderBottom: "5px solid transparent",
                              borderRight: `6px solid ${TOOLTIP_COLOR}`,
                          }),
                }}
            />
            {label}
        </div>
    );
}

function FloatingActionMenu({
    mainLabel,
    mainIcon,
    actions,
    positionStyle,
    tooltipPlacement = "right",
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);
    const rootRef = useRef(null);
    const closeTimerRef = useRef(null);
    const menuId = useId();

    const clearCloseTimer = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };

    const closeMenu = () => {
        clearCloseTimer();
        setIsOpen(false);
        setHoveredItem(null);
    };

    const scheduleClose = (delay = CLOSE_DELAY_MS) => {
        clearCloseTimer();
        closeTimerRef.current = window.setTimeout(() => {
            setIsOpen(false);
            setHoveredItem(null);
        }, delay);
    };

    useEffect(() => () => clearCloseTimer(), []);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const handlePointerDown = (event) => {
            if (!rootRef.current?.contains(event.target)) {
                scheduleClose();
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("touchstart", handlePointerDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("touchstart", handlePointerDown);
        };
    }, [isOpen]);

    return (
        <div
            ref={rootRef}
            style={{
                    position: "absolute",
                    ...positionStyle,
                    zIndex: 40,
                }}
            onMouseEnter={clearCloseTimer}
            onMouseLeave={() => {
                if (isOpen) {
                    scheduleClose();
                }
            }}
            onFocusCapture={clearCloseTimer}
            onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    scheduleClose();
                }
            }}
            onKeyDown={(event) => {
                if (event.key === "Escape") {
                    event.stopPropagation();
                    closeMenu();
                }
            }}
        >
            <div
                id={menuId}
                role="menu"
                aria-label={mainLabel}
                aria-hidden={!isOpen}
                style={{
                    position: "absolute",
                    right: 0,
                    bottom: 48,
                    display: "flex",
                    flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        opacity: isOpen ? 1 : 0,
                    transform: isOpen ? "translateY(0)" : "translateY(8px)",
                    pointerEvents: isOpen ? "auto" : "none",
                    transition: "opacity 160ms ease, transform 160ms ease",
                }}
            >
                {actions.map((action, index) => (
                    <div key={action.id} style={{ position: "relative" }}>
                        <Tooltip
                            label={action.label}
                            visible={hoveredItem === action.id}
                            placement={tooltipPlacement}
                        />
                        <button
                            type="button"
                            role="menuitem"
                            aria-label={action.label}
                            onMouseEnter={() => setHoveredItem(action.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                            onFocus={() => setHoveredItem(action.id)}
                            onBlur={() => setHoveredItem(null)}
                            onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                clearCloseTimer();
                                action.onClick?.();
                                scheduleClose();
                            }}
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                border: "2px solid #fff",
                                background: MENU_COLOR,
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                boxShadow: BUTTON_SHADOW,
                                opacity: isOpen ? 1 : 0,
                                transform: isOpen ? "translateY(0) scale(1)" : "translateY(8px) scale(0.95)",
                                transition: "opacity 160ms ease, transform 160ms ease, box-shadow 160ms ease",
                                transitionDelay: isOpen ? `${index * 40}ms` : "0ms",
                            }}
                        >
                            {action.icon}
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ position: "relative" }}>
                <Tooltip label={mainLabel} visible={hoveredItem === "main"} placement={tooltipPlacement} />
                <button
                    type="button"
                    aria-label={mainLabel}
                    aria-expanded={isOpen}
                    aria-controls={menuId}
                    aria-haspopup="menu"
                    onMouseEnter={() => setHoveredItem("main")}
                    onMouseLeave={() => setHoveredItem(null)}
                    onFocus={() => setHoveredItem("main")}
                    onBlur={() => setHoveredItem(null)}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        clearCloseTimer();
                        setIsOpen((prev) => {
                            const next = !prev;
                            if (!next) {
                                setHoveredItem(null);
                            }
                            return next;
                        });
                    }}
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        border: "2px solid #fff",
                        background: MENU_COLOR,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: BUTTON_SHADOW,
                        transition: "transform 160ms ease, box-shadow 160ms ease",
                        transform: isOpen ? "scale(1.04)" : "scale(1)",
                    }}
                >
                    {mainIcon}
                </button>
            </div>
        </div>
    );
}

export function PythonSessionActionMenu({ onOpenPipPanel, onOpenExtensionsPanel }) {
    const actions = [
        { id: "pip", label: "Install PIP package", icon: <PipPackageIcon />, onClick: onOpenPipPanel },
        { id: "extensions", label: "Add Extension", icon: <ExtensionIcon />, onClick: onOpenExtensionsPanel },
    ];

    return (
        <FloatingActionMenu
            mainLabel="Python session actions"
            mainIcon={<SessionActionIcon />}
            actions={actions}
            positionStyle={{ left: 12, bottom: 12 }}
            tooltipPlacement="right"
        />
    );
}

export default function FileAddMenu({
    onAddPythonFiles,
    onAddImageFiles,
    onAddTextFiles,
    onAddCsvFiles,
}) {
    const actions = [
        { id: "python", label: "Add a new python file", icon: <PythonFileIcon />, onClick: onAddPythonFiles },
        { id: "image", label: "Add a new image file", icon: <ImageFileIcon />, onClick: onAddImageFiles },
        { id: "text", label: "Add a new text file", icon: <TextFileIcon />, onClick: onAddTextFiles },
        { id: "csv", label: "Add a new CSV file", icon: <CsvFileIcon />, onClick: onAddCsvFiles },
    ];

    return (
        <FloatingActionMenu
            mainLabel="Add a new file"
            mainIcon={<MainAddIcon />}
            actions={actions}
            positionStyle={{ right: 12, bottom: 12 }}
            tooltipPlacement="left"
        />
    );
}
