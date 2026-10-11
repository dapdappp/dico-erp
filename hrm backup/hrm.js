document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('menuToggle');
    if (toggle && sidebar) {
        toggle.addEventListener('click', function () {
            sidebar.classList.toggle('open');
        });
    }

    const showEmployeeForm = document.getElementById('showEmployeeForm');
    const employeePanel = document.getElementById('employeeFormPanel');
    if (showEmployeeForm && employeePanel) {
        showEmployeeForm.addEventListener('click', () => {
            employeePanel.hidden = !employeePanel.hidden;
        });
    }

    const employeeForm = document.getElementById('employeeForm');
    if (employeeForm) {
        employeeForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const values = new FormData(employeeForm);
            const row = document.createElement('tr');
            [values.get('name'), values.get('position'), values.get('email')].forEach(value => {
                const cell = document.createElement('td');
                cell.textContent = value;
                row.appendChild(cell);
            });
            const status = document.createElement('td');
            const tag = document.createElement('span');
            tag.className = 'tag tag-green';
            tag.textContent = 'Aktif';
            status.appendChild(tag);
            row.appendChild(status);
            document.querySelector('#employeeTable tbody').appendChild(row);
            employeeForm.reset();
            employeePanel.hidden = true;
        });
    }

    const showRegistrationForm = document.getElementById('showRegistrationForm');
    const registrationPanel = document.getElementById('registrationFormPanel');
    if (showRegistrationForm && registrationPanel) {
        showRegistrationForm.addEventListener('click', () => {
            registrationPanel.hidden = !registrationPanel.hidden;
        });
    }

    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const values = new FormData(registrationForm);
            const row = document.createElement('tr');
            [values.get('name'), values.get('event'), values.get('email')].forEach(value => {
                const cell = document.createElement('td');
                cell.textContent = value;
                row.appendChild(cell);
            });
            const status = document.createElement('td');
            const tag = document.createElement('span');
            tag.className = 'tag tag-green';
            tag.textContent = 'Terdaftar';
            status.appendChild(tag);
            row.appendChild(status);
            document.querySelector('#registrationTable tbody').appendChild(row);
            registrationForm.reset();
            registrationPanel.hidden = true;
        });
    }

    const eventButton = document.getElementById('showEventMessage');
    const eventMessage = document.getElementById('eventMessage');
    if (eventButton && eventMessage) {
        eventButton.addEventListener('click', () => {
            eventMessage.textContent = 'Form tambah event belum dibuat. Ini masih versi demo.';
        });
    }
});
