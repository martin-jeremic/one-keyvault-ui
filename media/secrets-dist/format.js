export function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
export function toLocalInputValue(value) {
    if (!value)
        return "";
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()))
        return "";
    const pad = (num) => String(num).padStart(2, "0");
    return (date.getFullYear() +
        "-" +
        pad(date.getMonth() + 1) +
        "-" +
        pad(date.getDate()) +
        "T" +
        pad(date.getHours()) +
        ":" +
        pad(date.getMinutes()));
}
