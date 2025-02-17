import "~/styles/globals.css";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { GeistSans } from "geist/font/sans";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata = {
  title: "SummitEd",
  description: "AI Learning Assistant",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable}`} id="tailwind-styled">
      <body className="text-gray-800">
        <AntdRegistry>
          <TRPCReactProvider>
            <ConfigProvider
              theme={/*{ token: { colorPrimary: "#2a9d8f" } }*/ undefined}
            >
              <main className="flex min-h-screen flex-col items-center overflow-auto">
                {children}
              </main>
            </ConfigProvider>
          </TRPCReactProvider>
        </AntdRegistry>

        {/* https://github.com/vercel/next.js/discussions/50772#discussioncomment-6095763 */}
        {/* Hotjar Tracking Code for summited.ai */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(h,o,t,j,a,r){
                  h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                  h._hjSettings={hjid:5234263,hjsv:6};
                  a=o.getElementsByTagName('head')[0];
                  r=o.createElement('script');r.async=1;
                  r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                  a.appendChild(r);
              })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
            `,
          }}
        />
      </body>
    </html>
  );
}
