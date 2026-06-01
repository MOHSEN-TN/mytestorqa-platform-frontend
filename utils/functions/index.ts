import { createProject, fetchProjects } from "@/lib/slices/projectSlice";

/* eslint-disable @typescript-eslint/no-explicit-any */
export  const handleExport = (data: any, dataName: string, cols: any) => {
    const csv = [cols.join(","), ...data.map((p) =>
      cols.map((c) => JSON.stringify(String((p as any)[c] ?? ""))).join(",")
    )].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = dataName+".csv"; a.click();
  };
export  const parseCSV = (text: string) => {
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const vals = line.match(/(".*?"|[^,]+)/g) ?? [];
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => (obj[h] = (vals[i] ?? "").replace(/"/g, "").trim()));
      return obj;
    }).filter((r) => r.name);
  };


export  const handleImportFile = async (file: File,data: any, t:any, dispatch: any) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const text = await file.text();
    let list: Record<string, string>[];
    try {
      list = ext === "json" ? JSON.parse(text) : ext === "csv" ? parseCSV(text) : (() => { throw new Error(); })();
    } catch { alert(t("import.invalid")); return; }

    const validRows = list.filter((r) => r.name?.trim());
    if (!validRows.length) { alert(t("import.noValid")); return; }

    const existingNames = new Set(data.map((p: any) => p.name.trim().toLowerCase()));
    const duplicates: string[] = [];
    const toImport: Record<string, string>[] = [];
    for (const row of validRows) {
      (existingNames.has(row.name.trim().toLowerCase()) ? duplicates : toImport).push(row as any);
    }

    let msg = "";
    if (duplicates.length) {
      msg += t("import.duplicateWarning", { count: duplicates.length }) +
        "\n" + (duplicates as any[]).map((d: any) => `  • ${typeof d === "string" ? d : d.name}`).join("\n") + "\n\n";
    }
    if (!toImport.length) { alert(msg + t("import.nothingNew")); return; }
    msg += t("import.confirmImport", { count: toImport.length });
    if (!window.confirm(msg)) return;
    for (const row of toImport) await dispatch(createProject({ name: row.name.trim() }));
    dispatch(fetchProjects());
  };