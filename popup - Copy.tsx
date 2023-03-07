/**
 *  OpenAI GPT-3 Text Generator (Chrome extension)
 *
 * (c) 2022 Mark Kretschmann <kretschmann@kde.org>
 *
 */
import DeleteIcon from "@mui/icons-material/Delete"
import HistoryIcon from "@mui/icons-material/History"
import SettingsIcon from "@mui/icons-material/Settings"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import IconButton from "@mui/material/IconButton"
import List from "@mui/material/List"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import Modal from "@mui/material/Modal"
import Slider from "@mui/material/Slider"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import { useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

// Initialize variable to store selected text
let selection = ""

/**
 * Returns the selected text.
 * Note: This is executed in the context of the active tab.
 * @return {string} The selected text
 */
function getTextSelection(): string {
  // Get the selected text and return it as a string
  return window.getSelection().toString()
}

function IndexPopup(): JSX.Element {
  // Initialize state variables with useState hook
  const [openHistory, setOpenHistory] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [buttonText, setButtonText] = useState("Generate (Ctrl+Enter)")
  const [result, setResult] = useState("")
  const [error, setError] = useState("")

  // Initialize state variables with custom useStorage hook
  const [temperature, setTemperature] = useStorage(
    "openai_temperature",
    async (v) => (v === undefined ? 0.0 : v)
  )
  const [history, setHistory] = useStorage("openai_history", async (v) =>
    v === undefined ? [] : v
  )
  const [key, setKey] = useStorage("openai_key")
  const [maxTokens, setMaxTokens] = useStorage("openai_max_tokens")
  const [model, setModel] = useStorage("openai_model")

  // Get the active tab and execute a script to get the selected text
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    // Retrieve the active tab from the list of tabs returned by the query
    const activeTab = tabs[0]

    // Execute a content script to get the selected text on the active tab
    chrome.scripting.executeScript(
      {
        target: { tabId: activeTab.id, allFrames: true }, // The tab to execute the script on
        func: getTextSelection // The function to be executed in the content script
      },
      // This function will be called with the results of the script execution
      (injectionResults) => {
        // Loop through the results of the script execution
        for (let result of injectionResults) {
          // Check if the result is not empty, undefined or equal to the current selection
          if (
            result.result !== "" &&
            result.result !== undefined &&
            result.result !== selection
          ) {
            // Update the selection with the result
            selection = result.result as string
            console.log("Selected text: " + selection)
            // Set the prompt to include the selected text
            setPrompt("{SELECTION}")
          }
        }
      }
    )
  })

  // Generate a prompt using OpenAI's GPT-3 API

  async function noAIsave() {
    const params = {
      prompt: prompt.replaceAll("{SELECTION}", selection),
    }
    // This function saves a file to the user's device with the specified data, name, and type
    const saveFile = async ({
      data, // The 'data' parameter is the content of the file
      name,
      type
    }) => {
      // Function to get the URL of the active tab in the current window
      async function getSourceURL() {
        // Use the Chrome Tabs API to query for the active tab in the last focused window
        const tabs = await chrome.tabs.query({
          active: true,
          lastFocusedWindow: true
        });
        // Return the URL of the first (and only) tab in the array of active tabs
        return tabs[0].url;
      }
      // Call the getSourceURL() function to get the source URL of the active tab
      const sourceURL = await getSourceURL();
      // Add the source location URL to the end of the file content
      data = data + `\n\n > Source: ${sourceURL}`

      const bytes = new TextEncoder().encode(data);
      const blob = new Blob([bytes], { type: `${type};charset=utf-8` });
      // The function prompts the user to choose where to save the file and what format to save it in
      const fileHandle = await window.showSaveFilePicker({
        excludeAcceptAllOption: true,
        suggestedName: name,
        types: [
          {
            description: 'Text file',
            accept: { 'text/plain': ['.txt'] },
          },
          {
            description: 'Markdown file',
            accept: { 'text/markdown': ['.md'] },
          }
        ]
      });

      const writableStream = await fileHandle.createWritable();
      await writableStream.write(blob);
      await writableStream.close();
    }
    try {
      await saveFile({
        data: selection,
        type: "text/markdown",
        name: "note.md"
      })
    } catch (error) {
      return
    }
  }

  // This async function creates a new completion by sending a POST request to the OpenAI API with the given params
  async function createCompletion() {
    const params = {
      prompt: prompt.replaceAll("{SELECTION}", selection),
      temperature: temperature,
      max_tokens: maxTokens,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      model: model
    }
    // Set up the request options
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key
      },
      body: JSON.stringify(params)
    }
    // Store the current button text and change it to indicate loading
    const oldButtonText = buttonText
    setButtonText("Generating...")
    // Send the request to the OpenAI API and store the response
    const response = await fetch(
      "https://api.openai.com/v1/completions",
      requestOptions
    )
    // Restore the button text
    setButtonText(oldButtonText)

    // Parse the response as JSON
    const responseJson = await response.json()
    // Check for errors in the response
    if (responseJson.error) {
      setError(responseJson.error)
      return
    }

    // Extract and filter the text from the response
    const filteredText = responseJson.choices[0].text
      .split(/\r?\n/) // Split input text into an array of lines
      .filter((line) => line.trim() !== "") // Filter out lines that are empty or contain only whitespace
      .join("\n") // Join line array into a string

    // Set the result state to the filtered text
    setResult(filteredText)

    // Add the filtered text to the beginning of the history array
    const newHistory = [filteredText, ...history]
    setHistory(newHistory)

    // This function saves a file to the user's device with the specified data, name, and type
    const saveFile = async ({
      data, // The 'data' parameter is the content of the file
      name,
      type
    }) => {
      // Function to get the URL of the active tab in the current window
      async function getSourceURL() {
        // Use the Chrome Tabs API to query for the active tab in the last focused window
        const tabs = await chrome.tabs.query({
          active: true,
          lastFocusedWindow: true
        });
        // Return the URL of the first (and only) tab in the array of active tabs
        return tabs[0].url;
      }
      // Call the getSourceURL() function to get the source URL of the active tab
      const sourceURL = await getSourceURL();
      // Add the source location URL to the end of the file content
      data = data + `\n\n > Source: ${sourceURL}`

      const bytes = new TextEncoder().encode(data);
      const blob = new Blob([bytes], { type: `${type};charset=utf-8` });
      // The function prompts the user to choose where to save the file and what format to save it in
      const fileHandle = await window.showSaveFilePicker({
        excludeAcceptAllOption: true,
        suggestedName: name,
        types: [
          {
            description: 'Text file',
            accept: { 'text/plain': ['.txt'] },
          },
          {
            description: 'Markdown file',
            accept: { 'text/markdown': ['.md'] },
          }
        ]
      });

      const writableStream = await fileHandle.createWritable();
      await writableStream.write(blob);
      await writableStream.close();
    }
    try {
      await saveFile({
        data: filteredText,
        type: "text/markdown",
        name: "note.md"
      })
    } catch (error) {
      return
    }
  }

  /**
   * Evaluate code in sandboxed iframe.
   * @param {string} code The code to evaluate
   */
  //Function that evaluates a given code in a sandboxed environment within an iframe
  function evalInSandbox(code: string): void {
    // Get iframe element that holds a reference for the "sandbox" environment
    const iframe = document.getElementById("sandbox") as HTMLIFrameElement
    // Add event listener to the window object to listen for messages from the sandboxed environment and logs them to the console
    window.addEventListener("message", (event) => {
      console.log("EVAL output: " + event.data)
    })
    // Post message containing code to sandbox
    iframe.contentWindow.postMessage(code, "*")
  }

  // Function that updates the temperature value in the component's state based on a new value from an input event. The new value is cast as a number using 'as number'
  const handleTemperatureChange = (
    event: Event,
    newValue: number | number[]
  ) => {
    // Update temperature value in state based on new value from input
    setTemperature(newValue as number)
  }

  return (
    <Stack
      direction="column"
      minWidth={550}
      spacing={2}
      justifyContent="flex-start">
      {/* Error modal */}
      <Modal open={error !== ""} onClose={() => setError("")}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 300,
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 4
          }}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Error: Please check your API key
          </Typography>
        </Box>
      </Modal>

      {/* History modal with vertical scrolling and clickable items */}
      <Modal open={openHistory}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 4
          }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography id="modal-modal-title" variant="h6" component="h2">
              History
            </Typography>
            <IconButton onClick={setHistory.bind(null, [])}>
              <Tooltip title="Clear history">
                <DeleteIcon />
              </Tooltip>
            </IconButton>
          </Stack>
          <Divider />
          <Box sx={{ overflowY: "scroll", height: 400 }}>
            <List>
              {history && history.length > 0 ? ( // If history exists and is not empty
                history.map((item, index) => (
                  // If item is clicked copy item to prompt and close the modal
                  <ListItemButton
                    key={index}
                    onClick={() => {
                      setPrompt(item)
                      setOpenHistory(false)
                    }}>
                    <ListItemText primary={index + 1 + ". " + item} />
                  </ListItemButton>
                ))
              ) : (
                <ListItemButton>
                  <ListItemText primary="<empty>" />
                </ListItemButton>
              )}
            </List>
          </Box>
        </Box>
      </Modal>

      <Stack direction="row" justifyContent="space-between">
        <Typography variant="h5">AI Companion</Typography>

        <Stack direction="row" spacing={1}>
          {/* History button */}
          <IconButton onClick={() => setOpenHistory(true)}>
            <Tooltip title="History">
              <HistoryIcon />
            </Tooltip>
          </IconButton>

          {/* Settings button */}
          <IconButton onClick={() => chrome.runtime.openOptionsPage()}>
            <Tooltip title="Settings">
              <SettingsIcon />
            </Tooltip>
          </IconButton>
        </Stack>
      </Stack>

      <TextField
        label="Prompt"
        multiline
        autoFocus
        minRows={2}
        onChange={(e) => setPrompt(e.target.value)}
        value={prompt}
        onKeyDown={(e) => {
          if (e.getModifierState("Control") && e.key === "Enter") {
            createCompletion()
          }
          if (e.getModifierState("Control") && e.key === "c") {
            navigator.clipboard.writeText(result) // Copy to clipboard
          }
        }}
      />

      <TextField
        label={
          selection === ""
            ? "Selected Text (None)"
            : "Selected Text {SELECTION}"
        }
        multiline
        disabled
        InputProps={{ readOnly: true }}
        value={selection}
        minRows={1}
      />

      <Stack direction="row" spacing={2} justifyContent="flex-start">
        <Typography variant="subtitle2">Temperature:</Typography>

        <Slider
          size="small"
          step={0.1}
          min={0.0}
          max={1.0}
          marks
          valueLabelDisplay="auto"
          value={temperature}
          onChange={handleTemperatureChange}
        />
      </Stack>

      <Button variant="contained" onClick={createCompletion}>
        {buttonText}
      </Button>

      <Divider />

      <TextField
        label="Result (Ctrl+C➔Clipboard)"
        multiline
        InputProps={{ readOnly: true }}
        value={result}
        minRows={7}
      />

      <iframe
        src="up_/sandbox.html"
        id="sandbox"
        style={{ display: "none" }}></iframe>
    </Stack>
  )
}

export default IndexPopup
