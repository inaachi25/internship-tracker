import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <main className="max-w-5xl mx-auto p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
