"use client";
import { Dispatch, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { AccountData, SubjectInfo, TelegramUser } from "./models";
import { getSubjectInfo } from "~/server/getSchedule";
import { X } from "lucide-react";
import { Collection, createDocument } from "~/server/appwriteFunctions";
import { Card, CardContent } from "~/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "~/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { validateCodeLoginSession } from "~/server/handleCodeLogin";
import TelegramLoginButton from "./telegramAuthButton";

enum FormType {
  start = 0,
  Year = 1,
  Language = 2,
  Ignore = 3,
  Additional = 4,
  check = 5,

  loginCode,
}

export function Form({
  telegramUser,
  setTelegramUser,
  setAccountData,
}: {
  telegramUser: TelegramUser | null;
  setTelegramUser: Dispatch<React.SetStateAction<TelegramUser | null>>;
  setAccountData: Dispatch<React.SetStateAction<AccountData | null>>;
}) {
  const [currentStep, setCurrentStep] = useState<FormType>(FormType.start);
  const [year, setYear] = useState<string>("");
  const [lang, setLang] = useState<"en" | "de">("en");
  const [ignore, setIgnore] = useState<string[]>([]);
  const [additional, setAdditional] = useState<string[]>([]);
  const [subjectInfoData, setSubjectInfoData] = useState<SubjectInfo[]>([]);

  useEffect(() => {
    
    window.onTelegramAuth = (user: TelegramUser) => {
      setTelegramUser(user);
    };

    getSubjectInfo().then((data) => {
      setSubjectInfoData(data);
    });
  }, []);

  async function finish() {
    const newAccountData = {
      // based on user data, but doesn't have all the properties
      username: telegramUser?.username ?? "Anonymous",
      year: year,
      telegramID: telegramUser?.id,
      ignore: ignore,
      additional: additional,
      lang: lang,
    };

    const newUser = await createDocument<AccountData>(
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
      case FormType.Language:
        return <Language lang={lang} setLang={setLang} />;
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

      case FormType.loginCode:
        return <LoginCodeAuth setAccountData={setAccountData} />;
      default:
        return <div>test</div>;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden p-5">
      <Card className="rounded-xl">
        <CardContent className="pt-5">
          <div className="flex w-[500px] flex-col gap-9">
            {getStep()}

            <script
              src="https://telegram.org/js/telegram-widget.js?22"
              async
              data-telegram-login="PaulsAISchoolbot"
              data-size="large"
              data-onauth="onTelegramAuth(user)"
              data-request-access="write"
            ></script>
            <div className="flex justify-end gap-3">
              {currentStep != FormType.start && (
                <Button
                  className="px-6"
                  variant="ghost"
                  onClick={() => {
                    if (currentStep == FormType.loginCode) {
                      setCurrentStep(FormType.start);
                      return;
                    }
                    setCurrentStep((currentStep - 1) as FormType);
                  }}
                >
                  Back
                </Button>
              )}
              {currentStep != FormType.loginCode && (
                <Button
                  variant="default"
                  style={{
                    width: "100%",
                  }}
                  onClick={() => {
                    if (!telegramUser?.id) {
                      setCurrentStep(FormType.loginCode);
                      return;
                    }
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
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function Start() {
  return (
    <div className="flex flex-col gap-2">
      <div className="mb-5 flex w-full justify-center rounded-md bg-neutral-900 p-3">
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

function Language({
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

function LoginCodeAuth({
  setAccountData,
}: {
  setAccountData: Dispatch<React.SetStateAction<AccountData | null>>;
}) {
  const [inputString, setInputString] = useState<string>("");

  useEffect(() => {
    if (inputString.length >= 6) {
      getAccount();
    }
  }, [inputString]);

  async function getAccount() {
    const account = await validateCodeLoginSession(inputString);
    if (account) {
      setAccountData(account);
      setInputString("");
    } else {
      setInputString("");
      alert("failed");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-xl font-semibold">Login with code</div>
      <div className="flex flex-col gap-2">
        <InputOTP
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          disabled={inputString.length >= 6}
          value={inputString}
          onChange={(e) => setInputString(e)}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>
    </div>
  );
}
