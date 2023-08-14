import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  MenuItem,
  Select,
  Snackbar,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import "jspdf-autotable";
import { useState } from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/de";
import dayjs from "dayjs";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  writeDailyPDF,
  writeMonthlyPDF,
  writeMonthlySummaryPDF,
} from "./PDFGenerator";
import { MonthlyEntry, PLZData, MonthlyResult, Entry } from "./dataTypes";
import { googleUrl } from "./data";

const START_YEAR = 2023;

export function Download() {
  const [date, setDate] = useState(new Date());
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const [error, setError] = useState<string | null>(null);

  async function getDailyPDF() {
    const data = await downloadData(date);
    const formattedData = formatData(data);
    writeDailyPDF(formattedData, date);
  }

  async function getDetailedMonth() {
    const dateToUse = new Date(year, month, 5);
    const data = await downloadMonth(dateToUse);
    const formattedData = formatMonthlyData(data);
    writeMonthlyPDF(formattedData, dateToUse);
  }

  async function getMonthlyOverview() {
    const dateToUse = new Date(year, month, 5);
    const data = await downloadMonth(dateToUse);
    const formattedData = formatMonthlyData(data);
    writeMonthlySummaryPDF(formattedData, dateToUse);
  }

  async function downloadData(date: Date) {
    try {
      const res = await fetch(googleUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: "getDay",
          data: { date },
          password: localStorage.getItem("password") || "",
        }),
      });
      if (res.status !== 200) {
        if (res.status === 403) {
          localStorage.setItem("password", "invalid");
          window.location.reload();
        }
        throw new Error(res.status.toString() + " - " + res.statusText);
      }
      return await res.json();
    } catch (e: any) {
      setError(e.toString());
      console.log(e);
    }
  }

  async function downloadMonth(date: Date) {
    try {
      const res = await fetch(googleUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: "getMonth",
          data: { date },
          password: localStorage.getItem("password") || "",
        }),
      });
      if (res.status !== 200) {
        if (res.status === 403) {
          localStorage.setItem("password", "invalid");
          window.location.reload();
        }
        throw new Error(res.status.toString() + " - " + res.statusText);
      }
      return await res.json();
    } catch (e: any) {
      setError(e.toString());
      console.log(e);
    }
  }

  function formatData(data: Entry[]): PLZData {
    let formattedData: PLZData = {};

    data.forEach((entry: Entry) => {
      const plz = entry.plz;
      const amount = formattedData[plz]?.totalAmount || 0;

      formattedData[plz] = {
        bundesland: entry.bundesland,
        landkreis: entry.landkreis,
        luftlinie: entry.luftlinie,
        totalAmount: amount + entry.anzahl,
      };
    });

    return formattedData;
  }

  function formatMonthlyData(data: MonthlyEntry[]): MonthlyResult {
    let formattedData: MonthlyResult = {};

    data.forEach((entry: MonthlyEntry) => {
      const plz = entry.plz;
      const date = entry.date;
      const amount = formattedData[date]
        ? formattedData[date][plz]?.totalAmount || 0
        : 0;

      if (formattedData[date] === undefined) {
        formattedData[date] = {};
      }

      formattedData[date][plz] = {
        bundesland: entry.bundesland,
        landkreis: entry.landkreis,
        luftlinie: entry.luftlinie,
        totalAmount: amount + entry.anzahl,
      };
    });

    return formattedData;
  }

  const handleClose = (_event?: any, _reason?: string) => {
    setError(null);
  };

  return (
    <Accordion
      style={{
        margin: "20px",
        background: "#efefef",
        bottom: 0,
        position: "absolute",
        right: 0,
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        Export
      </AccordionSummary>
      <AccordionDetails className="accordion">
        <div className="download-option">
          <LocalizationProvider adapterLocale="de" dateAdapter={AdapterDayjs}>
            <DatePicker
              sx={{ backgroundColor: "white" }}
              value={dayjs(date)}
              onChange={(date) => {
                if (date) setDate(date?.toDate());
              }}
            />
          </LocalizationProvider>
          <Button
            variant="contained"
            onClick={() => getDailyPDF()}
            className="download-button"
          >
            Tag exportieren
          </Button>
        </div>

        <div className="download-option">
          <Select
            sx={{ backgroundColor: "white" }}
            value={month}
            onChange={(event) => {
              setMonth(event.target.value as number);
            }}
          >
            <MenuItem value={0}>Januar</MenuItem>
            <MenuItem value={1}>Februar</MenuItem>
            <MenuItem value={2}>März</MenuItem>
            <MenuItem value={3}>April</MenuItem>
            <MenuItem value={4}>Mai</MenuItem>
            <MenuItem value={5}>Juni</MenuItem>
            <MenuItem value={6}>Juli</MenuItem>
            <MenuItem value={7}>August</MenuItem>
            <MenuItem value={8}>September</MenuItem>
            <MenuItem value={9}>Oktober</MenuItem>
            <MenuItem value={10}>November</MenuItem>
            <MenuItem value={11}>Dezember</MenuItem>
          </Select>
          <Select
            sx={{ backgroundColor: "white" }}
            style={{ marginTop: "10px", marginBottom: "10px" }}
            value={year}
            onChange={(event) => setYear(event.target.value as number)}
          >
            {Array.from(
              { length: new Date().getFullYear() - START_YEAR + 1 },
              (_, i) => (
                <MenuItem key={i} value={i + START_YEAR}>
                  {i + START_YEAR}
                </MenuItem>
              )
            )}
          </Select>
          <Button
            variant="contained"
            onClick={() => getMonthlyOverview()}
            style={{ marginBottom: "1rem" }}
          >
            Monatsübersicht exportieren
          </Button>
          <Button variant="contained" onClick={() => getDetailedMonth()}>
            Detaillierter Monatsexport
          </Button>
        </div>
      </AccordionDetails>

      <Snackbar
        className="snackbar"
        open={error !== null}
        autoHideDuration={3000}
        onClose={handleClose}
      >
        <Alert onClose={handleClose} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </Accordion>
  );
}
