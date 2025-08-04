import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Info } from 'lucide-react';
import './App.css';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState('');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  
  const recognitionRef = useRef(null);
  const pressTimerRef = useRef(null);
  const isPressingRef = useRef(false);
  const isLongPressRef = useRef(false);
  const isHandlingEventRef = useRef(false);
  
  // 設定
  const BUTTON_KEY = 76; // Lキー
  const REMOTE_KEY = 13; // Enterキー（遠隔ボタン）
  const LONG_PRESS_DURATION = 300; // 長押し判定時間（ms）

  // 音声認識の初期化
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('お使いのブラウザは音声認識に対応していません。');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'ja-JP';
    recognition.continuous = false; // 連続認識を無効化
    recognition.interimResults = true;

    recognition.onstart = () => {
      console.log('Recognition started');
      setError('');
      if (mode === 'tap') {
        setStatus('録音中... (話し終わると自動停止)');
      } else if (mode === 'hold') {
        setStatus('録音中... (離すと停止)');
      }
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptText = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcriptText + ' ';
        } else {
          interim += transcriptText;
        }
      }

      if (final) {
        setTranscript(prev => prev + final);
      }
      
      setInterimTranscript(interim);
    };

    recognition.onspeechend = () => {
      console.log('Speech ended');
      // 単押しモードの場合、発話が終了したら自動停止
      if (mode === 'tap') {
        recognition.stop();
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // `no-speech` は無音を検知、`aborted` は手動停止
        // `isRecording` が true の場合のみエラーとして扱う
        if (isRecording) {
            console.error('Recognition stopped due to no-speech or abortion');
        }
        return;
      }
      
      console.error('Recognition error:', event.error);
      const errorMessages = {
        'audio-capture': 'マイクが見つかりません。',
        'not-allowed': 'マイクへのアクセスが拒否されました。',
        'network': 'ネットワークエラーが発生しました。'
      };
      setError(errorMessages[event.error] || `エラー: ${event.error}`);
      stopRecording();
    };

    recognition.onend = () => {
      console.log('Recognition ended');
      setIsRecording(false);
      setStatus('');
      setMode('');
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [mode, isRecording]);

  // 録音開始
  const startRecording = (recordingMode) => {
    if (isRecording) return;
    
    console.log('Starting recording in', recordingMode, 'mode');
    setIsRecording(true);
    setMode(recordingMode);
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Start error:', error);
      setError('音声認識を開始できませんでした。');
      setIsRecording(false);
      setStatus('');
      setMode('');
    }
  };

  // 録音停止
  const stopRecording = () => {
    if (!isRecording) return;
    
    console.log('Stopping recording');
    recognitionRef.current.stop();
  };

  // マウス/キーボードイベントハンドラー
  const handlePressStart = (e) => {
    // 複数のイベントが同時に発火するのを防ぐ
    if (isHandlingEventRef.current) return;
    isHandlingEventRef.current = true;

    // 単押しモードで録音中なら、再度押すことで停止
    if (isRecording && mode === 'tap') {
      stopRecording();
      isHandlingEventRef.current = false;
      return;
    }

    if (isRecording) {
      isHandlingEventRef.current = false;
      return;
    }
    
    isPressingRef.current = true;
    isLongPressRef.current = false;
    setIsButtonPressed(true);
    
    // 長押し検知タイマー
    pressTimerRef.current = setTimeout(() => {
      if (isPressingRef.current) {
        isLongPressRef.current = true;
        startRecording('hold');
      }
      isHandlingEventRef.current = false;
    }, LONG_PRESS_DURATION);
  };

  const handlePressEnd = (e) => {
    if (!isPressingRef.current) return;

    const hadLongPressTimer = !!pressTimerRef.current;
    
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    // 短押しの場合
    if (hadLongPressTimer && !isLongPressRef.current && !isRecording) {
      startRecording('tap');
    } 
    // 長押しを離した場合
    else if (isLongPressRef.current && isRecording && mode === 'hold') {
      stopRecording();
    }

    isPressingRef.current = false;
    isLongPressRef.current = false;
    setIsButtonPressed(false);
    isHandlingEventRef.current = false;
  };

  const handleMouseLeave = () => {
    if (isPressingRef.current) {
      handlePressEnd();
    }
  };

  // キーボードイベントのリスナー
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.keyCode === BUTTON_KEY || e.keyCode === REMOTE_KEY) && !isPressingRef.current) {
        e.preventDefault();
        handlePressStart(e);
      }
    };

    const handleKeyUp = (e) => {
      if ((e.keyCode === BUTTON_KEY || e.keyCode === REMOTE_KEY)) {
        e.preventDefault();
        handlePressEnd(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
    };
  }, [isRecording, mode]);

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8" style={{ fontFamily: 'Noto Sans JP, sans-serif', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
        <h1 className="text-3xl font-bold text-center mb-4" style={{ color: '#3A3E40' }}>
          音声認識アプリ
        </h1>

        {/* 操作説明 */}
        <div className="mb-8 text-center text-sm" style={{ color: '#96A0A6' }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Info className="w-4 h-4" style={{ color: '#76B7ED' }} />
            <span className="font-medium" style={{ color: '#3A3E40' }}>操作方法</span>
          </div>
          <div className="space-y-1">
            <p><span className="font-medium">単押し:</span> 録音開始 → 話し終わると自動停止 or 再度押して停止</p>
            <p><span className="font-medium">長押し:</span> 押している間待機 → 離すと停止</p>
            <p className="text-xs mt-2">マイクボタン、Lキー、またはEnterキーで操作</p>
          </div>
        </div>

        {/* テキストエリア */}
        <div className="mb-8 rounded-xl p-6 min-h-[200px]" style={{ backgroundColor: '#F9FAFB' }}>
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-sm font-medium" style={{ color: '#96A0A6' }}>認識されたテキスト</h2>
            {(transcript || interimTranscript) && (
              <button
                onClick={clearTranscript}
                className="text-sm transition-colors"
                style={{ color: '#96A0A6' }}
              >
                クリア
              </button>
            )}
          </div>
          
          <div className="leading-relaxed" style={{ color: '#3A3E40' }}>
            {transcript || interimTranscript ? (
              <>
                <span>{transcript}</span>
                <span style={{ color: '#96A0A6' }}>{interimTranscript}</span>
              </>
            ) : (
              <p style={{ color: '#96A0A6', fontStyle: 'italic' }}>
                マイクボタンを押して話してください
              </p>
            )}
          </div>
        </div>

        {/* マイクボタン */}
        <div className="flex flex-col items-center">
          <button
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handleMouseLeave}
            onTouchStart={(e) => {
              e.preventDefault();
              handlePressStart(e);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handlePressEnd(e);
            }}
            className={`relative w-24 h-24 rounded-full transition-all duration-200 flex items-center justify-center ${
              isRecording
                ? 'bg-[#FF7669] hover:bg-[#FF7669]'
                : isButtonPressed
                ? 'bg-[#096FCA] scale-95'
                : 'bg-[#096FCA] hover:bg-[#096FCA]'
            } text-white shadow-lg`}
            style={{
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
          >
            {isRecording ? (
              <MicOff className="w-10 h-10" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
            {isRecording && (
              <span className="absolute -inset-1 rounded-full border-4 animate-ping" style={{ borderColor: '#FFAAB3' }}></span>
            )}
            <span className="absolute -bottom-6 text-xs font-mono px-2 py-1 rounded" style={{ color: '#96A0A6', backgroundColor: '#FFFFFF' }}>L / Enter</span>
          </button>
          
          <p className="mt-8 text-sm text-center" style={{ color: '#96A0A6' }}>
            {status}
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#FFF0F0', border: '1px solid #FFC8C8' }}>
            <p className="text-sm" style={{ color: '#D9534F' }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;