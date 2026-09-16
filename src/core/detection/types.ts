export type DataFormat = 'json' | 'unknown';

export interface FormatMetadata {
  id: DataFormat;
  name: string;
  description: string;
  extensions: string[];
}

export const SUPPORTED_FORMATS: FormatMetadata[] = [
  {
    id: 'json',
    name: 'JSON',
    description: 'JavaScript Object Notation',
    extensions: ['.json'],
  },
];
