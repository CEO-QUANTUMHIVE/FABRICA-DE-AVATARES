import type { AvatarChipDefinition } from "./types";

interface AvatarChipsProps {
  chips: AvatarChipDefinition[];
  onSelect: (chip: AvatarChipDefinition) => void;
  disabled?: boolean;
}

export const AvatarChips = ({
  chips,
  onSelect,
  disabled = false,
}: AvatarChipsProps) => (
  <div className="avatar-chips" aria-label="Recorrido autoguiado">
    {chips.map((chip, index) => (
      <button
        key={chip.id}
        type="button"
        className="avatar-chip"
        disabled={disabled}
        onClick={() => onSelect(chip)}
      >
        <span className="avatar-chip__index">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span>{chip.label}</span>
      </button>
    ))}
  </div>
);
