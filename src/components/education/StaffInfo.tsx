import Icon from "@/components/ui/icon";

interface Diploma {
  title: string;
  url: string;
}

interface Teacher {
  name: string;
  role: string;
  diplomas: Diploma[];
}

const teachers: Teacher[] = [
  {
    name: "Абраменко Виктория Алексеевна",
    role: "Руководитель школы, логопед",
    diplomas: [
      {
        title:
          "Диплом бакалавра с отличием — 44.03.03 Специальное (дефектологическое) образование, НГПУ, 2023",
        url: "https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/f72380e9-b9fc-4f45-968d-e588feefb87a.jpg",
      },
    ],
  },
  {
    name: "Зинченко Ирина Владимировна",
    role: "Руководитель учебного отдела, логопед, педагог-психолог",
    diplomas: [
      {
        title:
          "Диплом бакалавра с отличием — 44.03.03 Специальное (дефектологическое) образование, ТГУ, 2017",
        url: "https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/e5027c77-f16d-4db9-886e-77fe9f13cc70.jpg",
      },
      {
        title:
          "Диплом магистра с отличием — 44.04.02 Психолого-педагогическое образование, ТГУ, 2022",
        url: "https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/9ad050f9-2fe3-4170-bdd3-4b56452fa117.jpg",
      },
      {
        title:
          "Диплом о профессиональной переподготовке — «Логопедия и практическая логопсихология», квалификация «учитель-логопед», 2017",
        url: "https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/4e5f692a-f059-470f-806e-e292bc5ac51d.jpg",
      },
    ],
  },
  {
    name: "Камнева Валерия Денисовна",
    role: "Дефектолог, логопед, нейропсихолог",
    diplomas: [],
  },
  {
    name: "Канкулова Екатерина Валерьевна",
    role: "Психолог, логопед",
    diplomas: [],
  },
  {
    name: "Мацвей Екатерина Андреевна",
    role: "Логопед, педагог-психолог",
    diplomas: [],
  },
];

export default function StaffInfo() {
  return (
    <div className="space-y-4">
      {teachers.map((t) => (
        <div
          key={t.name}
          className="rounded-xl border border-gray-200 bg-white/70 p-4"
        >
          <p className="font-semibold text-gray-800">{t.name}</p>
          <p className="text-gray-600 mb-3">{t.role}</p>

          {t.diplomas.length > 0 ? (
            <ul className="space-y-2">
              {t.diplomas.map((d) => (
                <li key={d.url} className="flex items-start gap-2">
                  <Icon
                    name="FileText"
                    size={16}
                    className="text-purple-600 mt-0.5 flex-shrink-0"
                  />
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-700 hover:underline"
                  >
                    {d.title}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">Документы об образовании — скоро</p>
          )}
        </div>
      ))}
    </div>
  );
}
