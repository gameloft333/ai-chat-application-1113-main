interface VoiceConfig {
  [key: string]: {
    model: string;
    speaker_id?: string;
    language: string;
    speed?: number;
  }
}

export const VOICE_CONFIGS: VoiceConfig = {
  voice_elon: {
    model: 'tts_models/en/vctk/vits',
    speaker_id: 'p336', // 低沉男声
    language: 'en',
    speed: 1.0
  },
  voice_mary: {
    model: 'tts_models/zh/baker/tacotron2-DDC-GST',
    language: 'zh',
    speed: 0.9
  },
  voice_lily: {
    model: 'tts_models/zh/baker/tacotron2-DDC',
    language: 'zh',
    speed: 1.1
  },
  voice_jing: {
    model: 'tts_models/zh/baker/tacotron2-DDC-GST',
    language: 'zh',
    speed: 0.8
  },
  voice_veronica: {
    model: 'tts_models/zh/baker/tacotron2-DDC-GST',
    language: 'zh',
    speed: 1.0
  },
  voice_vivian: {
    model: 'tts_models/zh/baker/tacotron2-DDC',
    language: 'zh',
    speed: 1.0
  },
  voice_dana: {
    model: 'tts_models/zh/baker/tacotron2-DDC-GST',
    language: 'zh',
    speed: 0.9
  },
  voice_sophia: {
    model: 'tts_models/zh/baker/tacotron2-DDC',
    language: 'zh',
    speed: 1.0
  },
  voice_howard: {
    model: 'tts_models/en/vctk/vits',
    language: 'en',
    speed: 1.0
  },
  voice_wendy: {
    model: 'tts_models/zh/baker/tacotron2-DDC-GST',
    language: 'zh',
    speed: 0.9
  },
  voice_jing: {
    model: 'tts_models/zh/baker/tacotron2-DDC-GST',
    language: 'zh',
    speed: 0.8
  }
}; 