'use client';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="admin-search-wrapper">
      <input
        type="text"
        placeholder="Search by email..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="admin-input"
      />
    </div>
  );
}