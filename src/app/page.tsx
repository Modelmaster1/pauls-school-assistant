import { cookies } from "next/headers";
import HomePage from "./clientPage";

export default async function Page() {
  const cookieStore = await cookies();
  const loginCookie = cookieStore.get("login_session")?.value;

  return <HomePage loginCookie={loginCookie ?? null}/>
}