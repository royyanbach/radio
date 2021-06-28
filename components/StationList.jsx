import { h } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { STATIONS } from '../constants';

const STATION_LIST_API_URL = new URL(
  process.env.STATION_LIST_API_PATH,
  process.env.RADIO_API_HOST,
);

export default ({
  onSelectStation,
  selectedStation,
}) => {
  const [stations, setStations] = useState([]);

  const changeToNearestStation = useCallback(nextTrack => {
    const currentStationIdx = [...stations].findIndex(station => station.stationId === (selectedStation && selectedStation.stationId))
    if (currentStationIdx < 0) return;
    const nextIdx = currentStationIdx + 1 > stations.length - 1 ? 0 : currentStationIdx + 1;
    const prevIdx = currentStationIdx - 1 < 0 ? stations.length - 1 : currentStationIdx - 1;
    onSelectStation([...stations][nextTrack ? nextIdx : prevIdx]);
  }, [stations, onSelectStation, selectedStation]);

  const setMediaSessionActionHandler = useCallback(() => {
    if ('mediaSession' in navigator && Array.isArray(stations) && stations.length) {
      try {
        navigator.mediaSession.setActionHandler('nexttrack', () => changeToNearestStation(true));
        navigator.mediaSession.setActionHandler('previoustrack', () => changeToNearestStation());
      } catch (error) {
        console.log(`The media session is not supported`);
      }
    }
  }, [stations, changeToNearestStation]);

  const fetchStations = useCallback(() => {
    fetch(STATION_LIST_API_URL.href)
    .then(res => res.json())
    .then(data => {
      setStations(data);
    });
  }, [setStations]);

  useEffect(() => {
    fetchStations();
  }, []);

  useEffect(() => {
    setMediaSessionActionHandler();
  }, [stations, selectedStation]);

  return (
    <div className="box stations">
      <ul>
        {stations.map((stationData) => {
          const { frequency, name } = stationData;
          return (
            <li key={frequency}>
              <a role="button" onClick={() => onSelectStation(stationData)}>
                <h4 className="station-name">{name}</h4>
                <p className="station-freq">{frequency}</p>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
