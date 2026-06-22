import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const paramsSchema = Type.Object({
  sourcePaths: Type.Optional(Type.Array(Type.String({ description: "Local raw source paths to use" }))),
  sourceUrls: Type.Optional(Type.Array(Type.String({ description: "Source URLs to use" }))),
  notePath: Type.Optional(Type.String({ description: "Target note path under data/wiki/notes or explicit relative path" })),
  topic: Type.Optional(Type.String({ description: "Wiki note topic" })),
});

export function registerUpdateWikiTool(pi: ExtensionAPI) {
  pi.registerTool({
    name: "linuxfr_update_wiki",
    label: "LinuxFr Update Wiki",
    description: "Create or update lightweight cited Markdown notes from collected raw sources. Placeholder until the wiki MVP is implemented.",
    promptSnippet: "Update the local LinuxFr Markdown wiki from raw sources",
    parameters: paramsSchema,
    async execute() {
      return {
        content: [
          {
            type: "text",
            text: "linuxfr_update_wiki is registered but not implemented yet. Collect raw sources first, then implement cited note generation.",
          },
        ],
        details: { implemented: false },
      };
    },
  });
}
