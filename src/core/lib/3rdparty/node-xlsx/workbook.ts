import type { WorkBook as XLSXWorkBook, WorkSheet } from "xlsx";

// eslint-disable-next-line import/prefer-default-export
export class WorkBook implements XLSXWorkBook {
  Sheets: Record<string, WorkSheet> = {};

  SheetNames: string[] = [];
}
