# AI Code Documenter Chrome Extension

## Overview

Chrome Extension that uses openAI's API to add inline comments to a snippet of code.

Select the snippet on a web page and click on the extension icon to preview then generate the documented result. You can optionally save to a local .md for record keeping.

AI Code Doc uses the OpenAI GPT-3.5 "chat" API with your own API key ("Bring your own key").

The majority of the code was sourced from [here](https://github.com/markey/ai-companion), with some small additions from [here](https://github.com/berlyozzy/md-note). I modified the prompt, API connection, and UI to fit this more specific purpose.

![AI Code Doc Screenshot](extensionScreenshot.png "Screenshot")

## Installation

Install [npm](https://nodejs.org/en/download/)

Sync this repo locally (Git Bash):

```bash
git clone https://github.com/PeterPCW/aiCodeDoc
```

Build locally (cmd, don't use npm inside of Git Bash):

```cmd
pnpm build
# or
npm run build
```

Then, in Chrome, go to `chrome://extensions` and click "Load unpacked" and select the `build/chrome-mv3-prod` directory. 

## Setup

1. Create an account at [OpenAI](https://beta.openai.com/).
2. Copy your OpenAI API key and paste it in the extension options page.

## Usage

1. Select some code on a webpage (this is optional, you can also just type in the Code Snippet text box).
2. Open the extension popup (click the extension icon in the toolbar).
3. In the popup, the selected code will be displayed as Code Snippet with a prompt prefix. You can edit this prompt as desired but it should work as-is.
4. Review the code snippet and click "Generate".
5. The extension will runn and return the OpenAI response in Result.
6. Use the Save to File button to launch the file location picker if you want to save the documented code. It will save the text in the Result window and append a "Source:" link to the currently active browswer window.

## Roadmap

Some features I want to include/improve:
* More prompt options - could limit to "fix this code", etc. or expand beyond the world of code
* Right-click menu on the selected text instead of clicking to the extension icon at the top (although it is easy to hot-key)
* Grow window or scroll to bottom always - Save to File button hides when Response is large
* Options page as a modal instead of a new window
* Better CSS, possibly multiple styles (if releasing)