export function initResizableTables() {
  document.querySelectorAll('table.resizable-table th').forEach(th => {
    if (th.querySelector('.col-resizer')) return;
    const resizer = document.createElement('div');
    resizer.className = 'col-resizer';
    th.appendChild(resizer);
  });
}
