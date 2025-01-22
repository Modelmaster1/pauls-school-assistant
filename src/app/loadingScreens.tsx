export function LoadingScreen() {
  return (
    <main className="min-h-full animate-pulse overflow-hidden p-5">
      <div className="mb-5 flex w-full flex-col items-center gap-4">
        <div className="h-[36px] min-w-[280px] rounded-xl bg-neutral-800"></div>
        <div className="h-[12px] min-w-[280px] rounded-lg bg-neutral-800"></div>
      </div>

      <LoadingScheduleScreen />
    </main>
  );
}

export function LoadingScheduleScreen() {
  return (
    <div className="flex min-h-full w-full justify-start gap-0 overflow-x-auto lg:justify-center">
      <DayLoading />
      <DayLoading />
      <DayLoading />
      <DayLoading />
      <DayLoading />
    </div>
  );
}

function DayLoading() {
  return (
    <div
      className="h-full w-full"
      style={{ minWidth: "100px", maxWidth: "200px" }}
    >
      <div className="flex w-full flex-col gap-0 rounded-2xl p-2 md:px-4 md:py-2">
        <div className="mb-4 flex w-full justify-center text-xs md:text-base">
          <div className="h-[12px] w-[80%x] rounded-lg bg-neutral-800"></div>
        </div>

        <div className="flex flex-col gap-16">
          {[1, 2, 3].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-1 rounded-xl bg-neutral-800"
              style={{ aspectRatio: "1 / 0.8" }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
