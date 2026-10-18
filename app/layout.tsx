import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"遇见画家｜达芬奇的虚拟画室",description:"可漫游的文艺复兴画室三维光影演示"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
