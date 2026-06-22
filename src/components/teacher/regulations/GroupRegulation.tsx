import { RegPage } from './ui';

const GroupRegulation = ({ onBack }: { onBack: () => void }) => {
  return (
    <RegPage title="Групповые занятия" accent="purple" onBack={onBack}>
      <p>Контент появится позже.</p>
    </RegPage>
  );
};

export default GroupRegulation;
