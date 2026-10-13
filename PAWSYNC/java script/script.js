
(() => {
  const setStatus = (form, message) => {
    const status = form.querySelector("[data-form-status]");
    if (status) status.textContent = message;
  };

  const appendRecord = (list, values) => {
    const row = document.createElement("tr");
    values.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });
    list.appendChild(row);
  };

  const readRecords = (key) => {
    const stored = localStorage.getItem(key);
    if (stored === null) return [];

    const records = JSON.parse(stored);
    if (!Array.isArray(records) || records.some((record) =>
      !Array.isArray(record) || record.some((value) => typeof value !== "string")
    )) {
      throw new Error("Saved entries have an invalid format.");
    }
    return records;
  };

  document.querySelectorAll("[data-table-search]").forEach((input) => {
    const list = document.getElementById(input.dataset.searchTarget);
    if (!list) return;

    input.addEventListener("input", () => {
      const query = input.value.trim().toLocaleLowerCase();
      list.querySelectorAll("tr").forEach((row) => {
        row.hidden = !row.textContent.toLocaleLowerCase().includes(query);
      });
    });
  });

  document.querySelectorAll("[data-create-form]").forEach((form) => {
    const list = document.getElementById(form.dataset.listId);
    const key = form.dataset.storageKey;
    if (!list || !key) return;

    try {
      readRecords(key).forEach((record) => appendRecord(list, record));
    } catch (error) {
      setStatus(form, `Saved entries could not be loaded: ${error.message}`);
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = Array.from(form.querySelectorAll("input, select, textarea"))
        .map((field) => field.value.trim());

      try {
        const records = readRecords(key);
        records.push(values);
        localStorage.setItem(key, JSON.stringify(records));
        appendRecord(list, values);
        form.reset();
        setStatus(form, "Entry saved in this browser.");
      } catch (error) {
        setStatus(form, `Entry was not saved: ${error.message}`);
      }
    });
  });

  document.querySelectorAll("[data-print]").forEach((button) => {
    button.addEventListener("click", () => window.print());
  });
})();
