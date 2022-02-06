// shit from background.js
let isRecording = false;
let socket;
let recorder;
let activation = "hello";
let tts = new SpeechSynthesisUtterance();

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
    tts.text = "hello my name is dingus";
    window.speechSynthesis.speak(tts);
    tts.text = "";
    const response = await fetch('http://localhost:80/api');
    const data = await response.json();

    if (data.error) {
      alert(data.error);
    }

    const { token } = data;
    console.log(token);
    socket = await new WebSocket(`wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`);

    socket.onmessage = (message) => {
      const res = JSON.parse(message.data);
      if (res.message_type === 'FinalTranscript') {
        const text = res.text ? res.text.toLowerCase().replace(/[^\w\s]/gi, '') : '';
        console.log(text);
        if (text.includes("your name is")) {
          activation = text.replace("your name is", "").trim();
          console.log(activation);
          tts.text = "please call me " + activation;
          window.speechSynthesis.speak(tts);
          tts.text = "";
        } else if (text.includes(activation)) {
          handleText(text.substring(activation.length).trim());
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

  if (text.includes("pause")) {
    play_pause.pause();
    tts.text = "video paused";
  } else if (text.includes("play")) {
    play_pause.play();
    tts.text = "video resumed";
  } else if (text.includes("search for")) {
    window.open("https://www.youtube.com/results?search_query=" + text.replace("search for", "").replace(" ", "+").trim());
    tts.text = "searching on youtube " + text.replace("searching for", "").trim();
  } else if (text.includes("next video")) {
    window.open(document.querySelector("a#thumbnail[rel=\"nofollow\"]").href);
    tts.text = "playing next video";
  } else if (text.includes("google search for")) {
    window.open("https://www.google.com/search?q=" + text.replace("google search for", "").replace(" ", "+").trim());
    tts.text = "searching on google " + text.replace("google search for", "").trim();
  } else if (text.includes("how do i")) {
    window.open("https://stackoverflow.com/search?q=" + text.replace("how do i", "").replace(" ", "+").trim());
    tts.text = "searching on stackoverflow " + text.replace("how do i", "").trim();
  } else if (text.includes("full screen")) {
    document.querySelector("button[title=\"Full screen (f)\"]").click();
    tts.text = "entering full screen";
  } else if (text.includes("sound off")) {
    document.querySelector("button[title=\"Mute (m)\"]").click();
    tts.text = "turning sound off";
  } else if (text.includes("sound on")) {
    document.querySelector("button[title=\"Unmute (m)\"]").click();
    tts.text = "turning sound on";
  } else if (text.includes("subtitles")) {
    document.querySelector("button[title=\"Subtitles/closed captions (c)\"]").click();
    tts.text = "toggling subtitles";
  } else if (text.length > 0) {
    fetch("http://127.0.0.1:80/api/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "message": text,
      })
    }).then(r => r.json()).then(r => {
      console.log(r.reply);
      tts.text = r.reply;
      window.speechSynthesis.speak(tts);
      tts.text = "";
    });
  }

  window.speechSynthesis.speak(tts);
  tts.text = "";
};

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.hasOwnProperty('dingus')) {
    run();
  }
});

console.log('hello world');
