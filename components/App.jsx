import { h, createRef } from 'preact';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'preact/hooks';
import debounce from 'lodash/debounce';
import Wave from '@foobar404/wave';
import PlayButton from './PlayButton';
import { IS_PLAYING_EVENT_MAP, IS_READY_EVENT_MAP, STATIONS, WAVE_OPTS } from '../constants';

export default () => {
  const audio = createRef();
  const canvasViz = createRef();

  const [selectedStation, setSelectedStation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [wave] = useState(new Wave());
  const [controlContent, setControlContent] = useState(null);
  const [audioPlayer, setAudioPlayer] = useState(new Audio());

  const handlePlayButtonStateChange = useCallback(
    (newIsPlayingState) => {
      setIsPlaying(newIsPlayingState);
      if (newIsPlayingState) {
        audioPlayer.play();
      } else {
        audioPlayer.pause();
      }
    },
    [audioPlayer]
  );

  const handleAudioStateChange = useCallback(
    (event) => {
      const { type } = event;
      const newEventPlayingState = IS_PLAYING_EVENT_MAP[type];
      if (newEventPlayingState !== isPlaying) {
        setIsPlaying(newEventPlayingState);
      }
    },
    [isPlaying]
  );

  const handleAudioReadinessChange = useCallback((event) => {
    const { type } = event;
    setIsReady(IS_READY_EVENT_MAP[type]);
    handlePlayButtonStateChange(true);
  }, []);

  const setupRadio = useCallback(() => {
    audioPlayer.id = 'audio';
    audioPlayer.onplay = handleAudioStateChange;
    audioPlayer.onpause = handleAudioStateChange;
    audioPlayer.oncanplay = handleAudioReadinessChange;
    console.log(document.getElementById('audio'));
  }, [audioPlayer]);

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
    setupRadio();

    // Init wave for first time
    wave.fromElement('audio', 'viz', WAVE_OPTS);

    // Handle spacebar key press
    const audioEl = audioPlayer;
    const handleSpacePress = debounce((e) => {
      // Do nothing if not <space> key
      if (e.keyCode !== 32) {
        return;
      }

      if (audioEl.paused) {
        audioEl.play();
      } else {
        audioEl.pause();
      }
    }, 1000);
    document.body.onkeyup = handleSpacePress;
    return () => (document.body.onkeyup = null);
  }, []);

  useEffect(() => {
    if (selectedStation && selectedStation.streamUrl) {
      audioPlayer.setAttribute('src', selectedStation.streamUrl);
    }
  }, [selectedStation]);

  return (
    <div className="container">
      <div className="box now-playing">
        <div className="text">
          <h1 className="station-freq">{selectedStation && selectedStation.frequency}</h1>
          <p className="station-name">{selectedStation && selectedStation.name}</p>
        </div>
        <div>
          <canvas ref={canvasViz} id="viz" width="500" height="100"></canvas>
        </div>
        <div className="control">
          <PlayButton
            handleStateChange={handlePlayButtonStateChange}
            isPlaying={isPlaying}
            isReady={isReady}
          />
          <div className={`media-info animated ${isPlaying ? 'active' : 'inactive'}`}>
            <h3 className="title">Last Played</h3>
            <h4 className="subtitle">Maroon 5 - Sunday Morning</h4>
          </div>
        </div>
      </div>
      <div className="box stations">
        <ul>
          {
            STATIONS.map(({ frequency, name, streamUrl } = {}) => (
              <li key={frequency}>
                <a
                  role="button"
                  onClick={() => {
                    handlePlayButtonStateChange(false);
                    setSelectedStation({
                      frequency,
                      name,
                      streamUrl,
                    });
                  }}
                >
                  <h4 className="station-name">{name}</h4>
                  <p className="station-freq">{frequency}</p>
                </a>
              </li>
            ))
          }
        </ul>
      </div>
      {/* <div className="box recently-played">C</div>
      <div className="box meta">D</div> */}
    </div>
  );
};
