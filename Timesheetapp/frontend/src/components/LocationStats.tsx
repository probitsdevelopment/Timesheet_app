import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeEntry } from "@/store/types";

interface LocationStatsProps {
  entries: TimeEntry[];
}

export const LocationStats = ({ entries }: LocationStatsProps) => {
  // Get unique dates for office and WFH entries
  const officeDates = new Set(
    entries
      .filter((e) => e.work_location === 'office')
      .map((e) => e.date)
  );

  const wfhDates = new Set(
    entries
      .filter((e) => e.work_location === 'work_from_home')
      .map((e) => e.date)
  );

  const officeDays = officeDates.size;
  const wfhDays = wfhDates.size;
  const totalDays = officeDays + wfhDays;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardDescription>Office Days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{officeDays}</div>
          <p className="text-xs text-muted-foreground mt-1">🏢 Days at office</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardDescription>Work from Home Days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{wfhDays}</div>
          <p className="text-xs text-muted-foreground mt-1">🏠 Days remote work</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardDescription>Total Days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDays}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalDays > 0 ? `${Math.round((officeDays / totalDays) * 100)}% office` : 'No entries'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationStats;
