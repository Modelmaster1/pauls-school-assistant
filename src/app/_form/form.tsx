"use client";
import { Dispatch, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { AccountData, SubjectInfo, TelegramUser } from "../models";
import { getSubjectInfo } from "~/server/getSchedule";
import { Collection, createDocument } from "~/server/appwriteFunctions";
import { Card, CardContent } from "~/components/ui/card";
import { createASession } from "~/server/handleCodeLogin";
import { fetchAccountData, sendWelcomeMessage } from "~/server/getUser";
import { useSearchParams } from "next/navigation";
import Start from "./start";
import Year from "./year";
import Language from "./language";
import Ignore from "./ignore";
import Additional from "./additional";
import RedirectToStripeCheckout from "./stripeCheckout";
import LoginCodeAuth from "./loginCode";
import {
  clearFormStorage,
  createTelegramScript,
  FormType,
  validateLanguage,
  validateYear,
} from "./funcAndModel";
import CheckScreen from "./check";

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

  const [year, setYear] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("formYear") || "";
  });
  const [lang, setLang] = useState<"en" | "de">(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("formLang") as "en" | "de") || "en";
  });
  const [ignore, setIgnore] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("formIgnore");
    return saved ? JSON.parse(saved) : [];
  });
  const [additional, setAdditional] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("formAdditional");
    return saved ? JSON.parse(saved) : [];
  });
  const [subjectInfoData, setSubjectInfoData] = useState<SubjectInfo[]>([]);
  const [validationError, setValidationError] = useState<string>("");

  useEffect(() => {
    if (!telegramUser) return
    setCurrentStep(FormType.Year);
    logUserInOnChangeOfTelegramUser();
  }, [telegramUser]);

  useEffect(() => {
    window.onTelegramAuth = (user: TelegramUser) => {
      setTelegramUser(user);
    };

    createTelegramScript();

    getSubjectInfo().then((data) => {
      setSubjectInfoData(data);
    });
  }, []);

  useEffect(() => {
    if (FormType.start === currentStep) {
      createTelegramScript();
    }
  }, [currentStep]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("formYear", year);
    localStorage.setItem("formLang", lang);
    localStorage.setItem("formIgnore", JSON.stringify(ignore));
    localStorage.setItem("formAdditional", JSON.stringify(additional));
  }, [currentStep, year, lang, ignore, additional]);

  async function logUserInOnChangeOfTelegramUser() {
    if (!telegramUser) return;
    const account = await fetchAccountData(telegramUser.id);
    if (!account) return;
    await createASession(account.$id);
    setAccountData(account);
  }

  function validateCurrentStep(): boolean {
    setValidationError("");

    switch (currentStep) {
      case FormType.Year:
        if (!year.trim()) {
          setValidationError("Please enter your class");
          return false;
        }
        if (!validateYear(year.trim())) {
          setValidationError("Invalid class format. Examples: 10c, Q1, 11");
          return false;
        }
        return true;

      case FormType.Language:
        if (!validateLanguage(lang)) {
          setValidationError("Please select a valid language");
          return false;
        }
        return true;

      default:
        return true;
    }
  }

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

    if (newAccountData && newAccountData.telegramID) {
      await sendWelcomeMessage(newAccountData.telegramID);
      await createASession(newUser.$id);
    }
    clearFormStorage();
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
        return <CheckScreen telegramUser={telegramUser} />;

      case FormType.loginCode:
        return <LoginCodeAuth setAccountData={setAccountData} />;
      default:
        return <div>test</div>;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden p-5">
      <Card className="w-[500px] max-w-full rounded-xl">
        <CardContent className="pt-5">
          <div className="flex flex-col gap-9">
            {getStep()}

            {validationError && (
              <div className="text-sm text-red-500 animate-in fade-in slide-in-from-top-1">
                {validationError}
              </div>
            )}
            <div className="flex flex-col gap-4">
              {!telegramUser && currentStep == FormType.start && (
                <div className="flex flex-col gap-4">
                  <div id="telegram-login-widget"></div>
                  <div className="flex items-center gap-3">
                    <div className="h-[2px] w-full bg-neutral-800"></div>
                    <div className="min-w-fit text-xs text-neutral-600">
                      Already logged in on another device?
                    </div>
                    <div className="h-[2px] w-full bg-neutral-800"></div>
                  </div>
                </div>
              )}
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
                    variant={
                      currentStep == FormType.start && !telegramUser
                        ? "secondary"
                        : "default"
                    }
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
                      } else if (validateCurrentStep()) {
                        setCurrentStep((currentStep + 1) as FormType);
                      }
                    }}
                  >
                    {currentStep == FormType.start
                      ? telegramUser
                        ? "Start"
                        : "Login with Code"
                      : currentStep == FormType.check
                        ? "Finish"
                        : "Next"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
