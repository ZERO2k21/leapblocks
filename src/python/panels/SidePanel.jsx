import React from "react";
import {
    FileText,
    Package,
    Download,
    Search,
    Trash2,
    Check,
    Sparkles,
    Eye,
    Mic,
    Cpu,
    Wifi,
    Wrench,
    ArrowLeft,
    FilePlus,
} from "lucide-react";
import BackdropPanel from "./BackdropPanel";
import FileAddMenu, { PythonSessionActionMenu } from "./FileAddMenu";

const C = {
    PURPLE: "#8B5CF6",
    DARK_PURPLE: "#7C3AED",
    LIGHT_PURPLE: "#EDE9FE",
    BORDER: "#E5E7EB",
    BG: "#F9FAFB",
    TEXT: "#1F2937",
    MUTED: "#6B7280",
    GREEN: "#10B981",
};

function FilesPanel({
    projectFiles,
    activeFile,
    setActiveFile,
    handleAddPythonFiles,
    handleAddImageFiles,
    handleAddTextFiles,
    handleAddCsvFiles,
    handleDeleteFile,
    onOpenPipPanel,
    onOpenExtensionsPanel,
    onAddNewFile,
}) {
    return (
        <>
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative" }}>
                <div
                    style={{
                        padding: "10px 12px 8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: `1px solid ${C.BORDER}`,
                    }}
                >
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.TEXT }}>Project Files</span>
                    {onAddNewFile && (
                        <button
                            onClick={onAddNewFile}
                            style={{
                                cursor: "pointer",
                                color: C.PURPLE,
                                padding: 2,
                                borderRadius: 4,
                                border: "none",
                                background: "transparent",
                            }}
                            title="New Python File"
                        >
                            <FilePlus size={14} />
                        </button>
                    )}
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "4px 0 64px" }}>
                    {Object.keys(projectFiles).map((file) => (
                        <div
                            key={file}
                            onClick={() => setActiveFile(file)}
                            style={{
                                padding: "8px 12px",
                                cursor: "pointer",
                                background: activeFile === file ? "#E8F5E9" : "transparent",
                                color: activeFile === file ? "#2E7D32" : C.TEXT,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 8,
                                borderLeft: activeFile === file ? "3px solid #4CAF50" : "3px solid transparent",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div
                                    style={{
                                        width: 18,
                                        height: 18,
                                        background: "#E8F5E9",
                                        borderRadius: 3,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <FileText size={12} style={{ color: "#4CAF50" }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: activeFile === file ? 600 : 400 }}>
                                    {file}
                                </span>
                            </div>
                            {handleDeleteFile && Object.keys(projectFiles).length > 1 && (
                                <button
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        handleDeleteFile(file);
                                    }}
                                    style={{
                                        cursor: "pointer",
                                        color: C.MUTED,
                                        padding: 2,
                                        borderRadius: 4,
                                        border: "none",
                                        background: "transparent",
                                        opacity: 0.5,
                                    }}
                                    title="Delete file"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <PythonSessionActionMenu
                    onOpenPipPanel={onOpenPipPanel}
                    onOpenExtensionsPanel={onOpenExtensionsPanel}
                />
                <FileAddMenu
                    onAddPythonFiles={handleAddPythonFiles}
                    onAddImageFiles={handleAddImageFiles}
                    onAddTextFiles={handleAddTextFiles}
                    onAddCsvFiles={handleAddCsvFiles}
                />
            </div>

            <div style={{ borderTop: `1px solid ${C.BORDER}`, padding: "10px 12px 6px", background: "#FAFAFA" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.MUTED, letterSpacing: "0.05em" }}>
                    MODULES/LIBRARIES
                </span>
            </div>
            <div style={{ padding: "8px 12px 12px", background: "#FAFAFA", flexShrink: 0 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 8px",
                        borderRadius: 4,
                        background: "#fff",
                        border: `1px solid ${C.BORDER}`,
                    }}
                >
                    <Package size={14} style={{ color: C.PURPLE }} />
                    <span style={{ fontSize: 12, color: C.TEXT }}>Sprite</span>
                </div>
            </div>
        </>
    );
}

function AssetPreview({ entry }) {
    const preview = entry?.img || entry?.image || entry?.emoji;
    const isImage = typeof preview === "string" && (preview.includes("/") || preview.startsWith("data:image"));

    if (isImage) {
        return <img src={preview} alt={entry?.name} style={{ width: 24, height: 24, objectFit: "contain" }} />;
    }

    return <span style={{ fontSize: 24 }}>{preview || "?"}</span>;
}

function SpritesPanel({
    assetMode = "sprite",
    spriteFilter,
    setSpriteFilter,
    handleSpriteAssetSelect,
    SPRITE_LIBRARY,
    BACKDROP_LIBRARY,
    backdrop,
    handleSetBackdrop,
    onOpenAssetLibrary,
}) {
    const isCostumeMode = assetMode === "costume";
    const filteredSprites = SPRITE_LIBRARY.filter((sp) =>
        sp.name.toLowerCase().includes(spriteFilter.toLowerCase())
    );

    return (
        <>
            <div style={{ padding: "10px 12px 8px", borderBottom: `1px solid ${C.BORDER}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.TEXT }}>
                        {isCostumeMode ? "Costume Library" : "Sprite Library"}
                    </span>
                    <button
                        onClick={() => onOpenAssetLibrary?.(isCostumeMode ? "costume" : "sprite")}
                        title={isCostumeMode ? "Browse All Costumes" : "Browse All Sprites"}
                        style={{
                            cursor: "pointer",
                            color: C.PURPLE,
                            padding: 2,
                            borderRadius: 4,
                            border: "none",
                            background: "transparent",
                        }}
                    >
                        <Sparkles size={14} />
                    </button>
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 8px",
                        borderRadius: 6,
                        background: C.BG,
                        border: `1px solid ${C.BORDER}`,
                    }}
                >
                    <Search size={12} style={{ color: C.MUTED }} />
                    <input
                        value={spriteFilter}
                        onChange={(event) => setSpriteFilter(event.target.value)}
                        placeholder={isCostumeMode ? "Search costumes..." : "Search sprites..."}
                        style={{
                            flex: 1,
                            border: "none",
                            background: "transparent",
                            fontSize: 11,
                            outline: "none",
                            color: C.TEXT,
                        }}
                    />
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                    {filteredSprites.slice(0, 12).map((sp, idx) => (
                        <div
                            key={`${sp.name}-${idx}`}
                            onClick={() => handleSpriteAssetSelect?.(sp)}
                            style={{
                                padding: "8px 4px",
                                borderRadius: 6,
                                background: "#fff",
                                border: `1px solid ${C.BORDER}`,
                                cursor: "pointer",
                                textAlign: "center",
                                transition: "all 0.15s",
                            }}
                            onMouseEnter={(event) => {
                                event.currentTarget.style.borderColor = C.PURPLE;
                            }}
                            onMouseLeave={(event) => {
                                event.currentTarget.style.borderColor = C.BORDER;
                            }}
                        >
                            <div
                                style={{
                                    height: 28,
                                    marginBottom: 4,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <AssetPreview entry={sp} />
                            </div>
                            <div
                                style={{
                                    fontSize: 9,
                                    color: C.MUTED,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {sp.name}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {!isCostumeMode && (
                <>
                    <div style={{ borderTop: `1px solid ${C.BORDER}`, padding: "8px 12px", background: "#FAFAFA" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.MUTED, letterSpacing: "0.05em" }}>
                            BACKDROPS
                        </span>
                    </div>
                    <div style={{ padding: "8px", maxHeight: 120, overflowY: "auto", background: "#FAFAFA" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                            {BACKDROP_LIBRARY.map((bd, idx) => (
                                <div
                                    key={`${bd.id || bd.name}-${idx}`}
                                    onClick={() => handleSetBackdrop(bd)}
                                    style={{
                                        padding: "6px",
                                        borderRadius: 4,
                                        background: backdrop === bd.img ? C.LIGHT_PURPLE : "#fff",
                                        border: backdrop === bd.img ? `2px solid ${C.PURPLE}` : `1px solid ${C.BORDER}`,
                                        cursor: "pointer",
                                        textAlign: "center",
                                        fontSize: 9,
                                        color: C.TEXT,
                                    }}
                                >
                                    {bd.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

function PanelBackButton({ onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginBottom: 8,
                padding: "4px 8px",
                borderRadius: 999,
                border: `1px solid ${C.BORDER}`,
                background: "#fff",
                color: C.MUTED,
                cursor: "pointer",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
            }}
        >
            <ArrowLeft size={12} />
            Files
        </button>
    );
}

function ExtensionsPanel({ EXTENSIONS, installedExtensions, installExtension, onBackToFiles }) {
    return (
        <>
            <div style={{ padding: "10px 12px 8px", borderBottom: `1px solid ${C.BORDER}` }}>
                <PanelBackButton onClick={onBackToFiles} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.TEXT }}>Extensions</span>
                <div style={{ fontSize: 11, color: C.MUTED, marginTop: 4 }}>Add capabilities to your project</div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
                {EXTENSIONS.map((ext) => {
                    const isInstalled = installedExtensions.find((entry) => entry.id === ext.id);
                    return (
                        <div
                            key={ext.id}
                            style={{
                                padding: "10px 12px",
                                marginBottom: 6,
                                borderRadius: 8,
                                background: isInstalled ? C.LIGHT_PURPLE : "#fff",
                                border: `1px solid ${isInstalled ? C.PURPLE : C.BORDER}`,
                                cursor: isInstalled ? "default" : "pointer",
                                transition: "all 0.15s",
                            }}
                            onClick={() => !isInstalled && installExtension(ext)}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 18 }}>{ext.icon}</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: C.TEXT }}>{ext.name}</span>
                                {isInstalled && (
                                    <span style={{ marginLeft: "auto", fontSize: 10, color: C.GREEN, fontWeight: 700 }}>
                                        <Check size={12} style={{ verticalAlign: "middle" }} /> Installed
                                    </span>
                                )}
                            </div>
                            <div style={{ fontSize: 11, color: C.MUTED }}>{ext.desc}</div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}

function PipPackageItem({ pkg, handleInstall }) {
    const getCategoryIcon = (category) => {
        switch (category) {
            case "computer-vision":
                return <Eye size={12} />;
            case "machine-learning":
                return <Sparkles size={12} />;
            case "speech":
                return <Mic size={12} />;
            case "iot":
                return <Wifi size={12} />;
            case "hardware":
                return <Cpu size={12} />;
            case "utility":
                return <Wrench size={12} />;
            default:
                return <Package size={12} />;
        }
    };

    return (
        <div style={{ padding: "8px 12px", borderBottom: `1px solid ${C.BORDER}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: pkg.category ? C.PURPLE : C.MUTED }}>{getCategoryIcon(pkg.category)}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.TEXT }}>{pkg.name}</span>
                    {pkg.version && (
                        <span
                            style={{
                                fontSize: 9,
                                color: C.MUTED,
                                background: C.BG,
                                padding: "1px 4px",
                                borderRadius: 3,
                            }}
                        >
                            v{pkg.version}
                        </span>
                    )}
                </div>
                {pkg.installed ? (
                    <span style={{ fontSize: 10, color: C.GREEN, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                        <Check size={10} /> READY
                    </span>
                ) : (
                    <button
                        onClick={() => handleInstall(pkg.name)}
                        style={{
                            fontSize: 10,
                            padding: "3px 8px",
                            background: C.PURPLE,
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            transition: "all 0.15s",
                        }}
                        onMouseEnter={(event) => {
                            event.currentTarget.style.background = C.DARK_PURPLE;
                        }}
                        onMouseLeave={(event) => {
                            event.currentTarget.style.background = C.PURPLE;
                        }}
                    >
                        <Download size={10} /> INSTALL
                    </button>
                )}
            </div>
            <div style={{ fontSize: 11, color: C.MUTED, marginTop: 3, marginLeft: 18 }}>{pkg.desc}</div>
            {pkg.tags && (
                <div style={{ display: "flex", gap: 4, marginTop: 4, marginLeft: 18 }}>
                    {pkg.tags.map((tag, idx) => (
                        <span
                            key={`${pkg.name}-${tag}-${idx}`}
                            style={{
                                fontSize: 9,
                                color: C.PURPLE,
                                background: C.LIGHT_PURPLE,
                                padding: "1px 5px",
                                borderRadius: 3,
                            }}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

function PipPanel({ packages, pipFilter, setPipFilter, handleInstall, onBackToFiles }) {
    const filteredPackages = packages.filter(
        (pkg) =>
            pkg.name.toLowerCase().includes(pipFilter.toLowerCase()) ||
            pkg.desc.toLowerCase().includes(pipFilter.toLowerCase())
    );

    const builtinPackages = filteredPackages.filter((pkg) => pkg.builtin);
    const externalPackages = filteredPackages.filter((pkg) => !pkg.builtin);

    return (
        <>
            <div style={{ padding: "10px 12px 8px", borderBottom: `1px solid ${C.BORDER}` }}>
                <PanelBackButton onClick={onBackToFiles} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.TEXT }}>PIP Packages</span>
                    <span style={{ fontSize: 10, color: C.MUTED }}>
                        {packages.filter((pkg) => pkg.installed).length} installed
                    </span>
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 8px",
                        borderRadius: 6,
                        background: C.BG,
                        border: `1px solid ${C.BORDER}`,
                    }}
                >
                    <Search size={12} style={{ color: C.MUTED }} />
                    <input
                        value={pipFilter}
                        onChange={(event) => setPipFilter(event.target.value)}
                        placeholder="Search packages..."
                        style={{
                            flex: 1,
                            border: "none",
                            background: "transparent",
                            fontSize: 11,
                            outline: "none",
                            color: C.TEXT,
                        }}
                    />
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
                {!window.electronAPI?.isElectron && (
                    <div style={{
                        padding: "8px 12px",
                        background: "#FEF3C7",
                        borderBottom: "1px solid #FCD34D",
                        fontSize: 11,
                        color: "#92400E",
                    }}>
                        🌐 Web Mode: Only built-in Python modules are fully functional in-browser.
                    </div>
                )}
                {builtinPackages.length > 0 && (
                    <>
                        <div style={{ padding: "8px 12px 4px", background: "#FAFAFA" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: C.MUTED, letterSpacing: "0.05em" }}>
                                BUILT-IN MODULES
                            </span>
                        </div>
                        {builtinPackages.map((pkg) => (
                            <PipPackageItem key={pkg.name} pkg={pkg} handleInstall={handleInstall} />
                        ))}
                    </>
                )}

                {externalPackages.length > 0 && (
                    <>
                        <div style={{ padding: "8px 12px 4px", background: "#FAFAFA", borderTop: `1px solid ${C.BORDER}` }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: C.MUTED, letterSpacing: "0.05em" }}>
                                ADVANCED LIBRARIES
                            </span>
                        </div>
                        {externalPackages.map((pkg) => (
                            <PipPackageItem key={pkg.name} pkg={pkg} handleInstall={handleInstall} />
                        ))}
                    </>
                )}

                {filteredPackages.length === 0 && (
                    <div style={{ padding: "20px", textAlign: "center", color: C.MUTED, fontSize: 12 }}>
                        No packages found matching "{pipFilter}"
                    </div>
                )}
            </div>
        </>
    );
}

export default function SidePanel({
    sidePanel = "files",
    setSidePanel,
    projectFiles,
    activeFile,
    assetMode = "sprite",
    setActiveFile,
    handleAddPythonFiles,
    handleAddImageFiles,
    handleAddTextFiles,
    handleAddCsvFiles,
    handleDeleteFile,
    onAddNewFile,
    spriteFilter,
    setSpriteFilter,
    addSpriteFromLibrary,
    handleSpriteAssetSelect,
    SPRITE_LIBRARY,
    BACKDROP_LIBRARY,
    backdrop,
    handleSetBackdrop,
    onOpenAssetLibrary,
    EXTENSIONS,
    installedExtensions,
    installExtension,
    packages,
    pipFilter,
    setPipFilter,
    handleInstall,
}) {
    return (
        <div
            style={{
                width: 240,
                background: "#fff",
                borderRight: `1px solid ${C.BORDER}`,
                display: "flex",
                flexDirection: "column",
                flexShrink: 0,
                overflow: "hidden",
            }}
        >
            {sidePanel === "files" && (
                <FilesPanel
                    projectFiles={projectFiles}
                    activeFile={activeFile}
                    setActiveFile={setActiveFile}
                    handleAddPythonFiles={handleAddPythonFiles}
                    handleAddImageFiles={handleAddImageFiles}
                    handleAddTextFiles={handleAddTextFiles}
                    handleAddCsvFiles={handleAddCsvFiles}
                    handleDeleteFile={handleDeleteFile}
                    onAddNewFile={onAddNewFile}
                    onOpenPipPanel={() => setSidePanel?.("pip")}
                    onOpenExtensionsPanel={() => setSidePanel?.("extensions")}
                />
            )}

            {sidePanel === "sprites" && (
                <SpritesPanel
                    assetMode={assetMode}
                    spriteFilter={spriteFilter}
                    setSpriteFilter={setSpriteFilter}
                    handleSpriteAssetSelect={handleSpriteAssetSelect || addSpriteFromLibrary}
                    SPRITE_LIBRARY={SPRITE_LIBRARY}
                    BACKDROP_LIBRARY={BACKDROP_LIBRARY}
                    backdrop={backdrop}
                    handleSetBackdrop={handleSetBackdrop}
                    onOpenAssetLibrary={onOpenAssetLibrary}
                />
            )}

            {sidePanel === "backdrops" && (
                <BackdropPanel
                    BACKDROP_LIBRARY={BACKDROP_LIBRARY}
                    backdrop={backdrop}
                    handleSetBackdrop={handleSetBackdrop}
                    onBrowseBackdrops={() => onOpenAssetLibrary?.("backdrop")}
                />
            )}

            {sidePanel === "extensions" && (
                <ExtensionsPanel
                    EXTENSIONS={EXTENSIONS}
                    installedExtensions={installedExtensions}
                    installExtension={installExtension}
                    onBackToFiles={() => setSidePanel?.("files")}
                />
            )}

            {sidePanel === "pip" && (
                <PipPanel
                    packages={packages}
                    pipFilter={pipFilter}
                    setPipFilter={setPipFilter}
                    handleInstall={handleInstall}
                    onBackToFiles={() => setSidePanel?.("files")}
                />
            )}
        </div>
    );
}
