export type DataFormat = 'json' | 'sqlite' | 'csv' | 'unknown';

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
  {
    id: 'csv',
    name: 'CSV / TSV',
    description: 'Comma and Tab Separated Values',
    extensions: ['.csv', '.tsv'],
  },
];
