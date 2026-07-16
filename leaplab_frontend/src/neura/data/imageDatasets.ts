/**
 * Local image dataset manifest for NEURA.
 * Images are stored in public/assets/neura-datasets/ and served via relative URLs.
 * Works fully offline / on web without external API calls.
 */

export interface DatasetImage {
    filename: string
    label: string
}

export interface DatasetSubcategory {
    id: string
    name: string
    emoji: string
    color: string
    images: DatasetImage[]
}

export interface DatasetCategory {
    id: string
    name: string
    emoji: string
    description: string
    color: string
    subcategories: DatasetSubcategory[]
}

const BASE_PATH = '/assets/neura-datasets'

function generateImages(subcategoryId: string, count: number): DatasetImage[] {
    return Array.from({ length: count }, (_, i) => ({
        filename: `${subcategoryId}_${String(i + 1).padStart(2, '0')}.jpg`,
        label: subcategoryId
    }))
}

export const DATASET_CATEGORIES: DatasetCategory[] = [
    {
        id: 'animals',
        name: 'Animals',
        emoji: '🐾',
        description: 'Cats, dogs, birds and more!',
        color: '#10B981',
        subcategories: [
            { id: 'cat', name: 'Cat', emoji: '🐱', color: '#F97316', images: generateImages('cat', 10) },
            { id: 'dog', name: 'Dog', emoji: '🐶', color: '#3B82F6', images: generateImages('dog', 10) },
            { id: 'bird', name: 'Bird', emoji: '🐦', color: '#EC4899', images: generateImages('bird', 10) }
        ]
    },
    {
        id: 'vehicles',
        name: 'Vehicles',
        emoji: '🚗',
        description: 'Cars, bikes and transport!',
        color: '#3B82F6',
        subcategories: [
            { id: 'car', name: 'Car', emoji: '🚗', color: '#EF4444', images: generateImages('car', 10) },
            { id: 'bicycle', name: 'Bicycle', emoji: '🚲', color: '#8B5CF6', images: generateImages('bicycle', 10) }
        ]
    },
    {
        id: 'food',
        name: 'Food',
        emoji: '🍎',
        description: 'Fruits, veggies and treats!',
        color: '#F59E0B',
        subcategories: [
            { id: 'apple', name: 'Apple', emoji: '🍎', color: '#EF4444', images: generateImages('apple', 10) },
            { id: 'banana', name: 'Banana', emoji: '🍌', color: '#F59E0B', images: generateImages('banana', 10) }
        ]
    },
    {
        id: 'objects',
        name: 'Objects',
        emoji: '📦',
        description: 'Everyday items and things!',
        color: '#8B5CF6',
        subcategories: [
            { id: 'cup', name: 'Cup', emoji: '☕', color: '#06B6D4', images: generateImages('cup', 10) },
            { id: 'book', name: 'Book', emoji: '📖', color: '#10B981', images: generateImages('book', 10) }
        ]
    }
]

/**
 * Get the full URL path for a dataset image.
 */
export function getDatasetImagePath(categoryId: string, subcategoryId: string, filename: string): string {
    return `${BASE_PATH}/${categoryId}/${subcategoryId}/${filename}`
}

/**
 * Get all images for a subcategory.
 */
export function getSubcategoryImages(categoryId: string, subcategoryId: string): DatasetImage[] {
    const category = DATASET_CATEGORIES.find(c => c.id === categoryId)
    if (!category) return []
    const sub = category.subcategories.find(s => s.id === subcategoryId)
    return sub?.images || []
}

/**
 * Total images available across all categories.
 */
export function getTotalDatasetImages(): number {
    return DATASET_CATEGORIES.reduce((total, cat) =>
        total + cat.subcategories.reduce((st, sub) => st + sub.images.length, 0), 0)
}
