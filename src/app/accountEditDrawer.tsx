"use client";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "~/components/ui/drawer";
import { AccountData, SubjectInfo } from "./models";
import { Button } from "~/components/ui/button";
import { Collection, updateDocument } from "~/server/appwriteFunctions";
import { getSubjectInfo } from "~/server/getSchedule";
import { LogOut, MonitorSmartphone, X } from "lucide-react";
import { useMediaQuery } from "@uidotdev/usehooks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { createCodeLoginSession, handleLogout } from "~/server/handleCodeLogin";

export default function AccountEditDrawer({
  accountData,
  setAccountData,
  isOpen,
  setIsOpen,
}: {
  accountData: AccountData;
  setAccountData: Dispatch<SetStateAction<AccountData | null>>;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const [subjectInfoData, setSubjectInfoData] = useState<SubjectInfo[]>([]);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    getSubjectInfo().then((data) => {
      setSubjectInfoData(data);
    });
  }, []);

  return (
    <>
      {isDesktop ? (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Account</DialogTitle>
              <DialogDescription>
                Make changes to your account here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <AccountContent
              accountData={accountData}
              setAccountData={setAccountData}
              setIsOpen={setIsOpen}
              subjectInfoData={subjectInfoData}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent>
            <div className="mx-auto w-full max-w-sm max-h-[80vh] overflow-y-auto">
              <DrawerHeader>
                <DrawerTitle>Edit Account</DrawerTitle>
                <DrawerDescription>
                  Make changes to your account here. Click save when you're
                  done.
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4 pb-8 pt-2">
                <AccountContent
                  accountData={accountData}
                  setAccountData={setAccountData}
                  setIsOpen={setIsOpen}
                  subjectInfoData={subjectInfoData}
                />
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}

function AccountContent({
  accountData,
  setAccountData,
  setIsOpen,
  subjectInfoData,
}: {
  accountData: AccountData;
  setAccountData: Dispatch<SetStateAction<AccountData | null>>;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  subjectInfoData: SubjectInfo[];
}) {
  const [username, setUsername] = useState(accountData.username);
  const [year, setYear] = useState(accountData.year);
  const [lang, setLang] = useState<"en" | "de">(accountData.lang);
  const [ignore, setIgnore] = useState<string[]>(accountData.ignore || []);
  const [loginCode, setLoginCode] = useState<string>("");
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 * 5); // 5 minutes in seconds
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [isUsingTelegram, setIsUsingTelegram] = useState(false);
  const [additional, setAdditional] = useState<string[]>(
    accountData.additional || [],
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCountdownActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsCountdownActive(false);
    }
    return () => clearInterval(timer);
  }, [isCountdownActive, timeLeft]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const telegram = window.Telegram.WebApp;
      telegram.ready();

      const user = telegram.initDataUnsafe?.user?.id;
      setIsUsingTelegram(user ? true : false);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleGenerateCode = async () => {
    const code = await createCodeLoginSession(accountData.$id);
    setLoginCode(code);
    setTimeLeft(300);
    setIsCountdownActive(true);
    setShowCodeDialog(true);
  };

  async function handleSubmit() {
    const updatedAccount = await updateDocument<AccountData>(
      accountData.$id,
      {
        username,
        year,
        lang,
        ignore,
        additional,
      },
      Collection.account,
    );
    setAccountData(updatedAccount);
    setIsOpen(false);
  }

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      {showCodeDialog && timeLeft > 0 ? (
        <div className="mb-4 flex items-center gap-8 rounded-lg bg-[#262626] p-3 text-white">
          <div>
            <div className="text-sm font-medium">Login Code</div>
            <div className="pt-1 text-xs text-neutral-500">
              Use this code to log in on another device. The code will expire in{" "}
              {formatTime(timeLeft)}.
            </div>
          </div>
          <div className="font-mono text-2xl">{loginCode}</div>
        </div>
      ) : (
        <Button
          onClick={handleGenerateCode}
          className="mb-4"
          variant="secondary"
          style={{ width: "100%" }}
        >
          <div className="flex gap-2">
            <MonitorSmartphone />
            <div>Login on a new device via code</div>
          </div>
        </Button>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="username" className="text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:ring-neutral-300"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="year" className="text-sm font-medium">
            Year
          </label>
          <input
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:ring-neutral-300"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="lang" className="text-sm font-medium">
            Language
          </label>
          <select
            id="lang"
            value={lang}
            onChange={(e) => setLang(e.target.value as "en" | "de")}
            className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:ring-neutral-300"
          >
            <option value="en">English</option>
            <option value="de">German</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Ignored Subjects</label>
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
                <button
                  onClick={() => setIgnore(ignore.filter((i) => i !== s))}
                >
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
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Additional Subjects</label>
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
                  onClick={() =>
                    setAdditional(additional.filter((i) => i !== s))
                  }
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
        <Button onClick={handleSubmit} className="mt-4">
          Save changes
        </Button>
        {!isUsingTelegram && <LogOutButton setAccountData={setAccountData} />}
      </div>
    </div>
  );
}

function LogOutButton({  setAccountData }: {setAccountData: React.Dispatch<React.SetStateAction<AccountData | null>>}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="text-white">
          <div className="flex gap-2">
            <LogOut />
            <div>Logout</div>
          </div>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will remove your login session from this device.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              await handleLogout();
              setAccountData(null);
            }}
          >
            Logout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
