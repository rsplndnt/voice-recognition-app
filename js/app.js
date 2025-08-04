/**
 * Voice Recognition App
 * Simple and beautiful voice-to-text application
 */

class VoiceRecognitionApp {
    constructor() {
        this.recognition = null;
        this.isRecording = false;
        this.finalTranscript = '';
        
        // DOM elements
        this.micButton = document.getElementById('micButton');
        this.status = document.getElementById('status');
        this.textOutput = document.getElementById('textOutput');
        this.errorMessage = document.getElementById('errorMessage');
        
        this.init();
    }
    
    init() {
        // Check browser compatibility
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showError('お使いのブラウザは音声認識に対応していません。ChromeまたはEdgeをご利用ください。');
            return;
        }
        
        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.setupRecognition();
        this.setupEventListeners();
    }
    
    setupRecognition() {
        // Configure recognition settings
        this.recognition.lang = 'ja-JP';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        
        // Recognition event handlers
        this.recognition.onstart = () => this.onRecognitionStart();
        this.recognition.onresult = (event) => this.onRecognitionResult(event);
        this.recognition.onerror = (event) => this.onRecognitionError(event);
        this.recognition.onend = () => this.onRecognitionEnd();
    }
    
    setupEventListeners() {
        this.micButton.addEventListener('click', () => this.toggleRecording());
        
        // Keyboard accessibility
        this.micButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleRecording();
            }
        });
    }
    
    toggleRecording() {
        if (!this.isRecording) {
            this.startRecording();
        } else {
            this.stopRecording();
        }
    }
    
    startRecording() {
        this.isRecording = true;
        this.micButton.classList.add('recording');
        this.status.textContent = '録音中...';
        this.errorMessage.textContent = '';
        this.finalTranscript = this.textOutput.textContent || '';
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Recognition start error:', error);
            this.showError('音声認識を開始できませんでした。');
            this.stopRecording();
        }
    }
    
    stopRecording() {
        this.isRecording = false;
        this.micButton.classList.remove('recording');
        this.status.textContent = '';
        
        try {
            this.recognition.stop();
        } catch (error) {
            console.error('Recognition stop error:', error);
        }
    }
    
    onRecognitionStart() {
        console.log('Recognition started');
    }
    
    onRecognitionResult(event) {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                this.finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        this.textOutput.textContent = this.finalTranscript + interimTranscript;
    }
    
    onRecognitionError(event) {
        console.error('Recognition error:', event.error);
        
        const errorMessages = {
            'no-speech': '音声が検出されませんでした。',
            'audio-capture': 'マイクが見つかりません。',
            'not-allowed': 'マイクへのアクセスが拒否されました。',
            'network': 'ネットワークエラーが発生しました。',
            'aborted': '音声認識が中断されました。',
            'service-not-allowed': '音声認識サービスが利用できません。'
        };
        
        const message = errorMessages[event.error] || `エラーが発生しました: ${event.error}`;
        this.showError(message);
        this.stopRecording();
    }
    
    onRecognitionEnd() {
        if (this.isRecording) {
            // Continue recording
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Recognition restart error:', error);
                this.stopRecording();
            }
        }
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VoiceRecognitionApp();
});