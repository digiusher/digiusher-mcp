import type { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  stdio: true,
  paths: {
    tools: "./src/tools",
    prompts: false,
    resources: false,
  },
};

export default config;
