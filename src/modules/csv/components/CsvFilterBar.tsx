import React, { useState } from 'react';
import { CsvColumn, CsvFilter, CsvFilterOperator } from '../types/csv';
import { Button } from '../../../shared/components/ui/button';
import { Plus, X, Filter } from 'lucide-react';

interface CsvFilterBarProps {
  columns: CsvColumn[];
  filters: CsvFilter[];
  onAddFilter: (filter: CsvFilter) => void;
  onRemoveFilter: (columnId: string) => void;
  onClearAll: () => void;
  onCloseBar: () => void;
}

const OPERATORS: Array<{ value: CsvFilterOperator; label: string; numericOnly?: boolean }> = [
  { value: 'contains', label: 'contains' },
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'not equals' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
  { value: 'gt', label: '> (greater than)', numericOnly: true },
  { value: 'gte', label: '>= (greater or equal)', numericOnly: true },
  { value: 'lt', label: '< (less than)', numericOnly: true },
  { value: 'lte', label: '<= (less or equal)', numericOnly: true },
];

export const CsvFilterBar: React.FC<CsvFilterBarProps> = ({
  columns,
  filters,
  onAddFilter,
  onRemoveFilter,
  onClearAll,
  onCloseBar,
}) => {
  const [selectedColId, setSelectedColId] = useState<string>(columns[0]?.id || '');
  const [selectedOp, setSelectedOp] = useState<CsvFilterOperator>('contains');
  const [filterVal, setFilterVal] = useState('');

  const selectedCol = columns.find((c) => c.id === selectedColId);
  const isNumericCol = selectedCol?.inferredType === 'number';

  const availableOperators = OPERATORS.filter((op) => !op.numericOnly || isNumericCol);

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedColId) return;
    const requiresVal = selectedOp !== 'is_empty' && selectedOp !== 'is_not_empty';
    if (requiresVal && !filterVal.trim()) return;

    onAddFilter({
      columnId: selectedColId,
      operator: selectedOp,
      value: filterVal.trim(),
    });
    setFilterVal('');
  };

  return (
    <div className="border-b border-border bg-card/60 px-4 py-2 flex flex-col gap-2 select-none text-xs">
      {/* Builder Row */}
      <form onSubmit={handleApply} className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
          <Filter className="w-3.5 h-3.5 text-primary" />
          <span>Filter:</span>
        </div>

        {/* Column Select */}
        <select
          value={selectedColId}
          onChange={(e) => setSelectedColId(e.target.value)}
          aria-label="Filter column"
          className="bg-muted border border-border text-foreground rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {columns.map((col) => (
            <option key={col.id} value={col.id}>
              {col.name} ({col.inferredType})
            </option>
          ))}
        </select>

        {/* Operator Select */}
        <select
          value={selectedOp}
          onChange={(e) => setSelectedOp(e.target.value as CsvFilterOperator)}
          aria-label="Filter operator"
          className="bg-muted border border-border text-foreground rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {availableOperators.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>

        {/* Value Input */}
        {selectedOp !== 'is_empty' && selectedOp !== 'is_not_empty' && (
          <input
            type="text"
            value={filterVal}
            onChange={(e) => setFilterVal(e.target.value)}
            placeholder="Value..."
            className="bg-muted border border-border text-foreground rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring w-40 font-mono"
          />
        )}

        <Button type="submit" variant="default" size="xs" className="gap-1 h-6">
          <Plus className="w-3 h-3" />
          <span>Add</span>
        </Button>

        {filters.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onClearAll}
            className="text-muted-foreground hover:text-foreground h-6"
          >
            Clear all
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="iconXs"
          onClick={onCloseBar}
          className="ml-auto text-muted-foreground hover:text-foreground"
          title="Close filter bar"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </form>

      {/* Active Filter Tags */}
      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-muted-foreground">Active filters:</span>
          {filters.map((f) => {
            const col = columns.find((c) => c.id === f.columnId);
            return (
              <span
                key={f.columnId}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 text-[11px] font-mono"
              >
                <span>{col?.name || f.columnId}</span>
                <span className="text-muted-foreground">{f.operator}</span>
                {f.value && <span className="font-semibold">"{f.value}"</span>}
                <button
                  onClick={() => onRemoveFilter(f.columnId)}
                  className="hover:text-destructive transition-colors ml-0.5"
                  title="Remove filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
