export default function Year({
  year,
  setYear,
}: {
  year: string;
  setYear: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-xl font-semibold">What class are you in?</div>
      <div className="flex flex-col gap-2">
        <input
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:ring-neutral-300"
          placeholder="example: 10c or Q1"
        />
      </div>
    </div>
  );
}
