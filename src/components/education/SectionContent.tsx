import InfoRows, { DocLink } from "./InfoRows";
import StaffInfo from "./StaffInfo";
import {
  mainInfoRows,
  structureInfoRows,
  documentsRows,
  educationRows,
  managementRows,
  supportRows,
  internationalRows,
  vacanciesRows,
  financeRows,
  facilitiesRows,
} from "./educationData";

function PaidServicesInfo() {
  return (
    <div className="space-y-3">
      <p>Образовательные услуги у ИП Абраменко В.А. являются платными.</p>
      <InfoRows
        rows={[
          {
            label: "Положение о порядке оказания платных услуг",
            value: <DocLink href="https://disk.yandex.ru/i/euxuNY9do1H2Hw" />,
          },
          {
            label:
              "Образец договора об оказании платных образовательных услуг с физическим лицом",
            value: <DocLink href="https://disk.yandex.ru/i/DBdR7roMz5FeGg" />,
          },
          {
            label:
              "Приказ об утверждении стоимости обучения по каждой образовательной программе",
            value: <DocLink href="https://disk.yandex.ru/i/5gNZgQ34qJSMnQ" />,
          },
        ]}
      />
    </div>
  );
}

function FacilitiesInfo() {
  return (
    <div className="space-y-5">
      <div>
        <p className="font-semibold text-gray-800 mb-2">
          1. Материально-техническое обеспечение образовательной деятельности,
          в том числе в отношении инвалидов и лиц с ОВЗ
        </p>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>
            Ноутбук Lenovo ThinkBook 15-IIL 205M000HIRU (четырёхъядерный процессор
            Intel Core i5-1035G1 с частотой 1.0–3.6 ГГц, оперативная память DDR4
            16384 Мб, SSD 512 Гб)
          </li>
          <li>Веб-камера</li>
          <li>Наушники Hoco W35 Global, чёрный — 1 шт.</li>
          <li>Микрофон ME6 — 1 шт.</li>
        </ul>
        <InfoRows rows={facilitiesRows} />
      </div>
      <div>
        <p className="font-semibold text-gray-800 mb-2">
          2. Специальные условия для получения образования инвалидами и лицами с
          ограниченными возможностями здоровья
        </p>
        <p>
          Электронная обучающая среда отвечает установленным требованиям
          законодательства. Обучение проводится дистанционно, что обеспечивает
          беспрепятственный доступ к обучению для лиц с ограниченными
          возможностями здоровья.
        </p>
      </div>
    </div>
  );
}

export default function SectionContent({ id }: { id: string }) {
  return (
    <>
      {id === "main" ? (
        <InfoRows rows={mainInfoRows} />
      ) : id === "structure" ? (
        <InfoRows rows={structureInfoRows} />
      ) : id === "documents" ? (
        <InfoRows rows={documentsRows} />
      ) : id === "education" ? (
        <InfoRows rows={educationRows} />
      ) : id === "management" ? (
        <InfoRows rows={managementRows} />
      ) : id === "staff" ? (
        <StaffInfo />
      ) : id === "facilities" ? (
        <FacilitiesInfo />
      ) : id === "paid-services" ? (
        <PaidServicesInfo />
      ) : id === "finance" ? (
        <InfoRows rows={financeRows} />
      ) : id === "vacancies" ? (
        <InfoRows rows={vacanciesRows} />
      ) : id === "support" ? (
        <InfoRows rows={supportRows} />
      ) : id === "international" ? (
        <InfoRows rows={internationalRows} />
      ) : id === "meals" ? (
        "Питание не предусмотрено, в связи с осуществлением образовательной деятельности дистанционно, по сети Интернет."
      ) : (
        "Информация появится позже."
      )}
    </>
  );
}
