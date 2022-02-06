// shit from background.js
let isRecording = false;
let socket;
let recorder;
let activation = "not_an_actual_word_lol";

// runs real-time transcription and handles global variables
const run = async () => {
  if (isRecording) {
    console.log('Stop Recording');
    if (socket) {
      socket.send(JSON.stringify({ terminate_session: true }));
      socket.close();
      socket = null;
    }

    if (recorder) {
      recorder.pauseRecording();
      recorder = null;
    }
  } else {
    console.log('Start Recording');
    const response = await fetch('http://localhost:8000');
    const data = await response.json();

    if (data.error) {
      alert(data.error);
    }

    const { token } = data;

    socket = await new WebSocket(`wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`);

    socket.onmessage = (message) => {
      const res = JSON.parse(message.data);
      if (res.message_type === 'FinalTranscript') {
        const text = res.text ? res.text.toLowerCase().replace(/[^\w\s]/gi, '') : '';
        console.log(text);
        if (text.includes("set activation to")) {
          activation = text.replace("set activation to", "").trim();
          console.log(activation);
          chrome.storage.local.set({ "activation": activation });
        } else if (text.includes(activation)) {
          handleText(text);
        }
      }
    };

    socket.onerror = (event) => {
      console.error(event);
      socket.close();
    };

    socket.onopen = () => {
      // once socket is open, begin recording
      // messageEl.style.display = '';
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          recorder = new RecordRTC(stream, {
            disableLogs: true,
            type: 'audio',
            mimeType: 'audio/webm;codecs=pcm', // endpoint requires 16bit PCM audio
            recorderType: StereoAudioRecorder,
            timeSlice: 250, // set 250 ms intervals of data that sends to AAI
            desiredSampRate: 16000,
            numberOfAudioChannels: 1, // real-time requires only one channel
            bufferSize: 4096,
            audioBitsPerSecond: 128000,
            ondataavailable: (blob) => {
              const reader = new FileReader();
              reader.onload = () => {
                const base64data = reader.result;

                // audio data must be sent as a base64 encoded string
                if (socket) {
                  socket.send(JSON.stringify({ audio_data: base64data.split('base64,')[1] }));
                }
              };
              reader.readAsDataURL(blob);
            },
          });

          recorder.startRecording();
        })
        .catch((err) => console.log(err));
    };
  }

  isRecording = !isRecording;
};

const handleText = (text) => {
  const play_pause = document.querySelector('video');
  const vid_vol = document.querySelector('.video-stream');

  if (text.includes("pause")) {
    play_pause.pause();
  } else if (text.includes("play")) {
    play_pause.play();
  } else if (text.includes("volume down")) {
    vid_vol.volume = Math.max(0, vid_vol.volume - 0.1);
  } else if (text.includes("volume up")) {
    vid_vol.volume = Math.min(1, vid_vol.volume + 0.1);
  }
};

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.hasOwnProperty('dingus')) {
    run();
  }
});

console.log('hello world');
