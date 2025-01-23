"use client";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "~/components/ui/input-otp";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import {
  validateCodeLoginSession,
} from "~/server/handleCodeLogin";
import { AccountData } from "./models";

export default function CodeAuth({
  setAccountData,
  popUpIsOpen,
  setPopUpIsOpen,
}: {
  setAccountData: Dispatch<SetStateAction<AccountData | null>>;
  popUpIsOpen: boolean;
  setPopUpIsOpen: Dispatch<SetStateAction<boolean>>;
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
      setPopUpIsOpen(false);
      setAccountData(account);
      setInputString("");
    } else {
      setInputString("");
      alert("failed");
    }
  }

  return (
    <Dialog open={popUpIsOpen} onOpenChange={setPopUpIsOpen}>
      <DialogContent className="focus:outline-none">
        <DialogHeader>
          <DialogTitle>Login via code</DialogTitle>
          <DialogDescription>
            Find the code on your phone and enter it here.
          </DialogDescription>
        </DialogHeader>
        <div className="w-full flex justify-center sm:justify-start">
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
      </DialogContent>
    </Dialog>
  );
}
