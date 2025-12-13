"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Moon, Sun } from "lucide-react"
import { PREBUILT_LISTS } from "@/lib/prebuilt-lists"

const ALLOWED_VOICES = [
  "Samantha",
  "Google US English",
  "Martha",
  "Aaron",
  "Arthur",
  "Daniel (English (United Kingdom))",
  "Gordon",
  "Rishi",
  "Good News",
]

export default function RandomPicker() {
  const [inputText, setInputText] = useState("")
  const [selectedItem, setSelectedItem] = useState("")
  const [isBlurred, setIsBlurred] = useState(false)
  const [keepBlurred, setKeepBlurred] = useState(true)
  const [selectedList, setSelectedList] = useState("custom")
  const [volume, setVolume] = useState([1])
  const [rate, setRate] = useState([1])
  const [pitch, setPitch] = useState([1])
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isIntervalEnabled, setIsIntervalEnabled] = useState(false)
  const [intervalSeconds, setIntervalSeconds] = useState(5)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const voiceInitializedRef = useRef(false)

  useEffect(() => {
    const savedText = localStorage.getItem("randomPickerText")
    const savedList = localStorage.getItem("randomPickerList")
    const savedVolume = localStorage.getItem("randomPickerVolume")
    const savedRate = localStorage.getItem("randomPickerRate")
    const savedPitch = localStorage.getItem("randomPickerPitch")
    const savedDarkMode = localStorage.getItem("randomPickerDarkMode")
    const savedKeepBlurred = localStorage.getItem("randomPickerKeepBlurred")

    if (savedText) setInputText(savedText)
    if (savedList) setSelectedList(savedList)
    if (savedVolume) setVolume([Number.parseFloat(savedVolume)])
    if (savedRate) setRate([Number.parseFloat(savedRate)])
    if (savedPitch) setPitch([Number.parseFloat(savedPitch)])
    if (savedDarkMode) {
      const darkMode = savedDarkMode === "true"
      setIsDarkMode(darkMode)
      document.documentElement.classList.toggle("dark", darkMode)
    }
    if (savedKeepBlurred !== null) {
      setKeepBlurred(savedKeepBlurred === "true")
    }
  }, [])

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis
        .getVoices()
        .filter((voice) => voice.lang.startsWith("en"))
        .filter((voice) => ALLOWED_VOICES.some((str) => voice.name.includes(str)))
        .sort((a, b) => {
          const indexA = ALLOWED_VOICES.findIndex((allowed) => a.name.includes(allowed))
          const indexB = ALLOWED_VOICES.findIndex((allowed) => b.name.includes(allowed))
          return indexA - indexB
        })

      if (availableVoices.length > 0) {
        setVoices(availableVoices)

        const savedVoice = localStorage.getItem("randomPickerVoice")

        if (savedVoice && availableVoices.some((v) => v.name === savedVoice)) {
          setSelectedVoice(savedVoice)
        } else {
          const defaultVoice = availableVoices.find((v) => v.name.includes(ALLOWED_VOICES[0])) || availableVoices[0]
          setSelectedVoice(defaultVoice.name)
        }
      }
    }

    if ("speechSynthesis" in window) {
      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem("randomPickerText", inputText)
    }, 300)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [inputText])

  useEffect(() => {
    localStorage.setItem("randomPickerList", selectedList)
  }, [selectedList])

  useEffect(() => {
    localStorage.setItem("randomPickerVolume", volume[0].toString())
  }, [volume])

  useEffect(() => {
    localStorage.setItem("randomPickerRate", rate[0].toString())
  }, [rate])

  useEffect(() => {
    localStorage.setItem("randomPickerPitch", pitch[0].toString())
  }, [pitch])

  useEffect(() => {
    if (selectedVoice) {
      localStorage.setItem("randomPickerVoice", selectedVoice)
    }
  }, [selectedVoice])

  useEffect(() => {
    localStorage.setItem("randomPickerDarkMode", isDarkMode.toString())
    document.documentElement.classList.toggle("dark", isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    localStorage.setItem("randomPickerKeepBlurred", keepBlurred.toString())
  }, [keepBlurred])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const handleListChange = (value: string) => {
    setSelectedList(value)
    const selectedPrebuiltList = PREBUILT_LISTS.find((list) => list.value === value)
    if (selectedPrebuiltList && value !== "custom") {
      setInputText(selectedPrebuiltList.items.join("\n"))
    }
  }

  const handleRandomPick = () => {
    const lines = inputText.split("\n").filter((line) => line.trim() !== "")

    if (lines.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * lines.length)
    const pickedItem = lines[randomIndex].trim()

    setSelectedItem(pickedItem)
    setIsBlurred(keepBlurred)

    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(pickedItem)
      utterance.volume = volume[0]
      utterance.rate = rate[0]
      utterance.pitch = pitch[0]

      if (selectedVoice) {
        const voice = voices.find((v) => v.name === selectedVoice)
        if (voice) utterance.voice = voice
      }

      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    }
  }

  const handlePickOrToggle = () => {
    if (isAutoPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsAutoPlaying(false)
    } else if (isIntervalEnabled && intervalSeconds > 0) {
      setIsAutoPlaying(true)
      handleRandomPick()

      intervalRef.current = setInterval(() => {
        handleRandomPick()
      }, intervalSeconds * 1000)
    } else {
      handleRandomPick()
    }
  }

  const handleUnblur = () => {
    setIsBlurred(false)
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1" />
          <div className="flex-1 text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-balance">OMM/CS Practical TTS</h1>
            <p className="text-muted-foreground text-balance">Enter items on separate lines and pick one randomly</p>
          </div>
          <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
              <Moon className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            <div className="flex flex-col justify-between gap-4 lg:w-[300px] flex-shrink-0">
              <Card>
                <CardHeader>
                  <CardTitle>Pre-built Lists</CardTitle>
                  <CardDescription>Select a template list</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedList} onValueChange={handleListChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue className="truncate overflow-hidden" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREBUILT_LISTS.map((list) => (
                        <SelectItem key={list.value} value={list.value}>
                          <span className="truncate block">{list.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Voice Settings</CardTitle>
                  <CardDescription>Customize text-to-speech</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Voice</Label>
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select voice" className="truncate overflow-hidden" />
                      </SelectTrigger>
                      <SelectContent>
                        {voices.map((voice) => (
                          <SelectItem key={voice.name} value={voice.name}>
                            <span className="truncate block">{voice.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Volume</Label>
                      <span className="text-sm text-muted-foreground">{(volume[0] * 100).toFixed(0)}%</span>
                    </div>
                    <Slider value={volume} onValueChange={setVolume} min={0} max={1} step={0.1} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Speech Rate</Label>
                      <span className="text-sm text-muted-foreground">{rate[0].toFixed(1)}x</span>
                    </div>
                    <Slider value={rate} onValueChange={setRate} min={0.5} max={2} step={0.1} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Pitch</Label>
                      <span className="text-sm text-muted-foreground">{pitch[0].toFixed(1)}</span>
                    </div>
                    <Slider value={pitch} onValueChange={setPitch} min={0} max={2} step={0.1} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="flex-1 h-full flex flex-col">
              <CardHeader>
                <CardTitle>Enter Your List</CardTitle>
                <CardDescription>Type each item on a new line</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col min-h-0">
                <Textarea
                  placeholder="Apple&#10;Banana&#10;Orange&#10;Grape&#10;Strawberry"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value)
                    setSelectedList("custom")
                  }}
                  className="resize-none h-[15rem] lg:h-[400px] overflow-y-auto"
                />
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isIntervalEnabled}
                        onCheckedChange={(checked) => {
                          setIsIntervalEnabled(checked)
                          if (!checked && isAutoPlaying) {
                            if (intervalRef.current) {
                              clearInterval(intervalRef.current)
                              intervalRef.current = null
                            }
                            setIsAutoPlaying(false)
                          }
                        }}
                      />
                      <Label>Auto-cycle every</Label>
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        value={intervalSeconds}
                        onChange={(e) => setIntervalSeconds(Number.parseInt(e.target.value) || 1)}
                        className="w-20"
                        disabled={!isIntervalEnabled}
                      />
                      <span className="text-sm text-muted-foreground">seconds</span>
                    </div>
                  </div>
                  <Button
                    onClick={handlePickOrToggle}
                    className="flex-1"
                    size="lg"
                    disabled={inputText.trim() === ""}
                    variant={isAutoPlaying ? "destructive" : "default"}
                  >
                    {isAutoPlaying ? "Stop Automatic Selection" : "Pick Random Item"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {selectedItem && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Selected Item</CardTitle>
                    <CardDescription>Click to reveal</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="keep-blurred" className="text-sm">
                      Keep blurred
                    </Label>
                    <Switch id="keep-blurred" checked={keepBlurred} onCheckedChange={setKeepBlurred} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  onClick={handleUnblur}
                  className={`min-h-[100px] flex items-center justify-center rounded-lg bg-muted p-6 cursor-pointer transition-all hover:bg-muted/80 ${
                    isBlurred ? "blur-md select-none" : ""
                  }`}
                >
                  <p className="text-2xl md:text-3xl font-semibold text-center text-balance">{selectedItem}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
