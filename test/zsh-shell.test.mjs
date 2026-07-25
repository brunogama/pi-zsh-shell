import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test, { before } from "node:test";

const PACKAGE_NAME = "@earendil-works/pi-coding-agent";
const extensionRoot = path.dirname(
	fileURLToPath(new URL("../index.ts", import.meta.url)),
);

function findPackageRoot(entryPath) {
	let current = path.dirname(realpathSync(entryPath));

	while (current !== path.dirname(current)) {
		const manifestPath = path.join(current, "package.json");
		if (existsSync(manifestPath)) {
			const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
			if (manifest.name === PACKAGE_NAME) return current;
		}
		current = path.dirname(current);
	}

	return undefined;
}

function resolvePiPackageRoot() {
	const require = createRequire(import.meta.url);

	try {
		const localRoot = findPackageRoot(require.resolve(PACKAGE_NAME));
		if (localRoot) return localRoot;
	} catch {
		// Fall back to the package that provides the globally installed Pi executable.
	}

	try {
		const piExecutable = execFileSync("/usr/bin/which", ["pi"], {
			encoding: "utf8",
		}).trim();
		const executableRoot = findPackageRoot(piExecutable);
		if (executableRoot) return executableRoot;
	} catch {
		// Fall back to npm's global module root when Pi is not on PATH.
	}

	const npmEnvironment = { ...process.env };
	delete npmEnvironment.npm_config_prefix;
	delete npmEnvironment.NPM_CONFIG_PREFIX;
	const globalModules = execFileSync("npm", ["root", "--global"], {
		encoding: "utf8",
		env: npmEnvironment,
	}).trim();
	const globalRoot = path.join(globalModules, ...PACKAGE_NAME.split("/"));

	if (!existsSync(path.join(globalRoot, "package.json"))) {
		throw new Error(
			`Could not resolve ${PACKAGE_NAME} locally or from ${globalModules}`,
		);
	}

	return globalRoot;
}

async function loadRegisteredTool() {
	const piRoot = resolvePiPackageRoot();
	const requireFromPi = createRequire(path.join(piRoot, "package.json"));
	const { createJiti } = requireFromPi("jiti");
	const jiti = createJiti(import.meta.url, {
		alias: {
			[PACKAGE_NAME]: path.join(piRoot, "dist", "index.js"),
		},
	});
	const extension = await jiti.import(path.join(extensionRoot, "index.ts"));
	let registeredTool;

	extension.default({
		registerTool(tool) {
			registeredTool = tool;
		},
	});

	assert.ok(registeredTool, "extension should register a tool");
	return registeredTool;
}

let tool;

before(async () => {
	tool = await loadRegisteredTool();
});

test("declares the root extension in the Pi package manifest", () => {
	const manifest = JSON.parse(
		readFileSync(path.join(extensionRoot, "package.json"), "utf8"),
	);

	assert.equal(manifest.name, "@brngp/pi-zsh-shell");
	assert.deepEqual(manifest.pi.extensions, ["./index.ts"]);
	assert.ok(manifest.keywords.includes("pi-package"));
});

test("overrides the bash tool while identifying zsh behavior", () => {
	assert.equal(tool.name, "bash");
	assert.equal(tool.label, "zsh");
	assert.match(tool.description, /\/bin\/zsh -c/);
	assert.match(tool.promptSnippet, /zsh commands/);
	assert.ok(
		tool.promptGuidelines.some((guideline) =>
			guideline.includes("/bin/zsh -c"),
		),
	);
});

test("executes zsh-only parameter expansion", async () => {
	const result = await tool.execute(
		"zsh-test",
		{
			command:
				'printf "version=%s uppercase=%s\\n" "$ZSH_VERSION" "${(U):-ok}"',
		},
		undefined,
		undefined,
	);
	const output = result.content
		.filter((item) => item.type === "text")
		.map((item) => item.text)
		.join("");

	assert.match(output, /version=\d+\.\d+/);
	assert.match(output, /uppercase=OK/);
});
