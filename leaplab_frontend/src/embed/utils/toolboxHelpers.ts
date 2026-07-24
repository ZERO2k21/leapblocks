export const MORE_BLOCKS_CATEGORY_NAME = 'More Blocks';
export const MORE_BLOCKS_CATEGORY_COLOUR = '#94A3B8';

export const isToolboxCategory = (category: any) =>
    category?.kind === 'leapbloxCategory' ||
    category?.kind === 'leapBloxCategory' ||
    category?.kind === 'category';

export const normalizeCategoryClassName = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export const createFlyoutCategoryLabel = (text: string) => ({
    kind: 'label',
    text,
    'web-class': `category-header category-header-${normalizeCategoryClassName(text)}`
});

export const createFlyoutSectionLabel = (text: string, className: string) => ({
    kind: 'label',
    text,
    'web-class': `category-subheader ${className}`
});

export const createMonitorReporterPlaceholder = (
    blockType: string,
    fieldName: string,
    fieldValue: string,
    checked: boolean,
    gap?: number
) => ({
    kind: 'block',
    type: blockType,
    ...(typeof gap === 'number' ? { gap } : {}),
    fields: {
        CHECK: checked ? 'TRUE' : 'FALSE',
        [fieldName]: fieldValue
    }
});

export const createMoreBlocksCategory = () => ({
    kind: 'leapbloxCategory',
    name: MORE_BLOCKS_CATEGORY_NAME,
    colour: MORE_BLOCKS_CATEGORY_COLOUR,
    custom: 'LEAP_MOREBLOCKS'
});

export const withCategoryHeaders = (contents: any[]) => {
    return contents.map((category: any) => {
        if (!isToolboxCategory(category) || !Array.isArray(category.contents)) {
            return category;
        }

        return {
            ...category,
            contents: [createFlyoutCategoryLabel(category.name), ...category.contents]
        };
    });
};
