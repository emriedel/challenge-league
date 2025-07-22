import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Glimpse',
  description: 'Meaningful sharing through weekly photo prompts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <a href="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700">
                  Glimpse
                </a>
                <nav className="flex space-x-8">
                  <a 
                    href="/" 
                    className="text-gray-900 font-medium border-b-2 border-primary-500 pb-4 -mb-px"
                  >
                    Gallery
                  </a>
                  <a 
                    href="/submit" 
                    className="text-gray-500 hover:text-gray-900 pb-4"
                  >
                    Submit
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}