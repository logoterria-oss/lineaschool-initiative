import DiagBookingsList from './DiagBookingsList';
import DiagLinks from './DiagLinks';

/** «Запись на диагностику» внутри «Списка лидов»: ссылка для записи и заявки под ней */
const DiagBookingView = ({ onCount }: { onCount?: (n: number) => void }) => (
  <div>
    <DiagLinks />
    <DiagBookingsList onCount={onCount} />
  </div>
);

export default DiagBookingView;
