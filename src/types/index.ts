export type ZoomLevel = 'snapshot' | 'standard' | 'deep';

export interface ViewConfig {
    defaultZoom: ZoomLevel;
    availableViews: string[];
}
