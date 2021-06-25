import { h } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { STATIONS } from '../constants';

const STATION_LIST_API_URL = new URL(
  process.env.STATION_LIST_API_PATH,
  process.env.STATION_LIST_API_HOST
);

export default ({ onSelectStation }) => {
  const [stations, setStations] = useState([]);

  const fetchStations = useCallback(() => {
    fetch(STATION_LIST_API_URL.href)
    .then(res => res.json())
    .then(data => {
      setStations(data);
    });
  }, []);

  useEffect(() => {
    fetchStations();
  }, []);

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
