import { cookies } from 'next/headers'
import Timetable from './clientPage'
 
export default async function Page() {
  const cookieStore = await cookies()
  const loginCookie = cookieStore.get('login_session')?.value
  return <Timetable loginCookie={loginCookie ?? null} />
}