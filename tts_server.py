from flask import Flask, request, send_file
from flask_cors import CORS
from TTS.api import TTS
import io
import logging
import torch

app = Flask(__name__)
CORS(app)

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TTSManager:
    def __init__(self):
        self.models = {}
        
    def get_model(self, model_name: str) -> TTS:
        if model_name not in self.models:
            self.models[model_name] = TTS(model_name=model_name)
        return self.models[model_name]

tts_manager = TTSManager()

@app.route('/tts', methods=['POST'])
def synthesize_speech():
    try:
        data = request.json
        text = data.get('text', '')
        model_name = data.get('model', 'tts_models/multilingual/multi-dataset/xtts_v2')
        language = data.get('language', 'zh')
        speed = data.get('speed', 1.0)
        speaker_id = data.get('speaker_id', None)
        
        # 获取对应的模型
        tts = tts_manager.get_model(model_name)
        
        # 生成语音
        wav = tts.tts(
            text=text,
            language=language,
            speaker_name=speaker_id if speaker_id else None,
            speed=speed
        )
        
        # 转换为音频流
        audio_buffer = io.BytesIO()
        tts.save_wav(wav, audio_buffer)
        audio_buffer.seek(0)
        
        return send_file(
            audio_buffer,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='speech.wav'
        )
    except Exception as e:
        logger.error(f"语音合成失败: {str(e)}")
        return {'error': str(e)}, 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002) 