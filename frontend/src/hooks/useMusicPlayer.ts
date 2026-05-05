import { useEffect, useRef, useState } from 'react'

export function useMusicPlayer(playlist: string[], enabled: boolean) {
  const [musicBoost, setMusicBoost] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const beatFrameRef = useRef<number | null>(null)
  const trackIndexRef = useRef(0)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const startBeatLoop = () => {
    const analyser = analyserRef.current
    const dataArray = dataArrayRef.current
    if (!analyser || !dataArray) return
    const tick = () => {
      analyser.getByteFrequencyData(dataArray)
      const sum = Array.from(dataArray.subarray(0, 24)).reduce((acc, v) => acc + v, 0)
      setMusicBoost(Math.min(1, sum / 24 / 96))
      beatFrameRef.current = requestAnimationFrame(tick)
    }
    if (beatFrameRef.current) cancelAnimationFrame(beatFrameRef.current)
    beatFrameRef.current = requestAnimationFrame(tick)
  }

  const stopBeatLoop = () => {
    if (beatFrameRef.current) { cancelAnimationFrame(beatFrameRef.current); beatFrameRef.current = null }
    setMusicBoost(0)
  }

  const setupAudioGraph = (audio: HTMLAudioElement) => {
    if (audioContextRef.current) return
    const context = new AudioContext()
    const source = context.createMediaElementSource(audio)
    const analyser = context.createAnalyser()
    analyser.fftSize = 128
    const dataArray = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>
    source.connect(analyser)
    analyser.connect(context.destination)
    audioContextRef.current = context
    analyserRef.current = analyser
    dataArrayRef.current = dataArray
  }

  const playAtIndex = async (index: number) => {
    if (!playlist.length) return
    const audio = audioRef.current ?? new Audio()
    audioRef.current = audio
    audio.loop = false
    audio.preload = 'auto'
    audio.src = playlist[index]
    trackIndexRef.current = index
    setupAudioGraph(audio)
    try {
      if (audioContextRef.current?.state === 'suspended') await audioContextRef.current.resume()
      await audio.play()
      startBeatLoop()
    } catch { stopBeatLoop() }
  }

  const stop = () => {
    stopBeatLoop()
    audioRef.current?.pause()
  }

  const play = () => { void playAtIndex(trackIndexRef.current) }

  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    const onEnded = () => { void playAtIndex((trackIndexRef.current + 1) % playlist.length) }
    const onError = () => {
      const next = (trackIndexRef.current + 1) % playlist.length
      if (next !== trackIndexRef.current) { void playAtIndex(next) } else { stopBeatLoop() }
    }
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    const kickstart = () => {
      if (enabledRef.current) void playAtIndex(trackIndexRef.current)
      window.removeEventListener('pointerdown', kickstart)
      window.removeEventListener('keydown', kickstart)
    }
    window.addEventListener('pointerdown', kickstart)
    window.addEventListener('keydown', kickstart)
    void playAtIndex(trackIndexRef.current)

    return () => {
      window.removeEventListener('pointerdown', kickstart)
      window.removeEventListener('keydown', kickstart)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
      stopBeatLoop()
      audio.pause()
      audio.src = ''
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') void audioContextRef.current.close()
    }
  }, [])

  return { musicBoost, play, stop }
}
