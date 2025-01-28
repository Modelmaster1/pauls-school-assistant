import { X } from "lucide-react";
import { SubjectInfo } from "../models";

export default function Ignore({
  ignore,
  setIgnore,
  subjectInfoData,
}: {
  ignore: string[];
  setIgnore: React.Dispatch<React.SetStateAction<string[]>>;
  subjectInfoData: SubjectInfo[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-xl font-semibold">
        Are there any subjects you wouldn't want want to be notified about?
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {ignore.map((s, i) => (
            <div
              key={s + i}
              className="flex items-center gap-1 rounded-full bg-neutral-800 px-3 py-1 text-sm"
            >
              {
                subjectInfoData.find((subject) => subject.abbreviation === s)
                  ?.name
              }
              <button onClick={() => setIgnore(ignore.filter((i) => i !== s))}>
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
        <select
          className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:ring-neutral-300"
          onChange={(e) =>
            e.target.value && setIgnore([...ignore, e.target.value])
          }
          value=""
        >
          <option value="">Add ignored subject</option>
          {subjectInfoData
            .filter((subject) => !ignore.includes(subject.abbreviation))
            .map((subject, i) => (
              <option
                key={subject.abbreviation + i}
                value={subject.abbreviation}
              >
                {subject.name} ({subject.abbreviation})
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}
