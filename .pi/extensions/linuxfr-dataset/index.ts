import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerCollectPagesTool } from "./src/tools/collect-pages";
import { registerQueryRawTool } from "./src/tools/query-raw";
import { registerUpdateWikiTool } from "./src/tools/update-wiki";

export default function (pi: ExtensionAPI) {
  registerCollectPagesTool(pi);
  registerQueryRawTool(pi);
  registerUpdateWikiTool(pi);
}
