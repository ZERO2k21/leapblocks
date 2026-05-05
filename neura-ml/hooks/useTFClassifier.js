import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';

/**
 * TF.js + MobileNet + KNN (shared logic)
 * Reusable hook for image-based classifiers
 */
function useTFClassifier() {
    const [model, setModel] = useState(null);
    const [classifier, setClassifier] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isTraining, setIsTraining] = useState(false);
    const [trainingProgress, setTrainingProgress] = useState(0);

    const mobileNetRef = useRef(null);
    const knnRef = useRef(null);

    useEffect(() => {
        initializeModels();
        return () => {
            // Cleanup
            if (mobileNetRef.current) {
                mobileNetRef.current.dispose?.();
            }
            if (knnRef.current) {
                knnRef.current.dispose?.();
            }
        };
    }, []);

    const initializeModels = async () => {
        setIsLoading(true);
        try {
            // Load MobileNet for feature extraction
            const mobilenetModel = await mobilenet.load();
            mobileNetRef.current = mobilenetModel;

            // Create KNN classifier
            const knn = knnClassifier.create();
            knnRef.current = knn;

            setModel(mobilenetModel);
            setClassifier(knn);
        } catch (error) {
            console.error('Error loading models:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addExample = async (imageElement, classId) => {
        if (!mobileNetRef.current || !knnRef.current) {
            throw new Error('Models not loaded');
        }

        // Get activation from MobileNet
        const activation = mobileNetRef.current.infer(imageElement, 'conv_preds');

        // Add to KNN classifier
        knnRef.current.addExample(activation, classId);

        // Dispose tensor
        activation.dispose();
    };

    const train = async (classes) => {
        setIsTraining(true);
        setTrainingProgress(0);

        try {
            // Clear existing classifier
            knnRef.current.clearAllClasses();

            // Add all examples
            let totalSamples = 0;
            classes.forEach(cls => {
                totalSamples += cls.samples.length;
            });

            let processedSamples = 0;

            for (const cls of classes) {
                for (const sample of cls.samples) {
                    await addExample(sample.image, cls.id);
                    processedSamples++;
                    setTrainingProgress(Math.round((processedSamples / totalSamples) * 100));
                }
            }

            setTrainingProgress(100);
            return true;
        } catch (error) {
            console.error('Training error:', error);
            return false;
        } finally {
            setIsTraining(false);
        }
    };

    const predict = async (imageElement) => {
        if (!mobileNetRef.current || !knnRef.current) {
            throw new Error('Models not loaded');
        }

        if (knnRef.current.getNumClasses() === 0) {
            throw new Error('Model not trained');
        }

        // Get activation
        const activation = mobileNetRef.current.infer(imageElement, 'conv_preds');

        // Predict
        const result = await knnRef.current.predictClass(activation);

        // Dispose tensor
        activation.dispose();

        // Format predictions
        const predictions = Object.entries(result.confidences).map(([classId, confidence]) => ({
            classId: parseInt(classId),
            confidence,
        }));

        predictions.sort((a, b) => b.confidence - a.confidence);

        return {
            classId: result.label,
            predictions,
        };
    };

    const saveModel = () => {
        if (!knnRef.current) return null;
        return knnRef.current.getClassifierDataset();
    };

    const loadModel = (dataset) => {
        if (!knnRef.current) return;
        knnRef.current.setClassifierDataset(dataset);
    };

    return {
        model,
        classifier,
        isLoading,
        isTraining,
        trainingProgress,
        addExample,
        train,
        predict,
        saveModel,
        loadModel,
    };
}

export default useTFClassifier;
