import Hero from "@/features/marketing/components/hero";
import Main from "@/features/marketing/components/main";
import ConnectSupabaseSteps from "@/components/tutorial/connect-supabase-steps";
import SignUpUserSteps from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";

export default async function Home() {
  return (
    <>
      <Hero />
      <Main />
    </>
  );
}
