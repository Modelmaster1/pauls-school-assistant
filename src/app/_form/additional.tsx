import { X } from "lucide-react";
import { SubjectInfo } from "../models";

export default function Additional({
    additional,
    setAdditional,
    subjectInfoData,
  }: {
    additional: string[];
    setAdditional: React.Dispatch<React.SetStateAction<string[]>>;
    subjectInfoData: SubjectInfo[];
  }) {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-xl font-semibold">
          Are there any additional subjects you would like to be notified about
          (WPUs or AGs)?
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {additional.map((s, i) => (
              <div
                key={s + i}
                className="flex items-center gap-1 rounded-full bg-neutral-800 px-3 py-1 text-sm"
              >
                {
                  subjectInfoData.find((subject) => subject.abbreviation === s)
                    ?.name
                }
                <button
                  onClick={() => setAdditional(additional.filter((i) => i !== s))}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
          <select
            className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:ring-neutral-300"
            onChange={(e) =>
              e.target.value && setAdditional([...additional, e.target.value])
            }
            value=""
          >
            <option value="">Add additional subject</option>
            {subjectInfoData
              .filter((subject) => !additional.includes(subject.abbreviation))
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