export default function Language({
  lang,
  setLang,
}: {
  lang: "en" | "de";
  setLang: React.Dispatch<React.SetStateAction<"en" | "de">>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-xl font-semibold">
        Choose your preferred language
      </div>
      <div className="flex flex-col gap-2">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as "en" | "de")}
          className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:ring-neutral-300"
        >
          <option value="en">English</option>
          <option value="de">German</option>
        </select>
      </div>
    </div>
  );
}
