import dayjs from "dayjs";
import jsPDF from "jspdf";
import { UserOptions } from "jspdf-autotable";
import { PLZData, MonthlyResult } from "./dataTypes";

interface jsPDFCustom extends jsPDF {
  autoTable: (options: UserOptions) => void;
  lastAutoTable: {
    finalY: number;
  };
}

const DISTANCE = 50;

function makePLZTable(
  doc: jsPDFCustom,
  data: any,
  top: number,
  title?: string
) {
  makeTable(
    doc,
    data,
    top,
    [
      "PLZ",
      "Landkreis / Stadt (Bundesland)",
      "Distanz (Luftlinie in km)",
      "Besucherzahl",
    ],
    title
  );
}

function makeVisitorTable(doc: jsPDFCustom, data: any, top: number) {
  makeTable(doc, data, top, [
    "Tag",
    "Besucherzahl",
    "Besucherzahl <=50km",
    "Besucherzahl >50km",
  ]);
}

function makeTable(
  doc: jsPDFCustom,
  data: any,
  top: number,
  head: string[],
  title?: string
) {
  if (title) doc.text(title, 15, top);
  doc.autoTable({
    startY: top + (title ? 3 : 0),
    head: [head],
    body: data,
  });
}

function sortData(data: PLZData) {
  const s = Object.entries(data).map(([plz, entry]) => {
    return [
      plz,
      entry.landkreis + " (" + entry.bundesland + ")",
      entry.luftlinie,
      entry.totalAmount,
    ];
  });
  return s.sort((a, b) => {
    return a[0].toString().localeCompare(b[0].toString());
  });
}

function getTotalVisitors(
  data: PLZData,
  filter: (x: any) => boolean = (_) => true
) {
  return Object.values(data)
    .filter(filter)
    .reduce((sum: number, value: any) => sum + value.totalAmount, 0);
}

export function writeDailyPDF(data: PLZData, date: Date) {
  const doc = new jsPDF() as jsPDFCustom;

  doc.setFontSize(18);
  doc.text(dayjs(date).locale("de").format("dddd DD.MM.YYYY"), 15, 20);

  doc.setFontSize(12);
  const totalAmount = getTotalVisitors(data);
  const totalAmountClose = getTotalVisitors(
    data,
    (d) => parseInt(d.luftlinie) <= DISTANCE
  );
  doc.text(
    "Gesamtanzahl Besucher: " +
      totalAmount.toString() +
      "\n" +
      "Gesamtanzahl Besucher <= 50km: " +
      totalAmountClose.toString() +
      "\n" +
      "Gesamtanzahl Besucher >50km: " +
      (totalAmount - totalAmountClose).toString(),
    15,
    30,
    { lineHeightFactor: 1.5 }
  );

  const sortedData = sortData(data);
  makePLZTable(
    doc,
    sortedData.filter((x) => parseInt(x[2] as string) <= DISTANCE),
    60,
    "Besucher <= 50km"
  );
  makePLZTable(
    doc,
    sortedData.filter(
      (x) => parseInt(x[2] as string) > DISTANCE || x[2] === "-"
    ),
    doc.lastAutoTable.finalY + 10,
    "Besucher > 50km"
  );

  doc.save(
    "PLZ Erfassung - " + dayjs(date).locale("de").format("DD MM YYYY") + ".pdf"
  );
}

function monthlyPreface(doc: jsPDFCustom, date: Date, data: MonthlyResult) {
  doc.setFontSize(18);
  doc.text(dayjs(date).locale("de").format("MMMM YYYY"), 15, 20);

  doc.setFontSize(12);

  const dailyData = Object.entries(data).map(([date, entry]) => {
    return [
      dayjs(date).format("DD.MM."),
      getTotalVisitors(entry),
      getTotalVisitors(entry, (d) => parseInt(d.luftlinie) <= DISTANCE),
      getTotalVisitors(
        entry,
        (d) => parseInt(d.luftlinie) > DISTANCE || d.luftlinie === "-"
      ),
    ];
  });

  const totalAmountClose = dailyData.reduce(
    (sum, data) => sum + (data[2] as number),
    0
  );
  const totalAmountFar = dailyData.reduce(
    (sum, data) => sum + (data[3] as number),
    0
  );
  doc.text(
    "Gesamtanzahl Besucher: " +
      (totalAmountClose + totalAmountFar).toString() +
      "\n" +
      "Gesamtanzahl Besucher <= 50km: " +
      totalAmountClose.toString() +
      "\n" +
      "Gesamtanzahl Besucher > 50km: " +
      totalAmountFar.toString(),
    15,
    30,
    { lineHeightFactor: 1.5 }
  );
  makeVisitorTable(doc, dailyData, 50);
}

export function writeMonthlyPDF(data: MonthlyResult, date: Date) {
  const doc = new jsPDF() as jsPDFCustom;
  monthlyPreface(doc, date, data);

  Object.entries(data).forEach(([date, entry]) => {
    const sortedData = sortData(entry);
    doc.text(dayjs(date).format("DD.MM."), 15, doc.lastAutoTable.finalY + 12);
    makePLZTable(
      doc,
      sortedData.filter((x) => parseInt(x[2] as string) <= DISTANCE),
      doc.lastAutoTable.finalY + 20,
      "Besucher <= 50km"
    );
    makePLZTable(
      doc,
      sortedData.filter(
        (x) => parseInt(x[2] as string) > DISTANCE || x[2] === "-"
      ),
      doc.lastAutoTable.finalY + 10,
      "Besucher > 50km"
    );
    doc.line(
      15,
      doc.lastAutoTable.finalY + 5,
      195,
      doc.lastAutoTable.finalY + 5
    );
  });

  doc.save(
    "PLZ Erfassung - " +
      dayjs(date).locale("de").format("MMMM YYYY") +
      " Übersicht.pdf"
  );
}

export function writeMonthlySummaryPDF(data: MonthlyResult, date: Date) {
  const doc = new jsPDF() as jsPDFCustom;
  monthlyPreface(doc, date, data);

  const sortedData = Object.entries(data)
    .map(([_, entry]) => {
      return sortData(entry);
    })
    .reduce((a, b) => a.concat(b), [])
    .sort((a, b) => a[0].toString().localeCompare(b[0].toString()));

  const plzs = new Set(sortedData.map((x) => x[0]));
  const test = [] as any[];
  Array.from(plzs).forEach((plz) => {
    const perPlz = sortedData.filter((x) => x[0] === plz);
    const num = perPlz.reduce((sum, data) => sum + (data[3] as number), 0);
    test.push([plz, perPlz[0][1], perPlz[0][2], num]);
  });

  makePLZTable(
    doc,
    test.filter((x) => parseInt(x[2] as string) <= DISTANCE),
    doc.lastAutoTable.finalY + 10,
    "Besucher <= 50km"
  );
  makePLZTable(
    doc,
    test.filter((x) => parseInt(x[2] as string) > DISTANCE || x[2] === "-"),
    doc.lastAutoTable.finalY + 10,
    "Besucher > 50km"
  );

  doc.save(
    "PLZ Erfassung - " + dayjs(date).locale("de").format("MMMM YYYY") + ".pdf"
  );
}
