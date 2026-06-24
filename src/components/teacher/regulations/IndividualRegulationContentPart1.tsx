import Part1IntroSections from './Part1IntroSections';
import Part1LessonMain from './Part1LessonMain';
import Part1LessonDysorthography from './Part1LessonDysorthography';
import Part1LessonDyslexia from './Part1LessonDyslexia';

const IndividualRegulationContentPart1 = () => (
  <>
    <Part1IntroSections />
    <section id="lesson">
      <Part1LessonMain />
      <Part1LessonDysorthography />
      <Part1LessonDyslexia />
    </section>
  </>
);

export default IndividualRegulationContentPart1;
