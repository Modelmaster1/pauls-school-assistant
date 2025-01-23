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
import { X } from "lucide-react";

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
  const [username, setUsername] = useState(accountData.username);
  const [year, setYear] = useState(accountData.year);
  const [lang, setLang] = useState<"en" | "de">(accountData.lang);
  const [ignore, setIgnore] = useState<string[]>(accountData.ignore || []);
  const [additional, setAdditional] = useState<string[]>(accountData.additional || []);
  const [subjectInfoData, setSubjectInfoData] = useState<SubjectInfo[]>([]);

  useEffect(() => {
    getSubjectInfo().then((data) => {
      setSubjectInfoData(data);
    });
  }, []);

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
      Collection.account
    );
    setAccountData(updatedAccount);
    setIsOpen(false);
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Edit Account</DrawerTitle>
            <DrawerDescription>
              Make changes to your account here. Click save when you're done.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
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
                <label className="text-sm font-medium">
                  Ignored Subjects
                </label>
                <div className="flex flex-wrap gap-2">
                  {ignore.map((s, i) => (
                    <div
                      key={s + i}
                      className="flex items-center gap-1 rounded-full bg-neutral-800 px-3 py-1 text-sm"
                    >
                      {subjectInfoData.find((subject) => subject.abbreviation === s)?.name}
                      <button onClick={() => setIgnore(ignore.filter((i) => i !== s))}>
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <select
                  className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:ring-neutral-300"
                  onChange={(e) => e.target.value && setIgnore([...ignore, e.target.value])}
                  value=""
                >
                  <option value="">Add ignored subject</option>
                  {subjectInfoData
                    .filter((subject) => !ignore.includes(subject.abbreviation))
                    .map((subject, i) => (
                      <option key={subject.abbreviation + i} value={subject.abbreviation}>
                        {subject.name} ({subject.abbreviation})
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Additional Subjects
                </label>
                <div className="flex flex-wrap gap-2">
                  {additional.map((s, i) => (
                    <div
                      key={s + i}
                      className="flex items-center gap-1 rounded-full bg-neutral-800 px-3 py-1 text-sm"
                    >
                      {subjectInfoData.find((subject) => subject.abbreviation === s)?.name}
                      <button onClick={() => setAdditional(additional.filter((i) => i !== s))}>
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <select
                  className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:ring-neutral-300"
                  onChange={(e) => e.target.value && setAdditional([...additional, e.target.value])}
                  value=""
                >
                  <option value="">Add additional subject</option>
                  {subjectInfoData
                    .filter((subject) => !additional.includes(subject.abbreviation))
                    .map((subject, i) => (
                      <option key={subject.abbreviation + i} value={subject.abbreviation}>
                        {subject.name} ({subject.abbreviation})
                      </option>
                    ))}
                </select>
              </div>
              <Button onClick={handleSubmit} className="mt-4">
                Save changes
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}