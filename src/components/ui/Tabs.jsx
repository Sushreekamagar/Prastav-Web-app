export default function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeTab === tab.id
              ? 'bg-white text-prastav-800 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tab.label}
          {tab.count != null && (
            <span className="ml-1.5 rounded-full bg-prastav-100 px-1.5 py-0.5 text-xs text-prastav-700">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
