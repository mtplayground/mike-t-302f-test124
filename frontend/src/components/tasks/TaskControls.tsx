import type { TaskListBucket, TaskListFilter, TaskListSort, TaskListStatus } from '../../api';

type FilterBarProps = {
  filter: TaskListFilter;
  onChange: (filter: TaskListFilter) => void;
};

type SortControlsProps = {
  onChange: (sort: TaskListSort) => void;
  sort: TaskListSort;
};

const statusOptions: Array<{ label: string; value: TaskListStatus }> = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
];

const bucketOptions: Array<{ label: string; value: TaskListBucket }> = [
  { label: 'All dates', value: 'all' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Today', value: 'today' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'No date', value: 'none' },
];

const sortOptions: Array<{ label: string; value: string; sort: TaskListSort }> = [
  {
    label: 'Created date',
    value: 'createdAt:desc',
    sort: { field: 'createdAt', direction: 'desc' },
  },
  {
    label: 'Due date ascending',
    value: 'dueDate:asc',
    sort: { field: 'dueDate', direction: 'asc' },
  },
  {
    label: 'Due date descending',
    value: 'dueDate:desc',
    sort: { field: 'dueDate', direction: 'desc' },
  },
];

function statusButtonClass(isSelected: boolean): string {
  return isSelected
    ? 'bg-slate-950 text-white'
    : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950';
}

function sortValue(sort: TaskListSort): string {
  return `${sort.field ?? 'createdAt'}:${sort.direction ?? 'desc'}`;
}

export function FilterBar({ filter, onChange }: FilterBarProps) {
  const selectedStatus = filter.status ?? 'all';
  const selectedBucket = filter.bucket ?? 'all';

  return (
    <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem] md:items-end">
        <div>
          <p className="text-sm font-medium text-slate-700">Status</p>
          <div className="mt-2 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                aria-pressed={selectedStatus === option.value}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${statusButtonClass(
                  selectedStatus === option.value,
                )}`}
                type="button"
                onClick={() => onChange({ ...filter, status: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Due bucket</span>
          <select
            className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/20"
            value={selectedBucket}
            onChange={(event) =>
              onChange({ ...filter, bucket: event.target.value as TaskListBucket })
            }
          >
            {bucketOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

export function SortControls({ onChange, sort }: SortControlsProps) {
  return (
    <section className="mb-4 flex justify-end">
      <label className="block w-full sm:w-56">
        <span className="text-sm font-medium text-slate-700">Sort by</span>
        <select
          className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/20"
          value={sortValue(sort)}
          onChange={(event) => {
            const option = sortOptions.find((item) => item.value === event.target.value);

            if (option) {
              onChange(option.sort);
            }
          }}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
