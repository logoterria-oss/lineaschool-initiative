import { RegPage } from './ui';

const IndividualRegulation = ({ onBack }: { onBack: () => void }) => {
  return (
    <RegPage title="Индивидуальные занятия" accent="blue" onBack={onBack}>
      <p>Контент появится позже.</p>
    </RegPage>
  );
};

export default IndividualRegulation;
