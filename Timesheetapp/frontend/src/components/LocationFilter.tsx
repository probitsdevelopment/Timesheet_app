import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LocationFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export const LocationFilter = ({ value, onChange }: LocationFilterProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Filter by location" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Locations</SelectItem>
        <SelectItem value="office">
          🏢 Office
        </SelectItem>
        <SelectItem value="work_from_home">
          🏠 Work from Home
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default LocationFilter;
