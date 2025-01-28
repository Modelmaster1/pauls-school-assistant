"use client"
import { Dispatch, useEffect, useState } from "react";
import { AccountData } from "../models";
import { validateCodeLoginSession } from "~/server/handleCodeLogin";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "~/components/ui/input-otp";

export default function LoginCodeAuth({
    setAccountData,
  }: {
    setAccountData: Dispatch<React.SetStateAction<AccountData | null>>;
  }) {
    const [inputString, setInputString] = useState<string>("");
    const [error, setError] = useState<string>("");
  
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
        setError("");
      } else {
        setInputString("");
        setError("Invalid code. Please try again.");
      }
    }
  
    return (
      <div className="flex flex-col gap-4">
        <div className="text-xl font-semibold">🔑 Login with Code</div>
        <div className="text-sm opacity-60">
          To get your login code:
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Open the app on your other device</li>
            <li>Click the ⚙️ Settings button in the top right</li>
            <li>Press "Login on a new device via code"</li>
            <li>Enter the 6-digit code below</li>
          </ol>
        </div>
        <div className="mt-2 flex flex-col gap-2">
          <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Enter your 6-digit code
          </div>
          <InputOTP
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            disabled={inputString.length >= 6}
            value={inputString}
            onChange={(e) => {
              setInputString(e);
              setError("");
            }}
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
          {error && (
            <div className="mt-2 text-sm text-red-500 animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }