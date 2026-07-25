# Pi Zsh Shell

A macOS-focused [Pi](https://github.com/earendil-works/pi) extension that replaces the built-in `bash` tool implementation with Pi's standard shell tool configured for `/bin/zsh`.

The tool keeps the API name `bash` for model and extension compatibility, but its commands execute with `/bin/zsh -c` and its UI label is `zsh`. Pi's built-in output streaming, truncation, timeout, cancellation, rendering, and `PI_*` session environment behavior remain intact.

## Requirements

- macOS with `/bin/zsh`
- Pi with package installation support
- Node.js 22.19 or newer for running the tests

## Install from GitHub

Install the Pi package directly from its GitHub repository:

```sh
pi install git:github.com/brunogama/pi-zsh-shell
```

Pi records the package in `~/.pi/agent/settings.json`, clones the repository, runs `npm install`, and loads the extension declared by `package.json`.

To pin a tagged release:

```sh
pi install git:github.com/brunogama/pi-zsh-shell@v0.1.0
```

Restart Pi after installation, or run `/reload` in an existing Pi session.

## Verify

Ask Pi to execute this command with its shell tool:

```zsh
printf 'zsh=%s uppercase=%s\n' "$ZSH_VERSION" "${(U):-ok}"
```

Expected output includes a zsh version and `uppercase=OK`. The `${(U)}` expansion is zsh-specific.

## Shell behavior

Commands run as non-interactive `/bin/zsh -c` processes:

- zsh syntax and parameter expansion are available.
- The command inherits Pi's environment and working directory.
- zsh reads `.zshenv` according to its normal startup rules.
- Interactive-only `.zshrc` configuration, aliases, and functions are not loaded.
- The extension overrides the LLM-facing `bash` tool; it does not change Pi's separate `!` user-shell command path.

## Local development

```sh
git clone https://github.com/brunogama/pi-zsh-shell.git
cd pi-zsh-shell
npm install
npm test
pi install .
```

The local install can be reloaded with `/reload` after changes.

## Test

```sh
npm test
```

The tests verify the Pi package manifest, built-in tool override metadata, and execution of zsh-only syntax through the registered tool.

## Remove

```sh
pi remove git:github.com/brunogama/pi-zsh-shell
```

Restart Pi or run `/reload` afterward.

## Security

Pi extensions execute with the same system access as Pi. Review extension source before installing it from any third party or fork.
