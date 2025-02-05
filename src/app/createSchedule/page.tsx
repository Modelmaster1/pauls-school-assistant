"use client";

import { useState } from "react";
import { ScheduleEntry, WeeklySchedule } from "../models";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";

export default function CreateSchedulePage() {
  const [scheduleA, setScheduleA] = useState<WeeklySchedule>({
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: []
  });

  const [scheduleB, setScheduleB] = useState<WeeklySchedule>({
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: []
  });

  return (
    <main className="min-h-full p-5">
      <div className="mb-5 flex w-full flex-col items-center">
        <h1 className="text-2xl font-bold">Create Schedule</h1>
      </div>

      <Tabs defaultValue="a" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 mx-auto mb-4">
          <TabsTrigger value="a">Week A</TabsTrigger>
          <TabsTrigger value="b">Week B</TabsTrigger>
        </TabsList>

        <TabsContent value="a" className="w-full">
          <WeekScheduleEditor schedule={scheduleA} setSchedule={setScheduleA} />
        </TabsContent>

        <TabsContent value="b" className="w-full">
          <WeekScheduleEditor schedule={scheduleB} setSchedule={setScheduleB} />
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex justify-center">
        <Button onClick={() => console.log({ scheduleA, scheduleB })}>
          Save Schedule
        </Button>
      </div>
    </main>
  );
}

function WeekScheduleEditor({
  schedule,
  setSchedule
}: {
  schedule: WeeklySchedule;
  setSchedule: (schedule: WeeklySchedule) => void;
}) {
  const handleAddEntry = (day: string) => {
    const newEntry: ScheduleEntry = {
      subject: "",
      periods: [1],
      teacher: "",
      room: "",
      weekDay: day as "mon" | "tue" | "wed" | "thu" | "fri"
    };

    setSchedule({
      ...schedule,
      [day]: [...schedule[day as keyof WeeklySchedule], newEntry]
    });
  };

  const handleUpdateEntry = (day: string, index: number, updatedEntry: ScheduleEntry) => {
    const updatedEntries = [...schedule[day as keyof WeeklySchedule]];
    updatedEntries[index] = updatedEntry;
    setSchedule({
      ...schedule,
      [day]: updatedEntries
    });
  };

  const handleDeleteEntry = (day: string, index: number) => {
    const updatedEntries = [...schedule[day as keyof WeeklySchedule]];
    updatedEntries.splice(index, 1);
    setSchedule({
      ...schedule,
      [day]: updatedEntries
    });
  };

  return (
    <div className="flex min-h-full w-full justify-start gap-4 overflow-x-auto lg:justify-center">
      {Object.entries(schedule).map(([day, entries]) => (
        <DayColumn
          key={day}
          day={day}
          entries={entries}
          onAddEntry={() => handleAddEntry(day)}
          onUpdateEntry={(index, entry) => handleUpdateEntry(day, index, entry)}
          onDeleteEntry={(index) => handleDeleteEntry(day, index)}
        />
      ))}
    </div>
  );
}

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Trash2 } from "lucide-react";

function DayColumn({
  day,
  entries,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry
}: {
  day: string;
  entries: ScheduleEntry[];
  onAddEntry: () => void;
  onUpdateEntry: (index: number, entry: ScheduleEntry) => void;
  onDeleteEntry: (index: number) => void;
}) {
  const dayNames = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday"
  };

  return (
    <div className="h-full w-full" style={{ minWidth: "200px", maxWidth: "300px" }}>
      <div className="flex w-full flex-col gap-4 rounded-2xl border p-4">
        <div className="flex w-full items-center justify-between">
          <div className="text-base font-medium">{dayNames[day as keyof typeof dayNames]}</div>
          <Button variant="ghost" size="icon" onClick={onAddEntry}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          {entries.map((entry, index) => (
            <div key={index} className="rounded-lg border p-3">
              <div className="flex justify-between mb-2">
                <Label>Subject</Label>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteEntry(index)}
                  className="h-6 w-6"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <Input
                  value={entry.subject}
                  onChange={(e) =>
                    onUpdateEntry(index, { ...entry, subject: e.target.value })
                  }
                  placeholder="Subject"
                />
                <Input
                  value={entry.periods.join(", ")}
                  onChange={(e) =>
                    onUpdateEntry(index, {
                      ...entry,
                      periods: e.target.value
                        .split(",")
                        .map((n) => parseInt(n.trim()))
                        .filter((n) => !isNaN(n))
                    })
                  }
                  placeholder="Periods (e.g. 1, 2)"
                />
                <Input
                  value={entry.teacher}
                  onChange={(e) =>
                    onUpdateEntry(index, { ...entry, teacher: e.target.value })
                  }
                  placeholder="Teacher"
                />
                <Input
                  value={entry.room}
                  onChange={(e) =>
                    onUpdateEntry(index, { ...entry, room: e.target.value })
                  }
                  placeholder="Room"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}