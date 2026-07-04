import type { Metadata } from "next"; import "./globals.css"; import { Toaster } from "sonner";
export const metadata: Metadata = { title: "Blood Pressure Tracker", description: "Theo dõi huyết áp hằng ngày" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="vi"><body>{children}<Toaster richColors position="top-center" /></body></html>; }
