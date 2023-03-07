/**
 *  OpenAI GPT-3 Text Generator (Chrome extension)
 *
 * (c) 2022 Mark Kretschmann <kretschmann@kde.org>
 *
 */
import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import FormControl from "@mui/material/FormControl"
import Input from "@mui/material/Input"
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

  return (
    <Stack maxWidth={600} spacing={2}>
      <Typography variant="h5">OpenAI Extension Options</Typography>

      <TextField
        label="OpenAI API key"
        autoFocus
        onChange={(e) => setKey(e.target.value)}
        value={key}
      />
      <FormControl>
        <InputLabel id="model-select-label">Model</InputLabel>
        <Select
          labelId="model-select-label"
          label="Model"
          value={model}
          onChange={(e) => setModel(e.target.value)}>
          <MenuItem value="gpt-3.5-turbo">gpt-3.5-turbo</MenuItem>
          <MenuItem value="code-davinci-002">code-davinci-002</MenuItem>
          <MenuItem value="text-davinci-003">text-davinci-003</MenuItem>
        </Select>
      </FormControl>
      <Stack direction="row" spacing={2} justifyContent="flex-start">
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
  )
}

export default OptionsIndex