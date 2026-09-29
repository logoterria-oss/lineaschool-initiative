import * as J from 'jspdf';
import * as fs from 'fs';
// В сборке под Node default-экспорт jspdf не разворачивается — чиним вручную.
// В браузере (Vite) этого не требуется, файл нужен только для проверки макета.
(J as any).default = (J as any).jsPDF;
(J as any).jsPDF.prototype.save = function (name: string) {
  fs.writeFileSync('/tmp/shots/margin.pdf', Buffer.from(this.output('arraybuffer')));
  console.log('saved', name); return this;
};
import('./lib/unitMarginPdf').then(async (m) => {
  const result: any = {
    individual:{form:'individual',clientsPerLesson:0.98,revenue:1267.63,costTotal:764.9,margin:502.73,marginPercent:39.66,tax:76.06,profit:426.67,profitPercent:33.66,costRows:[],revenueFormula:'',pricePerClient:1293.5,breakEvenRevenue:0,breakEvenClients:0,payrollShare:0},
    group:{form:'group',clientsPerLesson:3.36,revenue:4176.41,costTotal:826.23,margin:3350.18,marginPercent:80.22,tax:250.58,profit:3099.6,profitPercent:74.22,costRows:[],revenueFormula:'',pricePerClient:1242.98,breakEvenRevenue:0,breakEvenClients:0,payrollShare:0}};
  const totals: any = {individualLessons:126,groupLessons:53,lessons:179,revenue:380105,costTotal:140192,margin:239913,marginPercent:63.12,tax:22806,profit:217107,profitPercent:57.12,individualMargin:63344,groupMargin:177559};
  await m.downloadUnitMarginPdf({ result, totals, month: '2026-09' });
});
