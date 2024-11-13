export const speak = (text: string, voice: string) => {
    if (!window.speechSynthesis) {
        console.error('语音合成不支持此浏览器');
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN'; // 设置语言为中文

    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.name === voice) || voices[0];
    utterance.voice = selectedVoice;

    try {
        window.speechSynthesis.speak(utterance);
    } catch (error) {
        console.error('语音合成失败:', error);
    }
};