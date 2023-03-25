import React, { useState } from 'react';

import { createGlobalStyle } from 'styled-components';
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
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"

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
  const [prompt, setPrompt] = useState("Annotate the code snippet below with inline comments for every line that describe all of the classes, functions, methods, loops, cases, and variables in simple terms. Return all of the comments and original code in a single code snippet.\n\nThe rest of this prompt is the code snippet:\n\n")
  const [buttonText, setButtonText] = useState("Generate")
  const [result, setResult] = useState("Open AI Response")
  const [error, setError] = useState("")

  // Initialize state variables with custom useStorage hook
  const [key, setKey] = useStorage("openai_key")
  const [maxTokens, setMaxTokens] = useStorage("openai_max_tokens")
  const [model, setModel] = useStorage("openai_model")
  const [history, setHistory] = useStorage("openai_history", async (v) =>
    v === undefined ? [] : v
  )
  const [temperature, setTemperature] = useStorage(
    "openai_temperature",
    async (v) => (v === undefined ? 0.0 : v)
  )
  
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
        for (const result of injectionResults) {
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
            const newPrompt = prompt + selection
            setPrompt(newPrompt)
          }
        }
      }
    )
  })

  // Generate a prompt using OpenAI's GPT-3 API

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
    data = data + `\n\n// Source: ${sourceURL} \n\n/*\nExplanation:\n\n*/`

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

  async function noAIsave() {
    // Save the result field to an .md file - for a manual copy/paste without connecting to openAI
    try {
      await saveFile({
        data: result,
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
      //prompt: prompt.replaceAll("{SELECTION}", selection),
      temperature: temperature,
      max_tokens: maxTokens,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      model: model,
      messages: [{ role: "user", content: "" }]
    }

    //Build the prompt into the messages format for a chat completion endpoint
    const chatParams = params
    chatParams.messages = [{ role: "user", content: prompt + selection }];

    // Set up the request options
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key
      },
      body: JSON.stringify(chatParams)
    }
    // Store the current button text and change it to indicate loading
    const oldButtonText = buttonText
    setButtonText("Generating...")
    // Send the request to the OpenAI API and store the response
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
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
    const filteredText = responseJson.choices[0].message.content
      .split(/\r?\n/) // Split input text into an array of lines
      .filter((line) => line.trim() !== "") // Filter out lines that are empty or contain only whitespace
      .join("\n") // Join line array into a string

    // Set the result state to the filtered text
    setResult(filteredText)

    // Add the filtered text to the beginning of the history array
    const newHistory = [filteredText, ...history]
    setHistory(newHistory)

    // Save the returned text from OpenAI API to an .md file
    /* Fails because of error I don't want to debug, forcing second click of "Save to File" button fixes this
    try {
      await saveFile({
        data: filteredText,
        type: "text/markdown",
        name: "note.md"
      })
    } catch (error) {
      setResult(...result, error.message)
      return
    }*/
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
  
  // This is an asynchronous function that moves the caret to the end of the input field when called
  async function moveCaretAtEnd(e) {
    // Declare a constant variable called temp_value and assign it the value of the input field
    const temp_value = e.target.value
    // Set the value of the input field to an empty string
    e.target.value = ''
    // Set the value of the input field to the original value stored in temp_value, which moves the caret to the end
    e.target.value = temp_value
  }
  
   // This class removes the extra padding added by the HTML <body> section that sits on top of the rendered app
   const GlobalStyle = createGlobalStyle`
      body {
         background-color:#212121;
         border-radius: 20px;
      }
   `;

   return (
      <Box sx={{ p: 0, border: '10px orange' }}>
         <GlobalStyle />
         <Stack
            direction="column"
            minWidth={550}
            spacing={2}
            sx={{
               bgcolor: "#212121",
               margin: 0,
               padding: 0,
            }}
            justifyContent="flex-start">
            {/* Error modal */}
            <Modal
               open={error !== ""}
               onClose={() => setError("")}
               sx={{
               margin: 0,
               padding: 0,
               }}>
               <Box
                  sx={{
                     position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 300,
                  bgcolor: "#212121",
                  margin: 0,
                  padding: 0,
                  border: "none",
                  boxShadow: 24,
               }}>
                  <Typography
                     id="modal-modal-title"
                  variant="h6"
                  component="h2"
                  sx={{ color: "#BBBBBB" }}>
                     Error: Please check your API key <br />
                     {error.message}
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
                  width: 300,
                  bgcolor: "#212121",
                  margin: 0,
                  padding: 0,
                  border: "none",
                  boxShadow: 24,
               }}>
                  <Stack
                     direction="row"
                     justifyContent="space-between"
                     sx={{
                        bgcolor: "#212121",
                        margin: 0,
                        padding: 0,
                     }}>
                     <Typography variant="h6" component="h2" sx={{ color: "#BBBBBB" }}>
                        History
                     </Typography>
                     <IconButton onClick={setHistory.bind(null, [])}>
                        <Tooltip title="Clear history">
                           <DeleteIcon />
                        </Tooltip>
                     </IconButton>
                  </Stack>
                  <Divider />
                  <Box
                     sx={{
                        overflowY: "scroll",
                        height: 400,
                        bgcolor: "#212121",
                        margin: 0,
                        padding: 0,
                     }}>
                     <List>
                        {history && history.length > 0 ? (
                           // If history exists and is not empty
                           history.map((item, index) => (
                              // If item is clicked copy item to prompt and close the modal
                              <ListItemButton
                                 key={index}
                                 onClick={() => {
                                 setResult(item);
                                 setOpenHistory(false);
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
          
            <Stack
               direction="row"
               justifyContent="space-between"
               sx={{
                  bgcolor: "#212121",
                  paddingLeft: "0px",
                  paddingRight: "0px"
               }}>
               <Typography variant="h5" sx={{color: "#BBBBBB" }}>AI Code Doc</Typography>
               <Stack direction="row" spacing={1}>
                  {/* History button */}
                  <IconButton onClick={() => setOpenHistory(true)}>
                     <Tooltip title="History">
                        <HistoryIcon sx={{color: "#BBBBBB" }}/>
                     </Tooltip>
                  </IconButton>
                  {/* Settings button */}
                  <IconButton onClick={() => chrome.runtime.openOptionsPage()}>
                     <Tooltip title="Settings">
                        <SettingsIcon sx={{color: "#BBBBBB" }}/>
                     </Tooltip>
                  </IconButton>
               </Stack>
            </Stack>
            
            <TextField
               label="Code Snippet"
               sx={{
                  backgroundColor: "#212121",
                  color: "#BBBBBB",
                  "& .MuiInputBase-root": {
                     border: "none",
                     margin: 0,
                     padding: 1,
                     "& .MuiOutlinedInput-root": {
                        borderColor: "#BBBBBB",
                        color: "#BBBBBB"
                     },
                     "& .MuiOutlinedInput-root.Mui-focused": {
                        "& > fieldset": {
                           borderColor: "#BBBBBB"
                        },
                        '&:hover fieldset': {
                           borderColor: "#BBBBBB"
                        },
                        '&.Mui-focused fieldset': {
                           borderColor: "#BBBBBB"
                        },
                     },
                     '&.Mui-focused fieldset': {
                        borderColor: '#BBBBBB',
                     },
                     '& label.Mui-focused': {
                        display: "none",
                     }
                  }
               }}
               inputProps={{ style: { color: "#BBBBBB" } }}
               multiline
               autofocus
               onFocus={(p) => moveCaretAtEnd(p)}
               minRows={4}
               onChange={(p) => setPrompt(p.target.value)}
               value={prompt}
               onKeyDown={(p) => {
                  if (r.getModifierState("Control") && p.key === "c") {
                     navigator.clipboard.writeText(result) // Copy result to clipboard
                  }
               }}
            />
            <Button
               variant="contained"
               sx={{
                  backgroundColor: "#555",
                  color: "#BBBBBB",
                  "&:hover": {
                     backgroundColor: "#666"
                  }
               }}
               onClick={createCompletion}>
               {buttonText}
            </Button>
            <Divider sx={{ backgroundColor: "#666" }} />
            <TextField
               label="Result"
               sx={{
                  backgroundColor: "#212121",
                  color: "#BBBBBB",
                  "& .MuiInputBase-root": {
                     border: "none",
                     margin: 0,
                     padding: 1,
                     "& .MuiOutlinedInput-root": {
                        borderColor: "#BBBBBB",
                        color: "#BBBBBB"
                     },
                     "& .MuiOutlinedInput-root.Mui-focused": {
                        "& > fieldset": {
                           borderColor: "#BBBBBB"
                        },
                        '&:hover fieldset': {
                           borderColor: "#BBBBBB"
                        },
                        '&.Mui-focused fieldset': {
                           borderColor: "#BBBBBB"
                        },
                     },
                     '&.Mui-focused fieldset': {
                        borderColor: '#BBBBBB',
                     },
                     '& label.Mui-focused': {
                        display: "none",
                     }
                  }
               }}
               inputProps={{ style: { color: "#BBBBBB" } }}
               multiline
               minRows={4}
               onChange={(r) => setResult(r.target.value)}
               value={result}
               onFocus={(r) => r.target.select()}
               onKeyDown={(r) => {
                  if (r.getModifierState("Control") && r.key === "c") {
                     navigator.clipboard.writeText(result) // Copy to clipboard
                  }
                  if (e.getModifierState("Control") && e.key === "Enter") {
                     noAIsave() // same as clicking Safe to File
                  }
               }}
            />

            <Button
               variant="contained"
               sx={{
                  backgroundColor: "#555",
                  color: "#BBBBBB",
                  "&:hover": {
                     backgroundColor: "#666"
                  }
               }}
               onClick={noAIsave}>
               Save to File
            </Button>
            <iframe
               src="up_/sandbox.html"
               id="sandbox"
               style={{ display: "none" }}>
            </iframe>
         </Stack>
      </Box>
   )
}

export default IndexPopup