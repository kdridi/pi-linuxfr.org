import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const paramsSchema = Type.Object({
  type: Type.Optional(Type.String({ description: "Optional raw source type filter" })),
  query: Type.Optional(Type.String({ description: "Optional metadata query" })),
  url: Type.Optional(Type.String({ description: "Optional source URL filter" })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, description: "Maximum result count" })),
});

export function registerQueryRawTool(pi: ExtensionAPI) {
  pi.registerTool({
    name: "linuxfr_query_raw",
    label: "LinuxFr Query Raw",
    description: "Inspect the local LinuxFr raw dataset. Placeholder until the raw query MVP is implemented.",
    promptSnippet: "Inspect collected LinuxFr raw sources",
    parameters: paramsSchema,
    async execute() {
      return {
        content: [
          {
            type: "text",
            text: "linuxfr_query_raw is registered but not implemented yet. Use linuxfr_collect_pages first to create data/raw/metadata.jsonl.",
          },
        ],
        details: { implemented: false },
      };
    },
  });
}
