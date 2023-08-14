import {
  TextFieldProps,
  Button,
  TextField,
  styled,
  Select,
  MenuItem,
} from "@mui/material";
import { useSnackbar } from "notistack";
import React, { useMemo, useRef, useState } from "react";
import plzData from "./plz.json";
import { countryList, googleUrl } from "./data";

const defaultCountry = "Deutschland";
const defaultCount = 1;

const PeopleInput = styled(TextField)({
  "& .MuiInputBase-input": {
    fontSize: "2rem",
  },
});

const PLZTextField = styled(TextField)({
  "& .MuiInputBase-input": {
    fontSize: "2rem",
    letterSpacing: "1rem",
    innerWidth: "100px",
  },
});

const PLZInput = React.forwardRef<HTMLDivElement, TextFieldProps>(
  (props, ref) => {
    return (
      <PLZTextField
        ref={ref}
        {...props}
        inputProps={{
          maxLength: 5,
          style: { textAlign: "center" },
          inputMode: "numeric",
        }}
      />
    );
  }
);

export function Input() {
  const [plz, setPlz] = useState("");
  const [country, setCountry] = useState(defaultCountry);
  const [peopleCount, setPeopleCount] = useState(
    (defaultCount as number) || ""
  );

  const [loading, setLoading] = useState(false);

  const numbersRegex = /^[0-9\b]+$/;
  const inputRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const options = useMemo(() => countryList, []);

  function CountryInput() {
    return (
      <div className="dropdown">
        <Select
          onChange={(event) => {
            setCountry(event.target.value);
            setPlz("");
          }}
          disabled={loading}
          value={country}
          children={options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        />
      </div>
    );
  }

  async function sendInput(
    title: string,
    location: {
      bundesland: string;
      landkreis: string;
      luftlinie: string;
    },
    anzahl: number
  ) {
    try {
      setLoading(true);
      const response = await fetch(googleUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: "add",
          data: {
            plz: title,
            bundesland: location.bundesland,
            landkreis: location.landkreis,
            luftlinie: location.luftlinie,
            anzahl,
          },
          password: localStorage.getItem("password") || "",
        }),
      });
      setLoading(false);
      if (response.status !== 200) {
        if (response.status === 403) {
          localStorage.setItem("password", "invalid");
          window.location.reload();
        }

        throw new Error(
          response.status.toString() + " - " + response.statusText
        );
      } else {
        enqueueSnackbar(title + "  hinzugefügt", { variant: "success" });
      }
    } catch (e) {
      enqueueSnackbar("Fehler beim Senden: " + e);
      console.error(e);
      setError(true);
      setLoading(false);
      return;
    }
  }

  function verifyInput() {
    if (peopleCount === "") {
      enqueueSnackbar("Anzahl muss eine Zahl sein");
      setError(true);
      return;
    }
    if (country !== defaultCountry) {
      return {
        title: country,
        location: {
          bundesland: "-",
          landkreis: "-",
          luftlinie: "-",
        },
        anzahl: peopleCount,
      };
    } else {
      if (plz.length !== 5) {
        enqueueSnackbar("PLZ muss 5-stellig sein");
        setError(true);
        return;
      }
      const location = plzData[plz as keyof typeof plzData];
      if (!location) {
        enqueueSnackbar("PLZ nicht gefunden: " + plz);
        setError(true);
        return;
      }
      return {
        title: plz,
        location: {
          bundesland: location.bundesland,
          landkreis: location.landkreis,
          luftlinie: location.luftlinie,
        },
        anzahl: peopleCount,
      };
    }
  }

  async function submitInput() {
    if (inputRef.current) inputRef.current.focus();

    const data = verifyInput();
    if (!data) return;
    closeSnackbar();
    await sendInput(data.title, data.location, data.anzahl as number);

    setPlz("");
    setCountry(defaultCountry);
    setPeopleCount(defaultCount);
    setError(false);
  }

  return (
    <div className="App">
      <h1>PLZ Erfassung</h1>
      <div className="input">
        <PLZInput
          style={{ width: "200px", textAlign: "center" }}
          ref={inputRef}
          value={plz}
          onSubmit={submitInput}
          error={error}
          disabled={country !== defaultCountry || loading}
          placeholder={country !== defaultCountry ? "---" : "PLZ"}
          onKeyDown={(e) => e.key === "Enter" && submitInput()}
          onChange={(e) => {
            if (e.target.value === "") {
              setPlz("");
            } else if (numbersRegex.test(e.target.value)) {
              setPlz(e.target.value);
            }
          }}
        />
        <div className="countInput">
          <PeopleInput
            type="number"
            value={peopleCount}
            inputProps={{
              min: 1,
              max: 999,
              maxLength: 3,
              inputMode: "numeric",
            }}
            disabled={loading}
            onChange={(e) => {
              if (e.target.value === "") {
                setPeopleCount("");
              } else {
                setPeopleCount(parseInt(e.target.value));
              }
            }}
          />
        </div>
        <CountryInput />
      </div>

      {loading && <div className="loading">Loading...</div>}
      <Button
        variant="contained"
        onClick={submitInput}
        className="submit"
        disabled={loading}
      >
        Abschicken
      </Button>
    </div>
  );
}
