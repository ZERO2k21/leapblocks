# 🚀 Quick Start: Neura ML Environment

## Train Your First Model in 5 Minutes!

---

## Step 1: Open Neura ML Studio

```
LeapLab → Neura ML Studio → Create New Project → Image Classifier
```

---

## Step 2: Add Training Data

### Option A: Webcam Capture (Recommended for Quick Start)
1. Click **"Webcam"** button on `class1` card
2. **Hold** the "Hold to Capture" button for 3-5 seconds
3. Release when you have 10-20 frames
4. Click **"Done"**
5. Repeat for `class2` with different object/pose

### Option B: Upload Images
1. Click **"Upload"** button on class card
2. Select 10-20 images from your computer
3. Repeat for each class

### Option C: Upload Folder (Best for Large Datasets)
1. Click **"Upload Folder"** in top-right
2. Select a folder with subfolders named after classes:
   ```
   my-dataset/
   ├── cats/
   │   ├── cat1.jpg
   │   ├── cat2.jpg
   │   └── ...
   └── dogs/
       ├── dog1.jpg
       ├── dog2.jpg
       └── ...
   ```
3. Classes auto-created from subfolder names!

---

## Step 3: Train the Model

1. Ensure you have:
   - ✅ At least **2 classes**
   - ✅ At least **4 total samples** (2 per class minimum)
   - ✅ Recommended: **20+ samples per class** for best accuracy

2. Click **"Train Model"** button (purple gradient)

3. Wait 5-10 seconds while:
   - Feature extraction runs (0-85%)
   - Accuracy estimation completes (85-100%)

4. See success message with accuracy percentage!

---

## Step 4: Test Your Model

### Live Webcam Testing
1. Click **"Live Webcam"** button
2. Allow camera access
3. Show objects to camera
4. Watch real-time predictions update!
5. Click **"Stop Camera"** when done

### Upload Image Testing
1. Click **"Upload Image"** button
2. Select a test image
3. See instant prediction with confidence bars

---

## 🎯 Tips for Best Results

### Training Data Quality
- ✅ **Variety**: Capture from different angles, lighting, backgrounds
- ✅ **Quantity**: 20-50 samples per class is ideal
- ✅ **Balance**: Similar number of samples per class
- ✅ **Clarity**: Clear, focused images work best

### Common Issues
- ❌ **Low Accuracy (<70%)**: Add more diverse samples
- ❌ **Confused Classes**: Make classes more distinct
- ❌ **Slow Predictions**: Normal on older devices (100-300ms)

---

## 🔧 Advanced Features

### Rename Classes
1. Click **edit icon** (pencil) on class card header
2. Type new name
3. Press **Enter** or click **checkmark**

### Delete Classes
1. Click **trash icon** on class card header
2. Class and all samples removed

### Add More Classes
1. Click **"+ Add Class"** button at bottom
2. New class created with auto-generated name
3. Rename and add samples

### Advanced Settings
1. Click **"Advanced settings"** in Training panel
2. Adjust **Epochs** slider (5-100)
3. Read about MobileNet + KNN architecture

### Export Model
1. After training, scroll to Export section
2. **Download as JSON**: Save model metadata
3. **Copy embed code**: Get HTML snippet for your app

---

## 📊 Understanding Results

### Confidence Bars
```
class1  ████████████████░░░░  85%  ← High confidence
class2  ████░░░░░░░░░░░░░░░░  15%  ← Low confidence
```

- **>80%**: Very confident prediction
- **50-80%**: Moderate confidence
- **<50%**: Low confidence, may need more training

### Accuracy Percentage
- **90-100%**: Excellent! Model learned well
- **80-90%**: Good, may improve with more data
- **70-80%**: Fair, add more diverse samples
- **<70%**: Poor, check data quality

---

## 🎓 Example Projects

### 1. Rock-Paper-Scissors
```
Classes: rock, paper, scissors
Samples: 30 per class (hand gestures)
Training: ~8 seconds
Accuracy: 95%+
Use Case: Game controller
```

### 2. Face Mask Detector
```
Classes: mask, no_mask
Samples: 50 per class (selfies)
Training: ~12 seconds
Accuracy: 92%+
Use Case: Safety compliance
```

### 3. Fruit Classifier
```
Classes: apple, banana, orange
Samples: 40 per class (photos)
Training: ~10 seconds
Accuracy: 88%+
Use Case: Inventory system
```

### 4. Emotion Detector
```
Classes: happy, sad, neutral
Samples: 60 per class (facial expressions)
Training: ~15 seconds
Accuracy: 85%+
Use Case: Mood tracker
```

---

## 🐛 Troubleshooting

### Camera Not Working
- **Check permissions**: Allow camera access in browser
- **Try different browser**: Chrome/Edge work best
- **Check other apps**: Close apps using camera

### TensorFlow.js Not Loading
- **Check internet**: CDN requires connection
- **Wait longer**: First load takes 10-20 seconds
- **Refresh page**: Clear cache and reload

### Training Fails
- **Check samples**: Need 2+ classes, 4+ total samples
- **Wait for TF.js**: Green "TF.js ready" indicator
- **Check console**: Open DevTools for error messages

### Low Accuracy
- **Add more samples**: 20+ per class recommended
- **Improve variety**: Different angles, lighting, backgrounds
- **Check class overlap**: Make classes more distinct
- **Balance dataset**: Similar samples per class

---

## 🎨 Keyboard Shortcuts

```
Enter       → Confirm class rename
Escape      → Cancel class rename
Space       → (In webcam modal) Single capture
Hold Mouse  → (In webcam modal) Continuous capture
```

---

## 💡 Pro Tips

1. **Start Small**: Begin with 2 classes, 10 samples each
2. **Test Early**: Train with minimal data, test, then add more
3. **Use Webcam**: Fastest way to collect diverse samples
4. **Mirror Yourself**: Webcam is mirrored for natural UX
5. **Export Often**: Download model JSON after good training
6. **Retrain Anytime**: Click "Retrain Model" to update
7. **Privacy First**: All data stays in your browser!

---

## 📱 Mobile Usage

### Works on Mobile!
- ✅ Responsive design
- ✅ Touch-friendly buttons
- ✅ Mobile camera access
- ✅ Vertical layout on small screens

### Mobile Tips
- Use **rear camera** for better quality
- **Landscape mode** for better layout
- **Good lighting** essential on mobile
- **Stable hands** for clear captures

---

## 🚀 Next Steps

After training your first model:

1. **Experiment**: Try different objects, poses, scenarios
2. **Share**: Export and share your model JSON
3. **Integrate**: Use embed code in your projects
4. **Learn**: Read about transfer learning and KNN
5. **Build**: Create real applications with your models!

---

## 📚 Learn More

### Concepts
- **Transfer Learning**: Using pre-trained models
- **MobileNet**: Efficient CNN for mobile/web
- **KNN**: K-Nearest Neighbors algorithm
- **Embeddings**: High-dimensional feature vectors

### Resources
- TensorFlow.js Docs: https://www.tensorflow.org/js
- MobileNet Paper: https://arxiv.org/abs/1704.04861
- ML Basics: https://developers.google.com/machine-learning

---

**Happy Training!** 🧠✨

Got questions? Check the full documentation in `ML_ENVIRONMENT_INTEGRATION.md`
