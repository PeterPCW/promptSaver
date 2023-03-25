import React from 'react';

import { createGlobalStyle } from 'styled-components';
import Box from '@mui/material/Box';
import FormControl from "@mui/material/FormControl"
import InputLabel from "@mui/material/InputLabel"
import MenuItem from "@mui/material/MenuItem"
import Select from "@mui/material/Select"
import Slider from "@mui/material/Slider"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"

import { useStorage } from "@plasmohq/storage/hook"

function OptionsIndex() {
  // Get or set the API key stored in localStorage
  const [key, setKey] = useStorage("openai_key")
  // Get or set the model name stored in localStorage
  const [model, setModel] = useStorage("openai_model", async (v) =>
    v === undefined ? "gpt-3.5-turbo" : v
  )
  // Get or set the maximum number of tokens for the API request stored in localStorage
  const [maxTokens, setMaxTokens] = useStorage("openai_max_tokens", async (v) =>
    v === undefined ? 512 : v
  )
  // Update the maximum number of tokens when the user changes the value
  const handleMaxTokensChange = (event: any, newValue: number | number[]) => {
    setMaxTokens(newValue as number)
  }

   // This class removes the extra padding added by the HTML <body> section that sits on top of the rendered app
   const GlobalStyle = createGlobalStyle`
      body {
         background-color:#212121;
         border-radius: 20px;
         color:#BBBBBB;
      }
   `;

   return (
      <Box sx={{ p: 0, border: '10px orange' }}>
         <GlobalStyle />
         <Stack
            maxWidth={600}
            spacing={2}
            sx={{
               bgcolor: "#212121",
               margin: 0,
               padding: 0,
            }}>
            <Typography variant="h5">OpenAI Extension Options</Typography>

            <TextField
               label="OpenAI API key"
               autoFocus
               onChange={(k) => setKey(k.target.value)}
               value={key}
               minRows={1}
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
            />
            <FormControl>
               <InputLabel id="model-select-label">Model</InputLabel>
               <Select
                  labelId="model-select-label"
                  label="Model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
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
                  }}>
                  <MenuItem value="gpt-3.5-turbo">gpt-3.5-turbo</MenuItem>
               </Select>
            </FormControl>
            <Stack
               direction="row"
               spacing={2} justifyContent="flex-start"
               sx={{
                  bgcolor: "#212121",
                     margin: 0,
                  padding: 0,
               }}>
               <Typography variant="subtitle2">Max_Tokens:</Typography>
               <Slider
                  size="small"
                  step={128}
                  min={128}
                  max={4096}
                  marks
                  valueLabelDisplay="auto"
                  value={maxTokens}
                  onChange={handleMaxTokensChange}
               />
            </Stack>
         </Stack>
      </Box>
   )
}

export default OptionsIndex