import { h, createRef, Fragment } from 'preact';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'preact/hooks';
import debounce from 'lodash/debounce';
import Wave from '@foobar404/wave';
import PlayButton from './PlayButton';
import StationList from './StationList';
import { IS_PLAYING_EVENT_MAP, STATIONS, WAVE_OPTS } from '../constants';

const METADATA_API_URL = new URL(
  process.env.METADATA_API_PATH,
  process.env.RADIO_API_HOST,
);

export default () => {
  const audio = createRef();
  const canvasViz = createRef();

  const [selectedStation, setSelectedStation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastPlayedSong, setLastPlayedSong] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wave] = useState(new Wave());
  const [controlContent, setControlContent] = useState(null);

  const fetchLastPlaying = useCallback((stationData) => {
    if (!stationData || !stationData.stationId) {
      return setLastPlayedSong(null);
    }

    fetch(new URL(stationData.stationId, METADATA_API_URL).href)
    .then(res => res.json())
    .then(data => {
      if (data && data.radio_metadata) {
        setLastPlayedSong(data.radio_metadata);
      }
    });
  }, []);

  const handlePlayButtonStateChange = useCallback(
    (newIsPlayingState) => {
      setIsPlaying(newIsPlayingState);
      if (newIsPlayingState) {
        audio.current.play();
      } else {
        audio.current.pause();
      }
    },
    [audio.current]
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
    setIsLoading(false);
    handlePlayButtonStateChange(true);
  }, []);

  const setupRadio = useCallback(
    (src) => {
      wave.stopStream();
      if (audio.current) {
        audio.current.src = null;
        audio.current.remove();
      }
      document.querySelectorAll('audio').forEach((el) => el.remove());
      setIsLoading(true);
      const _audio = new Audio();
      _audio.id = 'radio';
      _audio.onplay = handleAudioStateChange;
      _audio.onpause = handleAudioStateChange;
      _audio.oncanplay = handleAudioReadinessChange;
      if (src) _audio.setAttribute('src', src);
      document.body.appendChild(_audio);
      wave.fromElement('radio', 'viz', WAVE_OPTS);

      // if (showVisualizer) {
      // } else {
      //   const _dummyAudio = new Audio();
      //   _dummyAudio.id = 'dummy-audio';
      //   document.body.appendChild(_dummyAudio);
      //   wave.fromElement('dummy-audio', 'viz', WAVE_OPTS);
      // }

      audio.current = _audio;
    },
    [audio.current]
  );

  // Handle resize
  useLayoutEffect(() => {
    let canvasVizEl = canvasViz.current;
    function updateSize() {
      const { offsetWidth } = (canvasVizEl && canvasVizEl.parentNode) || {};
      if (offsetWidth) canvasVizEl.width = offsetWidth - 5;
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, [canvasViz.current]);

  useEffect(() => {
    setupRadio();

    // Toggle play/pause on spacebar key press
    const handleSpacePress = debounce((e) => {
      // Do nothing if not <space> key
      if (e.keyCode !== 32) return;
      // Do nothing if audio doesnt exist
      if (!audio.current) return;

      if (audio.current.paused) {
        audio.current.play();
      } else {
        audio.current.pause();
      }
    }, 1000);
    document.body.onkeyup = handleSpacePress;
    return () => (document.body.onkeyup = null);
  }, []);

  useEffect(() => {
    if (selectedStation && selectedStation.streamUrl) {
      setupRadio(selectedStation.streamUrl);
    }
  }, [selectedStation]);

  useEffect(() => {
    fetchLastPlaying(selectedStation);
  }, [selectedStation]);

  return (
    <div className="container">
      <div className={`box now-playing ${!selectedStation && 'disabled'}`}>
        {selectedStation ? (
          <>
            <div className="text">
              <h1 className="station-freq">
                {selectedStation && selectedStation.frequency}
              </h1>
              <p className="station-name">
                {selectedStation && selectedStation.name}
              </p>
            </div>
            <div>
              <canvas
                ref={canvasViz}
                id="viz"
                width="500"
                height="100"
              ></canvas>
            </div>
            <div className="control">
              <PlayButton
                handleStateChange={handlePlayButtonStateChange}
                isPlaying={isPlaying}
                isLoading={isLoading}
              />
              <div
                className={`media-info animated ${
                  isPlaying && lastPlayedSong && lastPlayedSong.metadata ? 'active' : 'inactive'
                }`}
              >
                <h3 className="title">Last Played</h3>
                <h4 className="subtitle">{lastPlayedSong && lastPlayedSong.metadata}</h4>
              </div>
            </div>
          </>
        ) : (
          <p>Choose any station from the list »</p>
        )}
      </div>
      <StationList
        onSelectStation={({
          frequency,
          name,
          stationId,
          streamUrl,
        } = {}) => {
          handlePlayButtonStateChange(false);
          setSelectedStation({
            frequency,
            name,
            stationId,
            streamUrl,
          });
        }}
      />
      {/* <div className="box recently-played">C</div>
      <div className="box meta">D</div> */}
    </div>
  );
};
