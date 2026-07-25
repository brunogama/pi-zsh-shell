import {
	createBashTool,
	type ExtensionAPI,
} from "@earendil-works/pi-coding-agent";

const ZSH_PATH = "/bin/zsh";

export default function zshShellExtension(pi: ExtensionAPI) {
	const zshTool = createBashTool(process.cwd(), {
		shellPath: ZSH_PATH,
	});

	pi.registerTool({
		...zshTool,
		label: "zsh",
		description:
			"Execute a zsh command in the current working directory using /bin/zsh -c. Returns stdout and stderr. Output is truncated when necessary.",
		promptSnippet: "Execute zsh commands (ls, rg, find, etc.)",
		promptGuidelines: [
			"Shell commands run with /bin/zsh -c. Use zsh syntax and do not assume Bash-only semantics.",
			"Inspect PI_* environment variables for current model and session details.",
		],
	});
}
