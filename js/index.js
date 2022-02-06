// shit from background.js
const color = '#FF99CC';
let isRecording = false;
let socket;
let recorder;

const loadedRtc = true;

// runs real-time transcription and handles global variables
const run = async () => {
  if (isRecording) {
    console.log('in if block');
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
    console.log('in else block');
    const response = await fetch('http://localhost:8000');
    const data = await response.json();

    if (data.error) {
      alert(data.error);
    }

    const { token } = data;
    // print(token);

    // establish wss with AssemblyAI (AAI) at 16000 sample rate
    socket = await new WebSocket(`wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`);

    // handle incoming messages to display transcription to the DOM
    const texts = {};
    const mostRecent = '';
    socket.onmessage = (message) => {
      // console.log('socket onmessage');
      const msg = '';
      const res = JSON.parse(message.data);
      if (res.message_type === 'FinalTranscript') {
        console.log(res.text);
        if (res.text.toLowerCase().includes('listen up')) {
          const video = document.querySelector('video');
          // console.log(video);
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        }
      }
    };

    socket.onerror = (event) => {
      console.error(event);
      socket.close();
    };

    socket.onclose = (event) => {
      console.log(event);
      socket = null;
    };

    socket.onopen = () => {
      // once socket is open, begin recording
      // messageEl.style.display = '';
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          recorder = new RecordRTC(stream, {
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

chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log(changes);
  if (changes.hasOwnProperty('dingus')) {
    console.log('I would run');
    run();
  }
});

console.log('hello world');
