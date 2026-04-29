/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import { useState, useCallback } from 'react';
import { ClassData, Sample } from '../../../../types/neura.types';

export function useImageClassifier() {
    const [classes, setClasses] = useState<ClassData[]>([
        {
            id: '1',
            name: 'class1',
            color: 'red',
            samples: [],
        },
        {
            id: '2',
            name: 'class2',
            color: 'emerald',
            samples: [],
        },
    ]);

    const [isTraining, setIsTraining] = useState(false);
    const [accuracy, setAccuracy] = useState<number>();

    const addClass = useCallback(() => {
        const colors = ['red', 'emerald', 'blue', 'yellow', 'purple', 'pink', 'orange', 'teal'];
        const newClass: ClassData = {
            id: Date.now().toString(),
            name: `class${classes.length + 1}`,
            color: colors[classes.length % colors.length],
            samples: [],
        };
        setClasses((prev) => [...prev, newClass]);
    }, [classes.length]);

    const deleteClass = useCallback((classId: string) => {
        setClasses((prev) => prev.filter((c) => c.id !== classId));
    }, []);

    const renameClass = useCallback((classId: string, newName: string) => {
        setClasses((prev) =>
            prev.map((c) => (c.id === classId ? { ...c, name: newName } : c))
        );
    }, []);

    const addSample = useCallback((classId: string, imageData: string) => {
        const newSample: Sample = {
            id: Date.now().toString(),
            type: 'image',
            data: imageData,
            timestamp: Date.now(),
        };
        setClasses((prev) =>
            prev.map((c) =>
                c.id === classId ? { ...c, samples: [...c.samples, newSample] } : c
            )
        );
    }, []);

    const removeSample = useCallback((classId: string, sampleId: string) => {
        setClasses((prev) =>
            prev.map((c) =>
                c.id === classId
                    ? { ...c, samples: c.samples.filter((s) => s.id !== sampleId) }
                    : c
            )
        );
    }, []);

    const trainModel = useCallback(() => {
        setIsTraining(true);
        // Simulate training with timeout
        setTimeout(() => {
            setIsTraining(false);
            // Random accuracy between 80-100%
            setAccuracy(Math.floor(Math.random() * 20) + 80);
        }, 3000);
    }, []);

    const getTotalSamples = useCallback(() => {
        return classes.reduce((total, c) => total + c.samples.length, 0);
    }, [classes]);

    const canTrain = useCallback(() => {
        // Need at least 2 classes with at least 5 samples each
        return (
            classes.length >= 2 &&
            classes.every((c) => c.samples.length >= 5)
        );
    }, [classes]);

    return {
        classes,
        isTraining,
        accuracy,
        addClass,
        deleteClass,
        renameClass,
        addSample,
        removeSample,
        trainModel,
        getTotalSamples,
        canTrain,
    };
}
