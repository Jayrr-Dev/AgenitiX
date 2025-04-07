import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { CookieConsent } from "@/features/cookies";
import Footer from "@/features/marketing/components/footer";
import { getUserRole } from "@/utils/auth-utils";
import { createClient } from "@/utils/supabase/server";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Utilitek Solutions",
  description: "Utilitek Solutions is a electrical engineering consulting company in Edmonton, Alberta, Canada that provides solutions to businesses in the utility industry",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});



export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
 
  const {
    data: { session },
  } = await supabase.auth.getSession()

  
  const userRole = await getUserRole(session);

  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col items-center">
            <div className="flex-1 w-full flex flex-col items-center">
            
              {/* Navbar */}
              <Navbar userRole={userRole} session={session} />

              
              {/* Main Content */}
              <div className="w-full">
                {children}

                {/* Cookie Consent */}
                <CookieConsent />
              </div>

              {/* Footer */}
              <Footer />
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
