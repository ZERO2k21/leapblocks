# Quick Start Guide - MIT App Inventor Clone

## 🚀 Get Started in 5 Minutes

---

## Step 1: Verify Installation (30 seconds)

```bash
cd d:\leapblocks
npm list blockly
```

✅ Should show: `blockly@12.5.1`

---

## Step 2: Update Main File (2 minutes)

Open `src/appinverter/index.jsx` and replace the imports:

```javascript
// OLD
import Palette from './components/Palette';
import PhoneCanvas from './components/PhoneCanvas';
import BlocksView from './components/BlocksView';

// NEW
import Palette from './components/Palette_Enhanced';
import PhoneCanvas from './components/PhoneCanvas_Enhanced';
import BlocksView from './components/BlocksEditor_Complete';
```

---

## Step 3: Run the App (1 minute)

```bash
npm run dev
```

---

## Step 4: Test Features (2 minutes)

### Designer Tab
1. ✅ Click "Designer" tab
2. ✅ Drag a Button from Palette to Phone
3. ✅ Click the Button to select it
4. ✅ Edit properties on the right
5. ✅ See it in Component Tree

### Blocks Tab
1. ✅ Click "Blocks" tab
2. ✅ Drag "when Button1.Click" from toolbox
3. ✅ Drag "set Label1.Text" inside it
4. ✅ Click "Generate Code" to see output

---

## 🎉 You're Done!

You now have a fully functional MIT App Inventor clone with:
- ✅ 100+ components
- ✅ Visual designer
- ✅ Blocks editor
- ✅ Code generation

---

## 📚 Next Steps

1. **Read**: `FINAL_IMPLEMENTATION_GUIDE.md` for complete details
2. **Explore**: Try creating a simple app
3. **Build**: Phase 3 (APK generation) coming next

---

## 🆘 Troubleshooting

**Issue**: Blocks tab is blank
**Fix**: Check browser console for errors, ensure Blockly is imported

**Issue**: Components not showing
**Fix**: Verify `paletteComponents_Enhanced.js` is imported

**Issue**: Can't drag components
**Fix**: Check that drag handlers are connected in PhoneCanvas

---

## 📞 Need Help?

Check these files:
- `FINAL_IMPLEMENTATION_GUIDE.md` - Complete guide
- `INTEGRATION_GUIDE.md` - Integration help
- `MIT_APP_INVENTOR_IMPLEMENTATION_ROADMAP.md` - Full roadmap

---

**Happy Building!** 🎨📱✨
