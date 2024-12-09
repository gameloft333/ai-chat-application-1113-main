import axios from 'axios';
import { VOICE_CONFIGS } from '../config/voice-config';

interface TTSConfig {
  apiUrl: string;
  model: string;
  language: string;
}

export class TTSService {
  private config: TTSConfig;

  constructor() {
    this.config = {
      apiUrl: import.meta.env.VITE_TTS_API_URL,
      model: import.meta.env.VITE_TTS_MODEL,
      language: 'zh'
    };
  }

  async synthesizeSpeech(text: string, voiceId: string): Promise<ArrayBuffer> {
    try {
      const voiceConfig = VOICE_CONFIGS[voiceId] || VOICE_CONFIGS['voice_mary']; // 默认使用 mary 的声音
      
      const response = await axios.post(
        `${this.config.apiUrl}/tts`, 
        {
          text,
          ...voiceConfig,
          model_name: voiceConfig.model
        },
        { responseType: 'arraybuffer' }
      );
      
      return response.data;
    } catch (error) {
      console.error('TTS合成失败:', error);
      throw error;
    }
  }

  async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    const audioContext = new AudioContext();
    const audioBufferSource = audioContext.createBufferSource();
    
    try {
      const decodedAudio = await audioContext.decodeAudioData(audioBuffer);
      audioBufferSource.buffer = decodedAudio;
      audioBufferSource.connect(audioContext.destination);
      audioBufferSource.start(0);
    } catch (error) {
      console.error('音频播放失败:', error);
      throw error;
    }
  }
} 