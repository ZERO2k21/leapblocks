filepath = r"c:\Users\ruthr\OneDrive\Desktop\leapblocks\src\python\PythonApp.jsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the monacoRef line to insert stageRef after it
idx = content.find('const monacoRef = useRef(null);')
if idx < 0:
    print("monacoRef not found")
else:
    insert_pos = idx + len('const monacoRef = useRef(null);')
    stage_ref_code = """
    const stageRef = useRef(null);
    const [stageSize, setStageSize] = useState({ w: 300, h: 240 });
    useEffect(() => {
        if (!stageRef.current) return;
        const obs = new ResizeObserver(entries => {
            for (const e of entries) {
                setStageSize({ w: e.contentRect.width, h: e.contentRect.height });
            }
        });
        obs.observe(stageRef.current);
        return () => obs.disconnect();
    }, []);"""
    content = content[:insert_pos] + stage_ref_code + content[insert_pos:]
    print("stageRef + stageSize + ResizeObserver added")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
