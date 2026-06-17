with open('src/leapembed/client/EmbedApp.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add onPaintSprite and onUploadSprite after onOpenBackdropLibrary in EmbedRightPanel usage
old = "                    onOpenSpriteLibrary={() => setShowSpriteLibrary(true)}\n                    onOpenBackdropLibrary={() => setShowBackdropLibrary(true)}"
new = """                    onOpenSpriteLibrary={() => setShowSpriteLibrary(true)}
                    onOpenBackdropLibrary={() => setShowBackdropLibrary(true)}
                    onPaintSprite={() => handleWorkspaceTabChange('costumes')}
                    onUploadSprite={addSpriteFromLibrary}"""

if old in content:
    content = content.replace(old, new)
    print('Added onPaintSprite and onUploadSprite to EmbedRightPanel')
else:
    print('Pattern not found')

# Also listen for backdrop-added custom event to increment backdropRefresh
# Find the handleBackdropSelect function and ensure it dispatches the event
# Check if we need to add a useEffect for the backdrop-added event
if 'backdrop-added' not in content:
    # Add a useEffect to listen for backdrop-added events from SpritePanel upload
    old_effect = "    // ─── Backdrop ─────────────────────────────────────────────────────────────\n    const handleBackdropSelect = async (name: string, src: string) => {"
    new_effect = """    // ─── Backdrop ─────────────────────────────────────────────────────────────
    // Listen for backdrop-added events from SpritePanel's file upload
    useEffect(() => {
        const handler = (e: Event) => {
            setBackdropRefresh(prev => prev + 1);
            window.dispatchEvent(new Event('leap-stage-update'));
        };
        window.addEventListener('backdrop-added', handler);
        return () => window.removeEventListener('backdrop-added', handler);
    }, []);

    const handleBackdropSelect = async (name: string, src: string) => {"""
    if old_effect in content:
        content = content.replace(old_effect, new_effect)
        print('Added backdrop-added event listener')
    else:
        print('backdrop effect pattern not found')

with open('src/leapembed/client/EmbedApp.tsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print('Done')
