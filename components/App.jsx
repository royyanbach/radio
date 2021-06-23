import { h, createRef } from 'preact';
import { useCallback, useEffect, useLayoutEffect, useState } from 'preact/hooks';
import debounce from 'lodash/debounce';
import Wave from "@foobar404/wave"

import PlayButton from './PlayButton';

const WAVE_OPTS = {
  type: 'bars',
  colors: ['white'],
};

const IS_PLAYING_EVENT_MAP = {
  play: true,
  pause: false,
};

const IS_READY_EVENT_MAP = {
  canplay: true,
}

export default () => {
  const audio = createRef();
  const canvasViz = createRef();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [wave] = useState(new Wave());

  const handlePlayButtonStateChange = useCallback((newIsPlayingState) => {
    setIsPlaying(newIsPlayingState);
    if (newIsPlayingState) {
      // handleOnPlay();
      audio.current.play();
    } else {
      audio.current.pause();
    }
  }, [audio]);

  const handleAudioStateChange = useCallback((event) => {
    const { type } = event;
    const newEventPlayingState = IS_PLAYING_EVENT_MAP[type];
    if (newEventPlayingState !== isPlaying) {
      setIsPlaying(newEventPlayingState);
    }
  }, [isPlaying]);

  const handleAudioReadinessChange = useCallback((event) => {
    const { type } = event;
    setIsReady(IS_READY_EVENT_MAP[type]);
  }, []);

  // Handle resize
  useLayoutEffect(() => {
    let canvasVizEl = canvasViz.current;
    function updateSize() {
      const { offsetWidth } = canvasVizEl.parentNode;
      canvasVizEl.width = offsetWidth - 5;
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    // Init wave for first time
    wave.fromElement('audio', 'viz', WAVE_OPTS);

    // Handle spacebar key press
    const audioEl = audio.current;
    const handleSpacePress = debounce(e => {
      // Do nothing if not <space> key
      if (e.keyCode !== 32){
        return;
      }

      if (audioEl.paused) {
        audioEl.play();
      } else {
        audioEl.pause();
      }
    }, 1000);
    document.body.onkeyup = handleSpacePress;
    return () => document.body.onkeyup = null;
  }, []);

  return (
    <div className="container">
      <div className="box now-playing">
        <div className="text">
          <h1 className="station-freq">102.5 FM</h1>
          <p className="station-name">Prambors Radio</p>
        </div>
        <div>
          <canvas ref={canvasViz} id='viz' width="500" height="100"></canvas>
        </div>
        <div className="control">
          <audio
            id="audio"
            ref={audio}
            controls
            crossOrigin="anonymous"
            onPlay={handleAudioStateChange}
            onPause={handleAudioStateChange}
            onCanPlay={handleAudioReadinessChange}
            src="https://masima.rastream.com/masima-pramborsjakarta"
            // src="https://foobar404.github.io/Wave.js/static/media/track2.6f56e4e3.mp3"
            // src="//stream.radiojar.com/7csmg90fuqruv.mp3"
          ></audio>
          <PlayButton
            handleStateChange={handlePlayButtonStateChange}
            isPlaying={isPlaying}
            isReady={isReady}
          />
        </div>
      </div>
      <div className="box stations">B</div>
      {/* <div className="box recently-played">C</div>
      <div className="box meta">D</div> */}
    </div>
  );
};
