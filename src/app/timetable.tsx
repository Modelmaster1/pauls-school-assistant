"use client";
import { cva } from "class-variance-authority";
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AccountData,
  CurrentEntryData,
  CurrentSchedule,
  Notice,
  ScheduleEntry,
  SubjectInfo,
  tintColors,
} from "./models";
import {
  calculatePeriodDuration,
  getTimeDifferenceInMinutes,
} from "../server/timeFunctions";
import { LoadingScheduleScreen } from "./loadingScreens";
import { Button } from "~/components/ui/button";
import { Info, MoveRight, Pen, Plus, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "~/components/ui/drawer";
import { useMediaQuery } from "@uidotdev/usehooks";
import AccountEditDrawer from "./accountEditDrawer";
import { useRouter } from "next/navigation";
import ScheduleEntryForm from "./scheduleEntryForm";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  addNewScheduleEntryDB,
  deleteScheduleEntryDB,
  updateScheduleEntryDB,
} from "~/server/updateStaticSchedule";

function calculateMinToPx(min: number) {
  return min * 0.009;
}

export default function Timetable({
  accountData,
  currentSchedule,
  setAccountData,
  setCurrentSchedule, // decides wether we have edit mode or not
  setIsEdit,
}: {
  accountData: AccountData;
  currentSchedule: CurrentSchedule | null;
  setCurrentSchedule: Dispatch<SetStateAction<CurrentSchedule | null>> | null;
  setAccountData: Dispatch<SetStateAction<AccountData | null>>;
  setIsEdit: Dispatch<SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState<boolean>(false);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState<boolean>(false);
  const [weekTypeForEdit, setWeekTypeForEdit] = useState<"a" | "b">("a");
  const [oldDataForEdit, setOldDataForEdit] = useState<CurrentEntryData | null>(
    null,
  );
  const [currentEditDay, setCurrentEditDay] = useState<
    keyof typeof dayModel | null
  >(null);

  function openAddSubject(
    day: keyof typeof dayModel,
    oldData?: CurrentEntryData,
  ) {
    setOldDataForEdit(oldData ?? null);
    setCurrentEditDay(day);
    setIsAddSubjectOpen(true);
  }

  async function onSubjectDelete() {
    if (!setCurrentSchedule) return;
    if (!currentSchedule) return;
    if (!currentEditDay) return;
    if (!oldDataForEdit) return;

    const id = oldDataForEdit.staticData.$id;

    if (!id) return; // might happen, because I kinda screwed up type validation in the scheduleEntryForm

    const otherItems = currentSchedule[currentEditDay].filter(
      (item) => item !== oldDataForEdit,
    );

    setCurrentSchedule((prev) => {
      if (!prev) return prev;
      return { ...prev, [currentEditDay]: otherItems };
    });

    await deleteScheduleEntryDB(id);

    setIsAddSubjectOpen(false);
  }

  async function onAddSubject(newItem: ScheduleEntry, info?: SubjectInfo) {
    if (!setCurrentSchedule) return;
    if (!currentSchedule) return;
    if (!currentEditDay) return;

    const dataModel = {
      ...newItem,
      weekDay: dayModel[currentEditDay].n,
      affectedClass: accountData.year,
    };

    const fullModelWithMetadata = oldDataForEdit
      ? await updateScheduleEntryDB({
          ...dataModel,
          $id: oldDataForEdit.staticData.$id,
        })
      : await addNewScheduleEntryDB(dataModel);

    if (!fullModelWithMetadata) return; // shouldn't happen

    const tempItem: CurrentEntryData = {
      staticData: fullModelWithMetadata,
      generalData: info ?? null,
      dynamicData: null,
    };

    const otherItems = currentSchedule[currentEditDay].filter(
      (item) => item !== oldDataForEdit,
    );

    const mixedResult = [...otherItems, tempItem].sort((a, b) => {
      const aFirstPeriod =
        "staticData" in a
          ? (a.staticData.periods[0] ?? 0)
          : (a.periods[0] ?? 0);
      const bFirstPeriod =
        "staticData" in b
          ? (b.staticData.periods[0] ?? 0)
          : (b.periods[0] ?? 0);

      return aFirstPeriod - bFirstPeriod;
    });

    setCurrentSchedule((prev) => {
      if (!prev) return prev;
      return { ...prev, [currentEditDay]: mixedResult };
    });

    setIsAddSubjectOpen(false);
  }

  return (
    <main className="min-h-full overflow-hidden p-5">
      {!currentSchedule && !setCurrentSchedule && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-neutral-900/70">
          <div className="flex flex-col items-center gap-4">
            <div className="text-lg font-semibold">
              Hmm, looks like we don't have your schedule yet...
            </div>
            <div className="flex gap-3">
              <Button onClick={() => router.push("/?edit=true")}>
                Create my schedule
              </Button>
              <Button
                onClick={() => setIsEditDrawerOpen(true)}
                variant="secondary"
              >
                Edit my data{" "}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute right-8 top-2 flex gap-2">
        <Button
          onClick={() => setIsEditDrawerOpen(true)}
          variant="ghost"
          size="icon"
        >
          <Settings />
        </Button>
      </div>
      <ScheduleEntryForm
        deleteFunction={onSubjectDelete}
        addFunction={onAddSubject}
        isOpen={isAddSubjectOpen}
        setIsOpen={setIsAddSubjectOpen}
        oldData={oldDataForEdit?.staticData}
      />
      <AccountEditDrawer
        setIsEdit={setIsEdit}
        accountData={accountData}
        setAccountData={setAccountData}
        isOpen={isEditDrawerOpen}
        setIsOpen={setIsEditDrawerOpen}
      />
      <div className="mb-5 flex w-full flex-col items-center">
        <div className="text-2xl font-bold">
          {accountData?.year ?? "loading"}{" "}
          {accountData?.lang === "de" ? "Stundenplan" : "Timetable"}
        </div>

        {setCurrentSchedule != null ? (
          <div className="mt-3 flex gap-2">
            <Tabs
              value={weekTypeForEdit}
              onValueChange={(value) =>
                setWeekTypeForEdit(value == "a" ? "a" : "b")
              }
              defaultValue="account"
              className="w-[200px]"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="a">A</TabsTrigger>
                <TabsTrigger value="b">B</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        ) : (
          <div className="text-sm">
            {currentSchedule &&
              `${currentSchedule.dates.mon.getDate()}.${(currentSchedule.dates.mon.getMonth() + 1 < 10 ? "0" : "") + (currentSchedule.dates.mon.getMonth() + 1)}.${currentSchedule.dates.mon.getFullYear()} - ${currentSchedule.dates.fri.getDate()}.${(currentSchedule.dates.fri.getMonth() + 1 < 10 ? "0" : "") + (currentSchedule.dates.fri.getMonth() + 1)}.${currentSchedule.dates.fri.getFullYear()} (${currentSchedule.weekkType.toUpperCase()})`}
          </div>
        )}
      </div>

      {currentSchedule ? (
        <div className="flex min-h-full w-full justify-start gap-0 overflow-x-auto lg:justify-center">
          {Object.keys(dayModel).map((key, i) => (
            <DayColumn
              key={i}
              day={key}
              openAddSubject={openAddSubject}
              editMode={setCurrentSchedule != null}
              lang={accountData.lang}
              schedule={(
                currentSchedule[key as keyof typeof currentSchedule] as (
                  | CurrentEntryData
                  | Notice
                )[]
              ).filter((entry) => {
                if (!setCurrentSchedule) return true;

                if ("staticData" in entry) {
                  if (entry.staticData.weekType === "both") return true;
                  if (entry.staticData.weekType === weekTypeForEdit)
                    return true;
                }

                return false;
              })}
            />
          ))}
        </div>
      ) : (
        <LoadingScheduleScreen />
      )}
    </main>
  );
}

function DayColumn({
  day,
  schedule,
  lang,
  openAddSubject,
  editMode,
}: {
  day: string;
  schedule: (CurrentEntryData | Notice)[];
  lang?: string;
  openAddSubject: (
    day: keyof typeof dayModel,
    oldData?: CurrentEntryData,
  ) => void;
  editMode: boolean;
}) {
  const [dayName, setDayName] = useState<string>(
    lang === "en"
      ? dayModel[day as keyof typeof dayModel].en
      : dayModel[day as keyof typeof dayModel].de,
  );

  function handleEditSubjectEntry(data: CurrentEntryData) {
    openAddSubject(day as keyof typeof dayModel, data);
  }

  return (
    <div
      className="h-full w-full"
      style={{ minWidth: "100px", maxWidth: "200px" }}
    >
      <div className="flex w-full flex-col gap-0 rounded-2xl p-2 md:px-4 md:py-2">
        <div className="mb-4 flex w-full justify-center text-xs md:text-base">
          {dayName}
        </div>

        {Array.isArray(schedule) &&
          schedule.map((entry, i) => (
            <React.Fragment key={i}>
              <FullEntry
                handleEditSubjectEntry={
                  editMode ? handleEditSubjectEntry : undefined
                }
                data={entry}
                isFirst={i === 0}
                entriesInSameTimeFrame={
                  schedule.filter((item) => {
                    if (entry === item) return false;

                    // if both are currententrydata
                    if ("staticData" in item && "staticData" in entry) {
                      return (
                        entry.staticData.periods[0] ===
                        item.staticData.periods[0]
                      );
                    }

                    // if both are notices
                    if ("periods" in item && "periods" in entry) {
                      return entry.periods[0] === item.periods[0];
                    }

                    //if they are not the same type return false
                    return false;
                  }) as CurrentEntryData[] | Notice[]
                }
                nextEntry={schedule[i + 1] ?? null}
              />
            </React.Fragment>
          ))}

        {editMode && (
          <Button
            variant="ghost"
            className="outline-3 mt-3 outline-dashed"
            onClick={() => openAddSubject(day as keyof typeof dayModel)}
          >
            <div className="flex items-center justify-center rounded-xl">
              <Plus />
            </div>
          </Button>
        )}
      </div>
    </div>
  );
}

export function FullEntry({
  data,
  entriesInSameTimeFrame,
  nextEntry,
  isFirst,
  handleEditSubjectEntry,
}: {
  entriesInSameTimeFrame: CurrentEntryData[] | Notice[];
  data: CurrentEntryData | Notice;
  nextEntry: CurrentEntryData | Notice | null;
  isFirst: boolean;
  handleEditSubjectEntry?: (data: CurrentEntryData) => void;
}) {
  const isNotice = !("staticData" in data);
  const nextEntryPeriods = nextEntry
    ? "staticData" in nextEntry
      ? nextEntry.staticData.periods
      : nextEntry.periods
    : null;

  const periods = isNotice ? data.periods : data.staticData.periods;

  const shouldBeHidden = isNotice
    ? figureOutWetherExtraNoticeIsOutOfDate()
    : entriesInSameTimeFrame.length >= 1 &&
      ((nextEntryPeriods && nextEntryPeriods[0]) ?? null) === periods[0];

  const [calculatedDuration, setCalculatedDuration] = useState<number | null>(
    getTimeDifferenceInMinutes(
      periods[periods.length - 1] ?? null,
      (nextEntryPeriods && nextEntryPeriods[0]) ?? null,
      false,
    ),
  ); // for break

  useEffect(() => {
    setCalculatedDuration(
      getTimeDifferenceInMinutes(
        periods[periods.length - 1] ?? null,
        (nextEntryPeriods && nextEntryPeriods[0]) ?? null,
        false,
      ),
    );
  }, [entriesInSameTimeFrame]);

  const [bufferTime, setBufferTime] = useState<number | null>(
    isFirst && periods[0] !== 1
      ? getTimeDifferenceInMinutes(1, periods[0] ?? null, true)
      : null,
  );

  function figureOutWetherExtraNoticeIsOutOfDate() {
    if (entriesInSameTimeFrame.length < 1) return false;

    const orderedEntries = ([...entriesInSameTimeFrame, data] as Notice[]).sort(
      (a, b) => Number(b.createdAt) - Number(a.createdAt),
    );

    return !(orderedEntries[0] === data);
  }

  return (
    <span className="flex flex-col gap-0" style={{ width: "100%" }}>
      {bufferTime && <Break duration={bufferTime} />}
      <Event
        handleEditSubjectEntry={handleEditSubjectEntry}
        otherEnrties={entriesInSameTimeFrame}
        data={data}
        isHidden={shouldBeHidden}
      />
      {calculatedDuration && <Break duration={calculatedDuration} />}
    </span>
  );
}

export const eventColorStyles = cva(
  "rounded-xl text-xs md:text-base outline overflow-hidden outline-1",
  {
    variants: {
      tint: {
        none: "",
        default:
          "bg-[#f8f8f9] dark:bg-[#282828] text-[#666a6d] dark:text-[#b0b2b4] dark:outline-[#b0b2b4]/50",
        red: "bg-red-800/25 text-red-300 outline-red-300",
        orange: "bg-orange-800/25 text-orange-400 dark:text-orange-300",
        blue: "bg-blue-100 dark:bg-cyan-800/30 text-blue-500 dark:text-blue-300",
        green: "bg-green-800/30 text-green-500",
        pink: "bg-pink-900/30 text-pink-400",
        purple:
          "bg-purple-100 dark:bg-purple-800/20 text-purple-500 dark:text-purple-300",
        yellow:
          "bg-yellow-100 dark:bg-yellow-800/30 text-yellow-500 dark:text-yellow-300",
        gray: "text-gray-300/80 bg-gray-500/30",
        white: "bg-neutral-700 text-neutral-300",
        clear:
          "bg-transparent text-neutral-400/70 outline outline-neutral-500/10",
      },
      noticeType: {
        none: "",
        special: "outline-dashed outline-[#666a6d]/80",
        cancelled: "cancelled",
        likelyCancelled: "likelyCancelled",
      },
    },
    defaultVariants: {
      tint: "default",
      noticeType: "none",
    },
  },
);

const dayModel = {
  mon: {
    n: 1,
    en: "Monday",
    de: "Montag",
  },
  tue: {
    n: 2,
    en: "Tuesday",
    de: "Dienstag",
  },
  wed: {
    n: 3,
    en: "Wednesday",
    de: "Mittwoch",
  },
  thu: {
    n: 4,
    en: "Thursday",
    de: "Donnerstag",
  },
  fri: {
    n: 5,
    en: "Friday",
    de: "Freitag",
  },
};

function Event({
  otherEnrties,
  data,
  isHidden,
  handleEditSubjectEntry,
}: {
  data: CurrentEntryData | Notice;
  otherEnrties: CurrentEntryData[] | Notice[];
  isHidden?: boolean;
  handleEditSubjectEntry?: (data: CurrentEntryData) => void;
}) {
  const [width, setWidth] = useState<number>(0);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const itemRef = useRef<HTMLDivElement>(null);

  const isNotice = !("staticData" in data);

  const itemTint = isNotice
    ? null
    : data.dynamicData?.type &&
        ["cancelled", "likelyCancelled", "special"].includes(
          data.dynamicData.type,
        )
      ? "none"
      : data.generalData?.tint;
  const noticeTintType = isNotice ? "special" : data.dynamicData?.type;

  const periods = isNotice ? data.periods : data.staticData.periods;

  const calculatedPeriodDuration = calculatePeriodDuration(periods) ?? 0;
  const dynamicHeight = width * calculateMinToPx(calculatedPeriodDuration);
  const otherEnrtiesString = createConcurrentEventsString();

  function closeInfoPopupAndHandleEditSubjectEntry(data: CurrentEntryData) {
    setIsInfoOpen(false);
    if (!handleEditSubjectEntry) return;
    handleEditSubjectEntry(data);
  }

  useEffect(() => {
    const element = itemRef.current;

    if (!element) return;

    const updateWidth = () => {
      setWidth(element.offsetWidth);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    // Observe the element
    resizeObserver.observe(element);

    // Set the initial width
    updateWidth();

    return () => {
      // Cleanup observer
      resizeObserver.disconnect();
    };
  }, []);

  function createConcurrentEventsString() {
    if (!otherEnrties[0]) return null;

    const baseString = otherEnrties.length + "+";

    if ("staticData" in otherEnrties[0]) {
      // This is CurrentEntryData[]
      // Handle CurrentEntryData specific logic
      const concurrentEvents = otherEnrties as CurrentEntryData[];
      const subjects = concurrentEvents
        .map((entry) => entry.staticData.subject)
        .join(", ");

      return baseString + " " + subjects;
    }

    return baseString;
  }

  return (
    <div
      className={eventColorStyles({
        tint: itemTint as keyof (
          | "almostTransparent"
          | "white"
          | "default"
          | "red"
          | "orange"
          | "blue"
          | "green"
          | "purple"
          | "yellow"
          | "light"
          | "clear"
          | null
          | undefined
        ),

        noticeType: noticeTintType as keyof (
          | "none"
          | "cancelled"
          | "likelyCancelled"
          | "special"
          | null
          | undefined
        ),
      })}
      style={{
        height: dynamicHeight,
        width: "100%",
        display: isHidden == true ? "none" : "block",
      }}
      ref={itemRef}
    >
      <div
        className="group relative flex select-none flex-col gap-1 rounded-xl p-1 sm:p-3"
        style={{ height: "100%", backgroundColor: "rgba(31, 31, 31, 0.5)" }}
        onContextMenu={(e) => {
          e.preventDefault();
          setIsInfoOpen(true);
        }}
        onTouchStart={(e) => {
          e.preventDefault(); // Prevent default touch behavior
          const timer = setTimeout(() => setIsInfoOpen(true), 300);
          const cleanup = () => {
            clearTimeout(timer);
            document.removeEventListener("touchend", cleanup);
            document.removeEventListener("touchmove", cleanup);
          };
          document.addEventListener("touchend", cleanup);
          document.addEventListener("touchmove", cleanup);
        }}
      >
        {isDesktop && (
          <Button
            onClick={() => setIsInfoOpen(true)}
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 z-10 h-4 w-4 rounded-full bg-neutral-800/30 p-0 opacity-0 transition-opacity hover:bg-neutral-700/40 group-hover:opacity-100"
          >
            <Info size={10} />
          </Button>
        )}
        {isDesktop ? (
          <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isNotice ? data.descr : data.staticData.subject}
                </DialogTitle>
                <DialogDescription>
                  Subject information and details
                </DialogDescription>
              </DialogHeader>
              <EventInfoContent
                handleEditSubjectEntry={
                  handleEditSubjectEntry != undefined
                    ? closeInfoPopupAndHandleEditSubjectEntry
                    : undefined
                }
                data={data}
                periods={periods}
              />
            </DialogContent>
          </Dialog>
        ) : (
          <Drawer open={isInfoOpen} onOpenChange={setIsInfoOpen}>
            <DrawerContent>
              <div className="mx-auto w-full px-5 pb-40">
                <DrawerHeader>
                  <DrawerTitle>
                    {isNotice ? data.descr : data.staticData.subject}
                  </DrawerTitle>
                  <DrawerDescription>
                    Subject information and details
                  </DrawerDescription>
                </DrawerHeader>
                <EventInfoContent
                  handleEditSubjectEntry={
                    handleEditSubjectEntry != undefined
                      ? closeInfoPopupAndHandleEditSubjectEntry
                      : undefined
                  }
                  data={data}
                  periods={periods}
                />
              </div>
            </DrawerContent>
          </Drawer>
        )}
        <div className="w-full sm:font-semibold">
          {isNotice ? (
            data.descr
          ) : data.dynamicData?.oldSubject ? (
            <div className="flex flex-wrap items-center gap-1">
              <span className="line-through">{data.generalData?.name ?? data.staticData.subject.toUpperCase()}</span>
              <MoveRight size={10} />
              {data.dynamicData?.subject}
            </div>
          ) : (
            (data.generalData?.name ?? data.staticData.subject.toUpperCase())
          )}
          {isNotice ? (
            " (" +
            data.periods.join("-") +
            ")" +
            (data.subject != null ? ` in ${data.subject}` : "")
          ) : data.dynamicData?.oldTeacher ? (
            <div className="flex flex-wrap items-center gap-1">
              <span className="line-through">
                {" "}
                ({data.dynamicData?.oldTeacher}
              </span>
              <MoveRight size={10} />
              {data.dynamicData?.teacher ?? data.staticData.teacher})
            </div>
          ) : (
            <span> ({data.staticData.teacher})</span>
          )}
        </div>
        <div className="">
          {isNotice ? (
            data.room
          ) : data.dynamicData?.oldRoom ? (
            <div className="flex flex-wrap items-center gap-1">
              <span className="line-through">{data.dynamicData?.oldRoom}</span>
              <MoveRight size={10} />
              {data.dynamicData?.room ?? data.staticData.room}
            </div>
          ) : (
            <span>{data.staticData.room}</span>
          )}
        </div>
        <div>{otherEnrtiesString}</div>
        <div>
          {isNotice
            ? data.localizedType
            : (data.dynamicData?.localizedType ?? null)}
        </div>
      </div>
    </div>
  );
}

function EventInfoContent({
  data,
  periods,
  handleEditSubjectEntry,
}: {
  data: CurrentEntryData | Notice;
  periods: number[];
  handleEditSubjectEntry?: (data: CurrentEntryData) => void;
}) {
  const isNotice = !("staticData" in data);
  const itemTint = isNotice
    ? null
    : data.dynamicData?.type &&
        ["cancelled", "likelyCancelled", "special"].includes(
          data.dynamicData.type,
        )
      ? "none"
      : data.generalData?.tint;

  const tintColor =
    tintColors[(itemTint as keyof typeof tintColors) || "default"];

  return (
    <div className="flex flex-col gap-4">
      {!isNotice && (
        <>
          <div>
            <div className="text-sm font-medium">Teacher</div>
            <div className={tintColor}>{data.staticData.teacher}</div>
          </div>
          <div>
            <div className="text-sm font-medium">Room</div>
            <div className={tintColor}>{data.staticData.room}</div>
          </div>
          {data.generalData?.name && (
            <div>
              <div className="text-sm font-medium">Name</div>
              <div className={tintColor}>{data.generalData.name}</div>
            </div>
          )}
          {data.dynamicData?.type && (
            <div>
              <div className="text-sm font-medium">Status</div>
              <div className={tintColor}>{data.dynamicData.localizedType}</div>
            </div>
          )}
        </>
      )}
      {isNotice && (
        <>
          <div>
            <div className="text-sm font-medium">Type</div>
            <div className={tintColor}>{data.localizedType}</div>
          </div>
          {data.room && (
            <div>
              <div className="text-sm font-medium">Room</div>
              <div className={tintColor}>{data.room}</div>
            </div>
          )}
        </>
      )}
      <div>
        <div className="text-sm font-medium">Time</div>
        <div className={tintColor}>Period {periods.join("-")}</div>
      </div>

      {handleEditSubjectEntry != undefined && !isNotice && (
        <Button
          variant="secondary"
          className="flex gap-2 focus:outline-none"
          onClick={() => handleEditSubjectEntry(data as CurrentEntryData)}
        >
          <Pen size={10} />
          <div>Edit</div>
        </Button>
      )}
    </div>
  );
}

function Break({ duration }: { duration: number }) {
  const [width, setWidth] = useState<number>(0);
  const itemRef = useRef<HTMLDivElement>(null);

  const dynamicHeight = width * calculateMinToPx(duration);

  useEffect(() => {
    const element = itemRef.current;

    if (!element) return;

    const updateWidth = () => {
      setWidth(element.offsetWidth);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    // Observe the element
    resizeObserver.observe(element);

    // Set the initial width
    updateWidth();

    return () => {
      // Cleanup observer
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      className="flex items-center overflow-hidden rounded-xl text-xs font-light text-neutral-400/50 md:text-base"
      style={{ height: dynamicHeight + "px", width: 100 + "%" }}
      ref={itemRef}
    >
      <div
        className="flex flex-col gap-1 rounded-xl p-1 sm:p-3"
        style={{
          height: "100%",
          backgroundColor: "transparent",
          justifyContent: "center",
        }}
      >
        <div className="font-light md:text-sm md:font-normal lg:text-base lg:font-semibold">
          {duration}min
        </div>
      </div>
    </div>
  );
}
