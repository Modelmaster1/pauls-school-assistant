"use client";
import { Dispatch, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { AccountData, SubjectInfo } from "../models";
import { getSubjectInfo } from "~/server/getSchedule";
import { X } from "lucide-react";
import { Collection, createDocument } from "~/server/appwriteFunctions";

enum FormType {
  start = 0,
  Year = 1,
  Ignore = 2,
  Additional = 3,
  check = 4,
}

export function Form({
  telegramUser,
  setAccountData,
}: {
  telegramUser: any;
  setAccountData: Dispatch<React.SetStateAction<AccountData | null>>;
}) {
  const [currentStep, setCurrentStep] = useState<FormType>(FormType.start);
  const [year, setYear] = useState<string>("");
  const [ignore, setIgnore] = useState<string[]>([]);
  const [additional, setAdditional] = useState<string[]>([]);
  const [subjectInfoData, setSubjectInfoData] = useState<SubjectInfo[]>([]);

  useEffect(() => {
    getSubjectInfo().then((data) => {
      setSubjectInfoData(data);
    });
  }, []);

  async function finish() {
    const newAccountData: AccountData = {
      username: telegramUser?.username ?? "Anonymous",
      year: year,
      telegramID: telegramUser?.id,
      ignore: ignore,
      additional: additional,
      lang: "en",
    };

    const newUser = await createDocument(
      newAccountData,
      undefined,
      Collection.account,
    );
    setAccountData(newUser);
  }

  function getStep() {
    switch (currentStep) {
      case FormType.start:
        return <Start />;
      case FormType.Year:
        return <Year year={year} setYear={setYear} />;
      case FormType.Ignore:
        return (
          <Ignore
            ignore={ignore}
            setIgnore={setIgnore}
            subjectInfoData={subjectInfoData}
          />
        );
      case FormType.Additional:
        return (
          <Additional
            additional={additional}
            setAdditional={setAdditional}
            subjectInfoData={subjectInfoData}
          />
        );
      case FormType.check:
        return <Check telegramUser={telegramUser} />;
      default:
        return <div>test</div>;
    }
  }

  return (
    <main className="formBackground flex min-h-screen items-center justify-center overflow-hidden p-5">
      <div className="flex w-[500px] flex-col gap-9 rounded-3xl bg-neutral-900 p-10 drop-shadow-lg">
        {getStep()}
        <div className="flex justify-end gap-3">
          {currentStep != FormType.start && (
            <Button
              className="rounded-full px-6"
              variant="ghost"
              onClick={() => setCurrentStep((currentStep - 1) as FormType)}
            >
              Back
            </Button>
          )}
          <Button
            className="rounded-full"
            variant="default"
            style={{
              backgroundColor: "rgba(16, 151, 178, 1)",
              color: "rgb(23 23 23 / 1)",
              width: "100%",
            }}
            onClick={() => {
              if (currentStep == FormType.check) {
                finish();
              } else {
                setCurrentStep((currentStep + 1) as FormType);
              }
            }}
          >
            {currentStep == FormType.start
              ? "Start"
              : currentStep == FormType.check
                ? "Finish"
                : "Next"}
          </Button>
        </div>
      </div>
    </main>
  );
}

function Start() {
  return (
    <div className="flex flex-col gap-2">
      <div className="mb-5 flex w-full justify-center">
        <img
          src="https://ym04dawt7k.ufs.sh/f/74AXHxVYxS0EyyY9EorJdvEZPit5FAMw2OrI1Ru7bYDqjGVS"
          draggable={false}
          alt="hero image"
          className="max-h-[350px] object-contain"
          loading="eager"
        />
      </div>
      <div className="text-xl font-semibold">
        Welcome to Paul's School Assistant!
      </div>
      <div className="text-sm opacity-60">
        Tired of checking DSB? Yeah me to. Luckily this bot will message you
        whenever something relavant happens. And as if that wasn't enough, you
        will also see a visual represantation of your schedule (provided your
        class is supported).
      </div>
    </div>
  );
}

function Check({ telegramUser }: { telegramUser: any }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xl font-semibold">
        Ready {telegramUser?.username ?? "Anonymous"}?
      </div>
      <div className="text-sm opacity-60">
        Almost done! Click the button below to finish the setup process.
      </div>
    </div>
  );
}

function Year({
  year,
  setYear,
}: {
  year: string;
  setYear: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-xl font-semibold">What class are you in?</div>
      <input
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="rounded-full bg-transparent p-3 outline outline-neutral-800"
        placeholder="example: 10c or Q1"
      />
    </div>
  );
}

function Ignore({
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
      <div className="flex flex-wrap gap-3">
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
        className="rounded-3xl bg-transparent p-3 outline outline-neutral-800"
        onChange={(e) => setIgnore([...ignore, e.target.value])}
      >
        <option value="">Select a subject</option>
        {subjectInfoData
          .filter((subject) => !ignore.includes(subject.abbreviation))
          .map((subject, i) => (
            <option key={subject.abbreviation + i} value={subject.abbreviation}>
              {subject.name} ({subject.abbreviation})
            </option>
          ))}
      </select>
    </div>
  );
}

function Additional({
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
      <div className="flex flex-wrap gap-3">
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
        className="rounded-3xl bg-transparent p-3 outline outline-neutral-800"
        onChange={(e) => setAdditional([...additional, e.target.value])}
      >
        <option value="">Select a subject</option>
        {subjectInfoData
          .filter((subject) => !additional.includes(subject.abbreviation))
          .map((subject, i) => (
            <option key={subject.abbreviation + i} value={subject.abbreviation}>
              {subject.name} ({subject.abbreviation})
            </option>
          ))}
      </select>
    </div>
  );
}
