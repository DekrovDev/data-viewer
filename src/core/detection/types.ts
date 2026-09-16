export type DataFormat = 'json' | 'sqlite' | 'unknown';

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
  {
    id: 'sqlite',
    name: 'SQLite',
    description: 'SQLite 3 Relational Database',
    extensions: ['.db', '.sqlite', '.sqlite3'],
  },
];
