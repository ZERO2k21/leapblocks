import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import type { ClassData, PredictionResult, TFClassifierReturn } from '../types';

/**
 * TF.js + MobileNet + KNN (shared logic)
 * Reusable hook for image-based classifiers
 */
function useTFClassifier(): TFClassifierReturn {
  const [model, setModel] = useState<object | null>(null);
  const [classifier, setClassifier] = useState<object | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingProgress, setTrainingProgress] = useState<number>(0);

  const mobileNetRef = useRef<mobilenet.MobileNet | null>(null);
  const knnRef = useRef<knnClassifier.KNNClassifier | null>(null);

  useEffect(() => {
    initializeModels();
    return () => {
      if (mobileNetRef.current) {
        (mobileNetRef.current as { dispose?: () => void }).dispose?.();
      }
      if (knnRef.current) {
        (knnRef.current as { dispose?: () => void }).dispose?.();
      }
    };
  }, []);

  const initializeModels = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const mobilenetModel = await mobilenet.load();
      mobileNetRef.current = mobilenetModel;

      const knn = knnClassifier.create();
      knnRef.current = knn;

      setModel(mobilenetModel as unknown as object);
      setClassifier(knn as unknown as object);
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addExample = async (
    imageElement: HTMLCanvasElement | HTMLImageElement,
    classId: number
  ): Promise<void> => {
    if (!mobileNetRef.current || !knnRef.current) {
      throw new Error('Models not loaded');
    }

    const activation = mobileNetRef.current.infer(imageElement, true);

    knnRef.current.addExample(activation, classId);

    activation.dispose();
  };

  const train = async (classes: ClassData[]): Promise<boolean> => {
    setIsTraining(true);
    setTrainingProgress(0);

    try {
      knnRef.current!.clearAllClasses();

      let totalSamples = 0;
      classes.forEach((cls) => {
        totalSamples += cls.samples.length;
      });

      let processedSamples = 0;

      for (const cls of classes) {
        for (const sample of cls.samples) {
          if (sample.image) {
            await addExample(sample.image, cls.id);
          }
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

  const predict = async (
    imageElement: HTMLCanvasElement | HTMLImageElement
  ): Promise<PredictionResult> => {
    if (!mobileNetRef.current || !knnRef.current) {
      throw new Error('Models not loaded');
    }

    if (knnRef.current.getNumClasses() === 0) {
      throw new Error('Model not trained');
    }

    const activation = mobileNetRef.current.infer(imageElement, true);

    const result = await knnRef.current.predictClass(activation);

    activation.dispose();

    const confidences: Record<string, number> = {};
    for (const [classId, confidence] of Object.entries(result.confidences)) {
      confidences[classId] = confidence;
    }

    const topEntry = Object.entries(confidences).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      label: topEntry ? topEntry[0] : '',
      confidences,
    };
  };

  const saveModel = (): object | null => {
    if (!knnRef.current) return null;
    return knnRef.current.getClassifierDataset() as object;
  };

  const loadModel = (dataset: object): void => {
    if (!knnRef.current) return;
    knnRef.current.setClassifierDataset(
      dataset as { [label: string]: tf.Tensor2D }
    );
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
