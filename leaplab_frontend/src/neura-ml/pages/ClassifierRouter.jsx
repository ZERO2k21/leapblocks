// pages/ClassifierRouter.jsx
import ImageClassifier from '../classifiers/image-classifier/ImageClassifier'
import AudioClassifier from '../classifiers/audio-classifier/AudioClassifier'
import PoseClassifier from '../classifiers/pose-classifier/PoseClassifier'
import HandPoseClassifier from '../classifiers/hand-pose-classifier/HandPoseClassifier'
import ObjectDetection from '../classifiers/object-detection/ObjectDetection'
import TextClassifier from '../classifiers/text-classifier/TextClassifier'
import NumbersClassifier from '../classifiers/numbers-classifier/NumbersClassifier'

export default function ClassifierRouter({ project, onBack, onProjectUpdate }) {
    const props = { project, onBack, onProjectUpdate }

    switch (project.type) {
        case 'Image Classifier': return <ImageClassifier    {...props} />
        case 'Object Detection': return <ObjectDetection    {...props} />
        case 'Pose Classifier': return <PoseClassifier     {...props} />
        case 'Hand Pose Classifier': return <HandPoseClassifier {...props} />
        case 'Audio Classifier': return <AudioClassifier    {...props} />
        case 'Text Classifier': return <TextClassifier     {...props} />
        case 'Numbers (C/R)': return <NumbersClassifier  {...props} />
        default:
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-5xl mb-4">🤖</div>
                        <p className="text-gray-500 mb-4">Unknown project type: {project.type}</p>
                        <button onClick={onBack} className="px-6 py-2 bg-purple-700 text-white rounded-lg text-sm font-semibold">
                            Go Back
                        </button>
                    </div>
                </div>
            )
    }
}
