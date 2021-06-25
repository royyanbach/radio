import { h, createRef } from 'preact';
import { useCallback, useEffect } from 'preact/hooks';
import { memo } from 'preact/compat';

const PlayButton = ({
  handleStateChange,
  isLoading = false,
  isPlaying = false,
  isReady = false,
}) => {
  const pauseToPlay = createRef();
  const playToPause = createRef();

  const animate = useCallback(() => {
    if (isPlaying) {
      playToPause.current.beginElement();
    } else {
      pauseToPlay.current.beginElement();
    }
  }, [isPlaying]);

  const handleCLick = useCallback(() => {
    if (isLoading) return;
    handleStateChange(!isPlaying);
  }, [handleStateChange, isPlaying, isLoading]);

  useEffect(() => {
    animate();
  }, [isPlaying]);

  return (
    <div className={`play-btn ${isLoading ? 'loading' : ''}`}>
      <svg
        width="48"
        onClick={handleCLick}
        viewBox="0 0 104 104"
        // className={isReady ? 'ready' : ''}
      >
        <circle
          id="circle"
          cx="51"
          cy="51"
          r="50"
          stroke-dasharray="314"
          stroke-dashoffset="0"
          style="stroke-width:2px;stroke:white;"
          className={isPlaying ? '' : 'pause'}
        />
        <line
          id="line1"
          x1="38"
          y1="30"
          x2="38"
          y2="70"
          style="stroke-width:4px;stroke:white;stroke-linecap: round;"
        />
        <path
          id="line2"
          d="M 38 30 L 70 50 L 38 70"
          rx="10"
          ry="10"
          style="stroke-width:4px;stroke:white;fill:white;stroke-linejoin: round;stroke-linecap: round;"
        >
          <animate
            attributeName="d"
            dur="300ms"
            from="M 38 30 L 70 50 L 38 70"
            to="M 66 30 L 66 50 L 66 70"
            begin="indefinite"
            fill="freeze"
            id="from_play_to_pause"
            ref={playToPause}
          />
        </path>
        <animate
          href="#line2"
          attributeName="d"
          dur="300ms"
          from="M 66 30 L 66 50 L 66 70"
          to="M 38 30 L 70 50 L 38 70"
          fill="freeze"
          id="from_pause_to_play"
          begin="indefinite"
          ref={pauseToPlay}
        />
      </svg>
    </div>
  );
};

export default memo(PlayButton);
