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

  const setMediaSessionMetadata = useCallback(({
    artwork_url_small = '',
    artwork_url_large = '',
    metadata = '',
  } = {}) => {
    if ('mediaSession' in navigator && metadata) {
      try {
        const [artist, title] = metadata.split(' - ');
        if (!artist || !title) {
          navigator.mediaSession.metadata = null;
          return;
        }

        navigator.mediaSession.metadata = new MediaMetadata({
          title,
          artist,
          artwork: [
            { src: artwork_url_small, sizes: '96x96', type: 'image/png' },
            { src: artwork_url_large, sizes: '512x512', type: 'image/png' },
          ]
        });
      } catch (error) {
        console.log(`The media session is not supported`);
      }
    }
  }, []);

  const fetchLastPlaying = useCallback((stationData) => {
    if (!stationData || !stationData.stationId) {
      return setLastPlayedSong(null);
    }

    fetch(new URL(stationData.stationId, METADATA_API_URL).href)
    .then(res => res.json())
    .then(data => {
      if (data && data.radio_metadata) {
        setLastPlayedSong(data.radio_metadata);
        setMediaSessionMetadata(data.radio_metadata);
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
      setIsPlaying(newEventPlayingState);
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
  }, [selectedStation, canvasViz.current]);

  useEffect(() => {
    console.info(
      'Made with %c♥%c hosted at https://github.com/royyanbach/radio',
      'color: #e25555', 'color: unset'
    );
    console.info('Icon by https://www.freepik.com');
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
    const timer = setInterval(() => {
      fetchLastPlaying(selectedStation);
    }, 15000);
    return () => { clearInterval(timer); }
  }, [selectedStation]);

  return (
    <div className="container">
      <div
        className={`box now-playing ${!selectedStation || (isPlaying && lastPlayedSong && lastPlayedSong.artwork_url_large) ? 'show-bg' : ''} ${!selectedStation ? 'disabled' : ''}`}
        {...(lastPlayedSong && lastPlayedSong.artwork_url_large ? {
          style: {
            '--album-src': `url('${lastPlayedSong.artwork_url_large}')`
          }
        } : {})}
      >
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
          <p>
            Player is ready<br />
            Choose any station from the list
          </p>
        )}
      </div>
      <StationList
        selectedStation={selectedStation}
        onSelectStation={({
          frequency,
          name,
          stationId,
          streamUrl,
        } = {}) => {
          handlePlayButtonStateChange(false);
          setMediaSessionMetadata();
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
