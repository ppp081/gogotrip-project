import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin } from "lucide-react";

export function TripMarkdown({ content }: { content: string }) {

  const fixedContent = content
  // ✅ 1. แก้ strong ที่มีช่องว่างก่อน **
  .replace(/\*\*(.+?)\s+\*\*/g, "**$1**")

  // ✅ 2. ตรวจเจอ ::start-grid:: ... ::end-grid::
  .replace(/::start-grid::([\s\S]*?)::end-grid::/g, (_, inner) => {
    // แยกแต่ละ card ด้วย ---
    const cards = inner
      .split(/\n---+\n/)
      .map((raw: string) => raw.trim())
      .filter(Boolean)
      .map((text: string) => `<trip-card>${text}</trip-card>`)
      .join("");

    return `<trip-grid>${cards}</trip-grid>`;
  });


  return (
    <div className="prose prose-lg max-w-none text-sm thai-tile">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeRaw]}

          components={{
          
          // @ts-expect-error custom markdown tag
          "trip-grid": ({ children }: any) => (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 not-prose h-full items-stretch">
              {children}
            </div>
          ),

          // @ts-expect-error custom markdown tag
          "trip-card": ({ children }: any) => {
            const raw = Array.isArray(children)
              ? children.map((c: any) => (typeof c === "string" ? c : c?.props?.children ?? "")).join("\n")
              : String(children ?? "");

            const lines = raw.split(/\n/).map((l) => l.trim()).filter(Boolean);

            const emoji = lines.find((x) => x.startsWith("[H1]"))?.replace("[H1]", "").trim() || "";
            const title = lines.find((x) => x.startsWith("[H2]"))?.replace("[H2]", "").trim() || "";
            const desc = lines.find((x) => x.startsWith("[H3]"))?.replace("[H3]", "").trim() || "";
            const time = lines.find((x) => x.startsWith("[H4]"))?.replace("[H4]", "").trim() || "";

            if (!emoji && !title && !desc) return null;

            return (
              <div className="not-prose">
                <Card className="hover:shadow-lg hover:scale-103 transition-all duration-300 h-full flex flex-col">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-2xl">
                        {emoji}
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
                    </div>

                    {desc && <p className="text-gray-600 mb-4">{desc}</p>}

                    {time && (
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500">{time}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          },




          
          h1: ({node, ...props}) => (
            <div className="h-fit py-3 my-2 border-l-4 border-indigo-500 pl-3">
                <h1 className="text-4xl font-semibold text-gray-800 pl-3" {...props} />
            </div>
          ),

          h2: ({node, ...props}) => (
            <h2 className="text-2xl font-bold text-gray-900 mb-4" {...props} />
          ),
          p: ({node, ...props}) => (
            <p className="text-gray-800 text-xs leading-relaxed mb-6 whitespace-pre-line" {...props} />
          ),

          ul: ({node, ...props}) => (
            <ul className="list-disc pl-6 mb-8 text-gray-700 space-y-2" {...props} />
          ),
          li: ({node, ...props}) => (
            <li className="leading-relaxed" {...props} />
          ),
          img: ({node, ...props}) => (
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-6 not-prose my-3">
              <img {...props} className="object-cover w-full h-full" />
            </div>
          ),
          blockquote: ({node, ...props}) => (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8 not-prose rounded-r-2xl">
              {/* <h3 className="font-semibold text-blue-900 mb-2">เคล็ดลับ</h3> */}
              <p className="text-blue-800" {...props} />
            </div>
          ),
          hr: ({node, ...props}) => (
            <hr
              className="my-3 border-t-1 border-gray-200"
              {...props}
            />
          ),
          strong: ({node, ...props}) => (
            <div className="flex items-center gap-2">
                  <span className="border border-foreground/10 text-black font-semibold rounded-md px-3 py-1 text-sm tracking-wide">
                    🗓️ {props.children}
                  </span>
            </div>
          ),
        }}
      >
        {fixedContent}
      </ReactMarkdown>
    </div>
  );
}












