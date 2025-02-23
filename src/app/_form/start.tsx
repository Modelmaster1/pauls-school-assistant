export default function Start() {
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
        Welcome to Schedule Bryan!
      </div>
      <div className="text-sm opacity-60">
        Tired of checking DSB? Yeah me too. Luckily this bot will message you
        whenever something relevant happens. And as if that wasn't enough, you
        will also see a visual represantation of your schedule (provided your
        class is supported).
      </div>
    </div>
  );
}
