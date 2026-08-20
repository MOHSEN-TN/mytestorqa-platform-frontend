export type CsvRow = Record<string, string>;

export const handleExport = <T extends object>(
  data: T[],
  dataName: string,
  cols: readonly (keyof T)[],
): void => {
  const escapeCsvValue = (value: unknown): string => {
    const stringValue = String(value ?? "");

    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const csvRows = [
    cols.map((column) => escapeCsvValue(String(column))).join(","),
    ...data.map((row) =>
      cols
        .map((column) => escapeCsvValue(row[column]))
        .join(","),
    ),
  ];

  const csv = `\uFEFF${csvRows.join("\n")}`;

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `${dataName}.csv`;

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
};

export const handleImportFile = (
  file: File,
): Promise<CsvRow[]> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Aucun fichier sélectionné."));
      return;
    }

    const isCsv =
      file.type === "text/csv" ||
      file.name.toLowerCase().endsWith(".csv");

    if (!isCsv) {
      reject(new Error("Le fichier doit être au format CSV."));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const content =
          typeof reader.result === "string" ? reader.result : "";

        const normalizedContent = content
          .replace(/^\uFEFF/, "")
          .trim();

        if (!normalizedContent) {
          resolve([]);
          return;
        }

        const lines = normalizedContent
          .split(/\r?\n/)
          .filter((line) => line.trim().length > 0);

        if (lines.length < 2) {
          resolve([]);
          return;
        }

        const parseCsvLine = (line: string): string[] => {
          const values: string[] = [];
          let currentValue = "";
          let insideQuotes = false;

          for (let index = 0; index < line.length; index += 1) {
            const character = line[index];
            const nextCharacter = line[index + 1];

            if (
              character === '"' &&
              insideQuotes &&
              nextCharacter === '"'
            ) {
              currentValue += '"';
              index += 1;
              continue;
            }

            if (character === '"') {
              insideQuotes = !insideQuotes;
              continue;
            }

            if (character === "," && !insideQuotes) {
              values.push(currentValue.trim());
              currentValue = "";
              continue;
            }

            currentValue += character;
          }

          values.push(currentValue.trim());

          return values;
        };

        const headers = parseCsvLine(lines[0]).map((header) =>
          header.trim(),
        );

        const rows = lines.slice(1).map((line) => {
          const values = parseCsvLine(line);

          return headers.reduce<CsvRow>(
            (row, header, index) => {
              row[header] = values[index] ?? "";
              return row;
            },
            {},
          );
        });

        resolve(rows);
      } catch {
        reject(new Error("Impossible de lire le fichier CSV."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Erreur lors de la lecture du fichier."));
    };

    reader.readAsText(file, "utf-8");
  });
};