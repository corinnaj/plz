export interface Entry {
  bundesland: string;
  luftlinie: string;
  landkreis: string;
  plz: string;
  anzahl: number;
}

export interface MonthlyEntry {
  bundesland: string;
  luftlinie: string;
  landkreis: string;
  plz: string;
  date: string;
  anzahl: number;
}

export interface MonthlyResult {
  [date: string]: PLZData;
}

export interface PLZData {
  [plz: string]: {
    bundesland: string;
    luftlinie: string;
    landkreis: string;
    totalAmount: number;
  };
}
