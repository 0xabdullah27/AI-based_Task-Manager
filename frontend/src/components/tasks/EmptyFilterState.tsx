/**
 * EmptyFilterState component - Shows when filters return no results
 * Spec: 002-todo-organization-features
 * Task: T092
 */

interface EmptyFilterStateProps {
  message: string;
  onClearFilters: () => void;
}

export function EmptyFilterState({ message, onClearFilters }: EmptyFilterStateProps) {
  return (
    <div className="text-center py-12">
      <svg
        className="mx-auto h-12 w-12 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-foreground">{message}</h3>
      <div className="mt-6">
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex items-center rounded-md border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        >
          Clear all filters
        </button>
      </div>
    </div>
  );
}
