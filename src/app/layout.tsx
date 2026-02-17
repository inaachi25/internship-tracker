import "./globals.css";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-sans bg-rose-50 text-gray-800">
        <div className="min-h-screen">
          <main className="max-w-5xl mx-auto p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
