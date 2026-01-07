import { useMemo } from 'react';
import { useTestResults } from '../TestResultContext';
import { TEST_CASES } from '../TestCaseRegistry';

export function TestControls() {
  const { filter, setFilter, summary, runMultipleTests, clearResults, isAnyRunning, cancel } = useTestResults();

  const categories = useMemo(() => Array.from(new Set(TEST_CASES.map(tc => tc.category))), []);
  const priorities = useMemo(() => Array.from(new Set(TEST_CASES.map(tc => tc.priority))), []);
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    TEST_CASES.forEach(tc => tc.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, []);

  const filteredTestCases = useMemo(() => {
    return TEST_CASES.filter(tc => {
      if (filter.categories.length > 0 && !filter.categories.includes(tc.category)) return false;
      if (filter.priorities.length > 0 && !filter.priorities.includes(tc.priority)) return false;
      if (filter.tags.length > 0 && !filter.tags.some(tag => tc.tags.includes(tag))) return false;
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        if (!tc.name.toLowerCase().includes(searchLower) && !tc.description.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
  }, [filter]);

  const handleCategoryToggle = (category: string) => {
    setFilter({
      categories: filter.categories.includes(category)
        ? filter.categories.filter(c => c !== category)
        : [...filter.categories, category],
    });
  };

  const handlePriorityToggle = (priority: string) => {
    setFilter({
      priorities: filter.priorities.includes(priority)
        ? filter.priorities.filter(p => p !== priority)
        : [...filter.priorities, priority],
    });
  };

  const handleTagToggle = (tag: string) => {
    setFilter({
      tags: filter.tags.includes(tag)
        ? filter.tags.filter(t => t !== tag)
        : [...filter.tags, tag],
    });
  };

  const handleStatusToggle = (status: string) => {
    setFilter({
      statuses: filter.statuses.includes(status as any)
        ? filter.statuses.filter(s => s !== status)
        : [...filter.statuses, status as any],
    });
  };

  const handleRunAll = () => {
    runMultipleTests(TEST_CASES);
  };

  const handleRunFiltered = () => {
    runMultipleTests(filteredTestCases);
  };

  return (
    <div className="bg-surface border border-default rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary">Test Controls</h2>
        <div className="text-sm text-muted">
          <span className="font-semibold">Total:</span> {summary.total} |{' '}
          <span className="text-green-600 font-semibold">Passed:</span> {summary.passed} |{' '}
          <span className="text-red-600 font-semibold">Failed:</span> {summary.failed} |{' '}
          <span className="text-yellow-600 font-semibold">Running:</span> {summary.running} |{' '}
          <span className="text-gray-600 font-semibold">Pending:</span> {summary.pending}
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-6">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-semibold mb-2">Categories</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <label key={category} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filter.categories.includes(category)}
                  onChange={() => handleCategoryToggle(category)}
                  className="rounded"
                />
                <span className="text-sm">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-semibold mb-2">Priorities</label>
          <div className="flex flex-wrap gap-2">
            {priorities.map(priority => (
              <label key={priority} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filter.priorities.includes(priority)}
                  onChange={() => handlePriorityToggle(priority)}
                  className="rounded"
                />
                <span className="text-sm">{priority}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tag Filter */}
        <div>
          <label className="block text-sm font-semibold mb-2">Tags (showing first 10)</label>
          <div className="flex flex-wrap gap-2">
            {allTags.slice(0, 10).map(tag => (
              <label key={tag} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filter.tags.includes(tag)}
                  onChange={() => handleTagToggle(tag)}
                  className="rounded"
                />
                <span className="text-sm">{tag}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-semibold mb-2">Status</label>
          <div className="flex flex-wrap gap-2">
            {(['pending', 'running', 'passed', 'failed'] as const).map(status => (
              <label key={status} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filter.statuses.includes(status)}
                  onChange={() => handleStatusToggle(status)}
                  className="rounded"
                />
                <span className="text-sm capitalize">{status}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm font-semibold mb-2">Search</label>
          <input
            type="text"
            value={filter.searchText}
            onChange={(e) => setFilter({ searchText: e.target.value })}
            placeholder="Search test cases..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleRunAll}
          disabled={isAnyRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Run All ({TEST_CASES.length})
        </button>
        <button
          onClick={handleRunFiltered}
          disabled={isAnyRunning || filteredTestCases.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Run Filtered ({filteredTestCases.length})
        </button>
        <button
          onClick={clearResults}
          disabled={isAnyRunning}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear Results
        </button>
        {isAnyRunning && (
          <button
            onClick={cancel}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

