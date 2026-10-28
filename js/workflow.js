
import { db, localDB } from './config.js';

export function initResizableTables() {
  document.querySelectorAll('table.resizable-table th').forEach(th => {
    if (th.querySelector('.col-resizer')) return;
    const resizer = document.createElement('div');
    resizer.className = 'col-resizer';
    resizer.title = 'ចុចអូសទាញដើម្បីពង្រីក ឬបង្រួមជួរឈរ';
    th.appendChild(resizer);

    let startX = 0, startWidth = 0;
    const onMouseMove = (e) => {
      const newWidth = Math.max(60, startWidth + (e.pageX - startX));
      th.style.width = newWidth + 'px';
      th.style.minWidth = newWidth + 'px';
    };
    const onMouseUp = () => {
      resizer.classList.remove('resizing');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    resizer.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      startX = e.pageX;
      startWidth = th.offsetWidth;
      resizer.classList.add('resizing');
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  });
}
