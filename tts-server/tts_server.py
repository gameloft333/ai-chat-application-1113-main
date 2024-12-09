from flask import Flask, request, send_file
from flask_cors import CORS
from TTS.api import TTS
import io
import logging

app = Flask(__name__)
CORS(app)

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 初始化 TTS
try:
    tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2")
    logger.info("TTS模型加载成功")
except Exception as e:
    logger.error(f"TTS模型加载失败: {str(e)}")
    raise

@app.route('/tts', methods=['POST'])
def synthesize_speech():
    try:
        data = request.json
        text = data.get('text', '')
        language = data.get('language_name', 'zh')
        
        logger.info(f"收到TTS请求: text={text}, language={language}")
        
        # 生成语音
        wav = tts.tts(text=text, language=language)
        
        # 将音频数据转换为字节流
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