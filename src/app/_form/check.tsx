export default function CheckScreen({ telegramUser }: { telegramUser: any }) {
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
