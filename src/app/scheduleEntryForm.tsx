"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { ScheduleEntry, SubjectInfo } from "./models";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { useMediaQuery } from "@uidotdev/usehooks";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { Plus } from "lucide-react";
import { getSubjectInfo } from "~/server/getSchedule";

export default function ScheduleEntryForm({
  isOpen,
  setIsOpen,
  addFunction,
  oldData = null,
  deleteFunction,
}: {
  isOpen: boolean;
  oldData?: ScheduleEntry | null;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  addFunction: (newItem: ScheduleEntry, info?: SubjectInfo) => void;
  deleteFunction: () => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return isDesktop ? (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Schedule Entry</DialogTitle>
        </DialogHeader>
        <FormContent
          deleteFunction={deleteFunction}
          oldData={oldData}
          addFunction={addFunction}
        />
      </DialogContent>
    </Dialog>
  ) : (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add New Schedule Entry</DrawerTitle>
        </DrawerHeader>
        <FormContent
          deleteFunction={deleteFunction}
          oldData={oldData}
          addFunction={addFunction}
        />
      </DrawerContent>
    </Drawer>
  );
}

function FormContent({
  addFunction,
  oldData,
  deleteFunction,
}: {
  addFunction: (newItem: ScheduleEntry, info?: SubjectInfo) => void;
  oldData: ScheduleEntry | null;
  deleteFunction: () => void;
}) {
  const [currentItem, setCurrentItem] = useState<ScheduleEntry | null>(oldData);
  const [subjectInFocus, setSubjectInFocus] = useState<boolean>(false);
  const [subjectInfoData, setSubjectInfoData] = useState<SubjectInfo[]>([]);
  const [weekType, setWeekType] = useState<"both" | "a" | "b">(
    oldData?.weekType ?? "both",
  );
  const [startPeriod, setStartPeriod] = useState<number>(
    oldData?.periods[0] ?? 1,
  );
  const [duration, setDuration] = useState<number>(
    oldData?.periods[1] && oldData.periods[0]
      ? oldData?.periods[1] - oldData?.periods[0] + 1
      : 2,
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    getSubjectInfo().then((data) => {
      setSubjectInfoData(data);
    });
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!currentItem?.subject) {
      newErrors.subject = "Subject is required";
    }

    if (!currentItem?.teacher) {
      newErrors.teacher = "Teacher is required";
    } else if (currentItem.teacher.length < 2) {
      newErrors.teacher = "Teacher name must be at least 2 characters";
    }

    if (!currentItem?.room) {
      newErrors.room = "Room is required";
    }

    if (startPeriod + duration - 1 > 13) {
      newErrors.duration = "Duration exceeds available periods";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem || !validateForm()) return;

    const formattedRoom = currentItem.room
      .toUpperCase()
      .replace(/[^A-B0-9.]/g, "");

    const entry = {
      ...currentItem,
      periods: [startPeriod, startPeriod + duration - 1],
      room: formattedRoom,
      weekType,
    };

    console.log("New Schedule Entry:", entry);
    addFunction(
      entry,
      subjectInfoData.find((item) => item.abbreviation === currentItem.subject),
    );
  };

  const periodOptions = Array.from({ length: 13 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-1">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-2">
          <Label>Week Type</Label>
          <div className="flex gap-2">
            {["both", "a", "b"].map((type) => (
              <Button
                key={type}
                type="button"
                variant={weekType === type ? "default" : "outline"}
                onClick={() => setWeekType(type as "both" | "a" | "b")}
                className="flex-1"
              >
                {type.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="subject">Subject</Label>
          <div className="relative">
            <Input
              list="subjects"
              id="subject"
              value={currentItem?.subject ?? ""}
              onChange={(e) => {
                setCurrentItem((prev) => ({
                  ...prev,
                  subject: e.target.value,
                }));
                if (errors.subject) {
                  setErrors((prev) => ({ ...prev, subject: "" }));
                }
              }}
              onFocus={() => setSubjectInFocus(true)}
              className={errors.subject ? "border-red-500" : ""}
              required
              autoComplete="off"
            />
            <div className="mt-1 max-h-40 w-full overflow-auto rounded-md bg-black shadow-lg">
              {subjectInfoData
                .filter((subject) => {
                  const subjectSearch = currentItem?.subject ?? "";
                  if (subjectSearch.length < 0) return true;
                  if (!subjectInFocus) return false;
                  return (
                    subject.abbreviation
                      .toLowerCase()
                      .includes(subjectSearch.toLowerCase()) ||
                    (subject.name &&
                      subject.name
                        .toLowerCase()
                        .includes(subjectSearch.toLowerCase())) ||
                    (subject.nameDe &&
                      subject.nameDe
                        .toLowerCase()
                        .includes(subjectSearch.toLowerCase()))
                  );
                })
                .map((subject) => (
                  <div
                    key={subject.abbreviation}
                    className="cursor-pointer px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    onClick={() => {
                      setCurrentItem((prev) => ({
                        ...prev,
                        subject: subject.abbreviation,
                      }));
                      setSubjectInFocus(false);

                      if (errors.subject) {
                        setErrors((prev) => ({ ...prev, subject: "" }));
                      }
                    }}
                  >
                    <div className="font-medium">{subject.abbreviation}</div>
                    <div className="text-sm text-neutral-500">
                      {subject.name || subject.nameDe || subject.abbreviation}
                    </div>
                  </div>
                ))}
            </div>
            {errors.subject && (
              <p className="mt-1 text-sm text-red-500">{errors.subject}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Label htmlFor="period1">Start Period</Label>

          <div className="flex justify-center gap-3">
            <select
              id="period1"
              value={startPeriod}
              onChange={(e) => setStartPeriod(parseInt(e.target.value))}
              className="w-1/3 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:ring-neutral-300"
              required
            >
              {periodOptions.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>

            <div className="flex w-full flex-col gap-2">
              <div className="flex justify-between">
                <Label>Duration (periods)</Label>
                <span className="text-muted-foreground text-sm">
                  Ends at period {startPeriod + duration - 1}
                </span>
              </div>
              <Slider
                value={[duration]}
                onValueChange={([value]) => setDuration(value)}
                min={1}
                max={14 - startPeriod}
                step={1}
                className="mt-2"
              />
              {errors.duration && (
                <p className="mt-1 text-sm text-red-500">{errors.duration}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="teacher">Teacher</Label>
          <Input
            id="teacher"
            value={currentItem?.teacher ?? ""}
            onChange={(e) => {
              setCurrentItem((prev) => ({ ...prev, teacher: e.target.value }));
              if (errors.teacher) {
                setErrors((prev) => ({ ...prev, teacher: "" }));
              }
            }}
            className={errors.teacher ? "border-red-500" : ""}
            required
          />
          {errors.teacher && (
            <p className="mt-1 text-sm text-red-500">{errors.teacher}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="room">Room (e.g., A3.12 or B5.12)</Label>
          <Input
            id="room"
            value={currentItem?.room ?? ""}
            onChange={(e) => {
              setCurrentItem((prev) => ({ ...prev, room: e.target.value }));
              if (errors.room) {
                setErrors((prev) => ({ ...prev, room: "" }));
              }
            }}
            pattern="[AaBb][0-9]\.[0-9]{2}"
            className={errors.room ? "border-red-500" : ""}
            required
          />
          {errors.room && (
            <p className="mt-1 text-sm text-red-500">{errors.room}</p>
          )}
        </div>

        <Button type="submit" className="w-full">
          Create Entry
        </Button>
      </form>
      {oldData && (
        <div className="flex justify-center w-full">
          <Button variant="link" onClick={deleteFunction} className="px-5" style={{color: "red"}}>
            Delete Entry
          </Button>
        </div>
      )}
    </div>
  );
}
